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
     */
    public function getAllSchedules($sectionId = null, $facultyId = null)
    {
        $query = Schedule::with(['course', 'faculty.user', 'section.program']);

        if ($sectionId) {
            $query->where('section_id', $sectionId);
        }

        if ($facultyId) {
            $query->where('faculty_id', $facultyId);
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
     * Assign faculty to all instances of a course in a section.
     */
    public function assignFacultyToSchedules($scheduleId, $facultyId)
    {
        $targetSchedule = Schedule::findOrFail($scheduleId);
        
        $relatedSchedules = Schedule::where('section_id', $targetSchedule->section_id)
            ->where('course_id', $targetSchedule->course_id)
            ->get();

        $conflicts = [];

        foreach ($relatedSchedules as $sched) {
            $conflict = Schedule::where('faculty_id', $facultyId)
                ->where('dayOfWeek', $sched->dayOfWeek)
                ->where('id', '!=', $sched->id)
                ->where(function($q) use ($sched) {
                    $q->whereBetween('startTime', [$sched->startTime, $sched->endTime])
                      ->orWhereBetween('endTime', [$sched->startTime, $sched->endTime])
                      ->orWhere(function($sq) use ($sched) {
                          $sq->where('startTime', '<=', $sched->startTime)
                             ->where('endTime', '>=', $sched->endTime);
                      });
                })
                ->exists();

            if ($conflict) {
                $conflicts[] = "{$sched->dayOfWeek} at " . date('h:i A', strtotime($sched->startTime));
            }
        }

        if (!empty($conflicts)) {
            throw new \Exception('Faculty has schedule conflicts at these times: ' . implode(', ', $conflicts));
        }

        Schedule::where('section_id', $targetSchedule->section_id)
            ->where('course_id', $targetSchedule->course_id)
            ->update(['faculty_id' => $facultyId]);

        return $relatedSchedules->count();
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
