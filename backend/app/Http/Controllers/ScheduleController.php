<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Curriculum;
use App\Models\Section;
use App\Models\Course;
use App\Models\Faculty;
use App\Services\AutoScheduleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    /**
     * Get all schedules (with filters).
     */
    public function index(Request $request)
    {
        $query = Schedule::with(['course', 'faculty.user', 'section.program']);

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('faculty_id')) {
            $query->where('faculty_id', $request->faculty_id);
        }

        return response()->json($query->get());
    }

    /**
     * Get courses from curriculum based on section's program and year level.
     */
    public function getCurriculumCourses(Request $request)
    {
        $request->validate(['section_id' => 'required|exists:sections,id']);
        
        $section = Section::find($request->section_id);
        
        $courses = Curriculum::where('program_id', $section->program_id)
            ->where('year_level', $section->year_level)
            ->with('course')
            ->get()
            ->pluck('course');

        return response()->json($courses);
    }

    /**
     * Store a new schedule entry (faculty assignment is optional).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'course_id' => 'required|exists:courses,id',
            'faculty_id' => 'nullable|exists:faculty,id',
            'section_id' => 'required|exists:sections,id',
            'dayOfWeek' => 'required|string',
            'startTime' => 'required',
            'endTime' => 'required',
            'room' => 'required|string',
            'class_type' => 'required|in:lec,lab',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Conflict check ONLY if faculty_id is provided
        if ($request->filled('faculty_id')) {
            $conflict = Schedule::where('faculty_id', $request->faculty_id)
                ->where('dayOfWeek', $request->dayOfWeek)
                ->where(function($q) use ($request) {
                    $q->where(function($sub) use ($request) {
                        $sub->where('startTime', '<', $request->endTime)
                            ->where('endTime', '>', $request->startTime);
                    });
                })
                ->exists();

            if ($conflict) {
                return response()->json(['message' => 'Faculty has a schedule conflict at this time.'], 422);
            }
        }

        // Section conflict check
        $sectionConflict = Schedule::where('section_id', $request->section_id)
            ->where('dayOfWeek', $request->dayOfWeek)
            ->where(function($q) use ($request) {
                $q->where(function($sub) use ($request) {
                    $sub->where('startTime', '<', $request->endTime)
                        ->where('endTime', '>', $request->startTime);
                });
            })
            ->exists();

        if ($sectionConflict) {
            return response()->json(['message' => 'Section already has a class scheduled at this time.'], 422);
        }

        $schedule = Schedule::create($request->all());

        return response()->json([
            'message' => 'Schedule created successfully.',
            'data' => $schedule->load(['course', 'faculty.user', 'section.program'])
        ], 201);
    }

    /**
     * Assign faculty to an existing schedule (updates all instances of this course in this section).
     */
    public function assignFaculty(Request $request, $id)
    {
        $request->validate(['faculty_id' => 'required|exists:faculty,id']);
        
        $targetSchedule = Schedule::findOrFail($id);
        
        // Find all schedules for the SAME course in the SAME section
        $relatedSchedules = Schedule::where('section_id', $targetSchedule->section_id)
            ->where('course_id', $targetSchedule->course_id)
            ->get();

        $conflicts = [];
        $facultyId = $request->faculty_id;

        // Check conflicts for EVERY related slot
        foreach ($relatedSchedules as $sched) {
            $conflict = Schedule::where('faculty_id', $facultyId)
                ->where('dayOfWeek', $sched->dayOfWeek)
                ->where('id', '!=', $sched->id) // Exclude current slot being checked
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
            return response()->json([
                'message' => 'Faculty has schedule conflicts at these times: ' . implode(', ', $conflicts),
            ], 422);
        }

        // Update all related instances
        Schedule::where('section_id', $targetSchedule->section_id)
            ->where('course_id', $targetSchedule->course_id)
            ->update(['faculty_id' => $facultyId]);

        return response()->json([
            'message' => 'Faculty assigned to all ' . $relatedSchedules->count() . ' sessions successfully.',
        ]);
    }

    /**
     * Import schedules via CSV.
     * Expected CSV headers: course_code, section_name, day, start_time, end_time, room, faculty_email (optional)
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $importedCount = 0;
        $errors = [];
        $rowNum = 1;

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;
                if (count($row) < 6) continue;

                $data = array_combine($header, $row);
                
                $course = Course::where('course_code', $data['course_code'])->first();
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

                Schedule::create([
                    'course_id' => $course->id,
                    'faculty_id' => $faculty ? $faculty->id : null,
                    'section_id' => $section->id,
                    'dayOfWeek' => $data['day'],
                    'startTime' => $data['start_time'],
                    'endTime' => $data['end_time'],
                    'room' => $data['room'],
                ]);
                $importedCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
        } finally {
            fclose($handle);
        }

        return response()->json([
            'message' => "Successfully imported $importedCount schedule entries.",
            'errors' => $errors
        ]);
    }

    /**
     * Auto-generate schedules based on curriculum.
     */
    public function autoGenerate(Request $request, AutoScheduleService $autoScheduleService)
    {
        $request->validate([
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
        ]);

        try {
            $result = $autoScheduleService->generate(
                $request->program_id,
                $request->year_level,
                $request->semester
            );

            if (!$result['success']) {
                return response()->json([
                    'message' => 'Failed to generate a conflict-free schedule.',
                    'conflicts' => $result['conflicts']
                ], 422);
            }

            return response()->json([
                'message' => "Schedules generated successfully for {$result['section_count']} sections ({$result['student_count']} students detected).",
                'count' => count($result['schedules']),
                'student_count' => $result['student_count'],
                'section_count' => $result['section_count']
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete schedules for a specific course in a section.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'course_id' => 'required|exists:courses,id',
            'class_type' => 'required|string',
        ]);

        Schedule::where('section_id', $request->section_id)
            ->where('course_id', $request->course_id)
            ->where('class_type', $request->class_type)
            ->delete();

        return response()->json(['message' => 'Schedules removed successfully.']);
    }

    /**
     * Remove a schedule entry.
     */
    public function destroy($id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();

        return response()->json(['message' => 'Schedule removed.']);
    }
}
