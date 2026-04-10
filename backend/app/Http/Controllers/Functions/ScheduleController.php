<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\ScheduleService;
use App\Services\AutoScheduleService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    protected $scheduleService;
    protected $autoScheduleService;

    public function __construct(ScheduleService $scheduleService, AutoScheduleService $autoScheduleService)
    {
        $this->scheduleService = $scheduleService;
        $this->autoScheduleService = $autoScheduleService;
    }

    /**
     * Get all schedules (with filters).
     */
    public function index(Request $request)
    {
        $schedules = $this->scheduleService->getAllSchedules($request->input('section_id'), $request->input('faculty_id'));
        return ApiResponse::success($schedules);
    }

    /**
     * Get courses from curriculum based on section's program and year level.
     */
    public function getCurriculumCourses(Request $request)
    {
        $sectionId = $request->validate(['section_id' => 'required|exists:sections,id'])['section_id'];
        $courses = $this->scheduleService->getCurriculumCourses($sectionId);
        return ApiResponse::success($courses);
    }

    /**
     * Store a new schedule entry (faculty assignment is optional).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'faculty_id' => 'nullable|exists:faculty,id',
            'section_id' => 'required|exists:sections,id',
            'dayOfWeek' => 'required|string',
            'startTime' => 'required',
            'endTime' => 'required',
            'room' => 'required|string',
            'class_type' => 'required|in:lec,lab',
        ]);

        try {
            $schedule = $this->scheduleService->createSchedule($data);
            return ApiResponse::success($schedule, 'Schedule created successfully.', 201);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    /**
     * Assign faculty to an existing schedule (updates all instances of this course in this section).
     */
    public function assignFaculty(Request $request, $id)
    {
        $facultyId = $request->validate(['faculty_id' => 'required|exists:faculty,id'])['faculty_id'];

        try {
            $count = $this->scheduleService->assignFacultyToSchedules($id, $facultyId);
            return ApiResponse::success(null, "Faculty assigned to all $count sessions successfully.");
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    /**
     * Import schedules via CSV.
     */
    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);

        try {
            $result = $this->scheduleService->importSchedulesFromCsv($request->file('file'));
            return ApiResponse::success(['errors' => $result['errors']], "Successfully imported {$result['imported']} schedules.");
        } catch (\Exception $e) {
            return ApiResponse::error('Import failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Auto-generate schedules based on curriculum and section load.
     */
    public function autoGenerate(Request $request)
    {
        $data = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|integer|between:1,4',
            'semester' => 'required|string|in:1st,2nd,Summer',
        ]);

        try {
            $result = $this->autoScheduleService->generate(
                (int) $data['program_id'],
                (string) $data['year_level'],
                $data['semester']
            );

            if (!($result['success'] ?? false)) {
                return ApiResponse::error('Auto-generation failed due to scheduling conflicts.', 422, $result['conflicts'] ?? []);
            }

            return ApiResponse::success($result, 'Schedules auto-generated successfully.');
        } catch (\Exception $e) {
            return ApiResponse::error('Auto-generation failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Bulk delete schedules.
     */
    public function bulkDelete(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:schedules,id',
        ]);

        $deletedCount = $this->scheduleService->bulkDeleteSchedules($data['ids']);
        return ApiResponse::success(['deleted' => $deletedCount], 'Schedules deleted successfully.');
    }

    /**
     * Delete one schedule entry.
     */
    public function destroy($id)
    {
        $this->scheduleService->deleteSchedule($id);
        return ApiResponse::success(null, 'Schedule deleted successfully.');
    }
}

