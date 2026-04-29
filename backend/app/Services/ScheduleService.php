<?php

namespace App\Services;

use App\Models\Schedule;
use App\Models\Section;
use App\Models\Faculty;
use Illuminate\Support\Facades\DB;

/**
 * Service for schedule management operations.
 */
class ScheduleService
{
    /**
     * Get all schedules with optional filtering.
     * Chair: scoped to their program's sections only.
     */
    public function getAllSchedules($sectionId = null, $facultyId = null, $programId = null)
    {
        $query = Schedule::with(['course', 'faculty.user', 'section.program']);

        if ($sectionId) {
            $query->where('section_id', $sectionId);
        }

        if ($facultyId) {
            $query->where('faculty_id', $facultyId);
        }

        if ($programId) {
            $query->whereHas('section', fn($q) => $q->where('program_id', $programId));
        }

        return $query->get();
    }

    /**
     * Get curriculum courses for a section.
     */
    public function getCurriculumCourses($sectionId)
    {
        $section = Section::findOrFail($sectionId);
        
        return \App\Models\Curriculum::where('program_id', $section->program_id)
            ->where('year_level', $section->year_level)
            ->with('course')
            ->get()
            ->pluck('course');
    }

    /**
     * Create a new schedule with conflict checking.
     */
    public function createSchedule($data)
    {
        // Faculty conflict check
        if (!empty($data['faculty_id'])) {
            $conflict = Schedule::where('faculty_id', $data['faculty_id'])
                ->where('dayOfWeek', $data['dayOfWeek'])
                ->where(function($q) use ($data) {
                    $q->where(function($sub) use ($data) {
                        $sub->where('startTime', '<', $data['endTime'])
                            ->where('endTime', '>', $data['startTime']);
                    });
                })
                ->exists();

            if ($conflict) {
                throw new \Exception('Faculty has a schedule conflict at this time.');
            }
        }

        // Section conflict check
        $sectionConflict = Schedule::where('section_id', $data['section_id'])
            ->where('dayOfWeek', $data['dayOfWeek'])
            ->where(function($q) use ($data) {
                $q->where(function($sub) use ($data) {
                    $sub->where('startTime', '<', $data['endTime'])
                        ->where('endTime', '>', $data['startTime']);
                });
            })
            ->exists();

        if ($sectionConflict) {
            throw new \Exception('Section already has a class scheduled at this time.');
        }

        return Schedule::create($data)->load(['course', 'faculty.user', 'section.program']);
    }

    /**
     * Assign faculty to a specific schedule slot.
     * Also attempts to assign the same faculty to all slots of the paired
     * type (LAB↔LEC) for the same course+section, skipping any slot where
     * the faculty has a conflict.
     *
     * Returns an array with how many slots were updated and whether the
     * paired type was also fully assigned.
     */
    public function assignFacultyToSchedules($scheduleId, $facultyId)
    {
        $targetSchedule = Schedule::findOrFail($scheduleId);

        // Check for faculty conflict on this specific timeslot
        $conflict = Schedule::where('faculty_id', $facultyId)
            ->where('dayOfWeek', $targetSchedule->dayOfWeek)
            ->where('id', '!=', $targetSchedule->id)
            ->where(function ($q) use ($targetSchedule) {
                $q->where('startTime', '<', $targetSchedule->endTime)
                  ->where('endTime', '>', $targetSchedule->startTime);
            })
            ->exists();

        if ($conflict) {
            throw new \Exception(
                "Faculty has a schedule conflict on {$targetSchedule->dayOfWeek} at " .
                date('h:i A', strtotime($targetSchedule->startTime)) . '.'
            );
        }

        $targetSchedule->update(['faculty_id' => $facultyId]);
        $assigned = 1;
        $pairedAssigned = false;

        // Try to mirror the assignment to the paired type (LAB↔LEC) of the same course+section
        $pairedType = $targetSchedule->class_type === 'lec' ? 'lab' : 'lec';

        $pairedSlots = Schedule::where('section_id', $targetSchedule->section_id)
            ->where('course_id', $targetSchedule->course_id)
            ->where('class_type', $pairedType)
            ->whereNull('faculty_id')   // only touch unassigned slots
            ->get();

        if ($pairedSlots->isNotEmpty()) {
            $allPairedFit = true;

            foreach ($pairedSlots as $slot) {
                $pairedConflict = Schedule::where('faculty_id', $facultyId)
                    ->where('dayOfWeek', $slot->dayOfWeek)
                    ->where('id', '!=', $slot->id)
                    ->where(function ($q) use ($slot) {
                        $q->where('startTime', '<', $slot->endTime)
                          ->where('endTime', '>', $slot->startTime);
                    })
                    ->exists();

                if ($pairedConflict) {
                    $allPairedFit = false;
                    break;
                }
            }

            // Only mirror if the faculty is free on ALL paired slots
            if ($allPairedFit) {
                foreach ($pairedSlots as $slot) {
                    $slot->update(['faculty_id' => $facultyId]);
                    $assigned++;
                }
                $pairedAssigned = true;
            }
        }

        return [
            'assigned'       => $assigned,
            'paired_assigned' => $pairedAssigned,
            'paired_type'    => $pairedType,
        ];
    }

    /**
     * Import schedules from CSV.
     */
    public function importSchedulesFromCsv($file)
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $importedCount = 0;
        $errors = [];
        $rowNum = 1;

        DB::transaction(function () use (&$handle, &$header, &$importedCount, &$errors, &$rowNum) {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;
                if (count($row) < 6) continue;

                $data = array_combine($header, $row);
                
                $course = \App\Models\Course::where('course_code', $data['course_code'])->first();
                $section = Section::where('section_name', $data['section_name'])->first();
                
                $faculty = null;
                if (!empty($data['faculty_email'])) {
                    $faculty = Faculty::whereHas('user', function($q) use ($data) {
                        $q->where('email', $data['faculty_email']);
                    })->first();
                }

                if (!$course || !$section) {
                    $errors[] = "Row $rowNum: Course or Section not found.";
                    continue;
                }

                // Check for conflicts
                if ($faculty) {
                    $conflict = Schedule::where('faculty_id', $faculty->id)
                        ->where('dayOfWeek', $data['day'])
                        ->where(function($q) use ($data) {
                            $q->whereBetween('startTime', [$data['start_time'], $data['end_time']])
                              ->orWhereBetween('endTime', [$data['start_time'], $data['end_time']]);
                        })
                        ->exists();

                    if ($conflict) {
                        $errors[] = "Row $rowNum: Faculty conflict.";
                        continue;
                    }
                }

                Schedule::create([
                    'course_id' => $course->id,
                    'faculty_id' => $faculty->id ?? null,
                    'section_id' => $section->id,
                    'dayOfWeek' => $data['day'],
                    'startTime' => $data['start_time'],
                    'endTime' => $data['end_time'],
                    'room' => $data['room'],
                ]);

                $importedCount++;
            }
        });

        fclose($handle);

        return [
            'imported' => $importedCount,
            'errors' => $errors,
        ];
    }

    /**
     * Delete one schedule entry.
     */
    public function deleteSchedule($scheduleId): bool
    {
        $schedule = Schedule::findOrFail($scheduleId);
        return (bool) $schedule->delete();
    }

    /**
     * Bulk delete schedule entries by ids.
     */
    public function bulkDeleteSchedules(array $scheduleIds): int
    {
        return Schedule::whereIn('id', $scheduleIds)->delete();
    }
}
