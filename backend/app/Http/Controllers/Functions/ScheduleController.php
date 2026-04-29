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
     * Chair: automatically scoped to their program.
     */
    public function index(Request $request)
    {
        $user      = $request->user();
        $programId = null;

        if ($user->isDepartmentChair() && $user->faculty) {
            $programId = $user->faculty->program_id;
        }

        $schedules = $this->scheduleService->getAllSchedules(
            $request->input('section_id'),
            $request->input('faculty_id'),
            $programId
        );
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
     * Assign faculty to a schedule slot, mirroring to the paired type (LAB↔LEC) if conflict-free.
     */
    public function assignFaculty(Request $request, $id)
    {
        $facultyId = $request->validate(['faculty_id' => 'required|exists:faculty,id'])['faculty_id'];

        try {
            $result = $this->scheduleService->assignFacultyToSchedules($id, $facultyId);

            $message = $result['paired_assigned']
                ? "Faculty assigned to this slot and also mirrored to the {$result['paired_type']} session."
                : "Faculty assigned successfully.";

            return ApiResponse::success(['paired_assigned' => $result['paired_assigned'], 'paired_type' => $result['paired_type']], $message);
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
     * Chair: program_id is locked to their own program — cannot generate for others.
     */
    public function autoGenerate(Request $request)
    {
        $data = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|integer|between:1,4',
            'semester'   => 'required|string|in:1st,2nd,Summer',
        ]);

        $user = $request->user();

        // Chair can only generate for their own program
        if ($user->isDepartmentChair() && $user->faculty) {
            $chairProgramId = (int) $user->faculty->program_id;
            if ((int) $data['program_id'] !== $chairProgramId) {
                return ApiResponse::error('You can only generate schedules for your own program.', 403);
            }
        }

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

