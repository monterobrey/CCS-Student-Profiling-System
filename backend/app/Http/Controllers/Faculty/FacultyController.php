<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Services\FacultyService;
use App\Services\FacultyImportService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

/**
 * Faculty management controller.
 * Handles CRUD operations and imports for faculty members.
 */
class FacultyController extends Controller
{
    protected $facultyService;
    protected $facultyImportService;

    public function __construct(FacultyService $facultyService, FacultyImportService $facultyImportService)
    {
        $this->facultyService = $facultyService;
        $this->facultyImportService = $facultyImportService;
    }

    /**
     * Get students handled by authenticated faculty.
     */
    public function myStudents(Request $request)
    {
        $result = $this->facultyService->getMyStudents(
            $request->user()->faculty->id,
            $request->only(['search', 'program', 'section', 'subject'])
        );
        return ApiResponse::success($result);
    }

    /**
     * Get violations reported by authenticated faculty.
     */
    public function myViolations(Request $request)
    {
        $violations = $this->facultyService->getMyViolations($request->user()->faculty->id);
        return ApiResponse::success($violations);
    }

    /**
     * Record student violations.
     */
    public function storeViolation(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'violationType' => 'required|string',
            'severity' => 'required|in:Minor,Moderate,Major',
            'description' => 'required|string',
            'dateReported' => 'required|date',
            'incident_time' => 'nullable|string',
            'location' => 'nullable|string',
            'course_id' => 'nullable|exists:courses,id',
        ]);

        $violations = $this->facultyService->recordViolations(
            $request->user()->faculty->id,
            $validated
        );

        return ApiResponse::success(
            ['count' => count($violations)],
            count($violations) . ' violations recorded',
            201
        );
    }

    /**
     * List all faculty.
     */
    public function index()
    {
        $faculty = Faculty::with(['user', 'department', 'expertise', 'organizations', 'schedules.course', 'schedules.section'])->get();
        return ApiResponse::success($faculty);
    }

    /**
     * Create a new faculty member.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'department_id' => 'required|exists:departments,id',
            'position' => 'required|string|max:255',
        ]);

        $faculty = $this->facultyService->createFaculty($validated);

        return ApiResponse::success(
            $faculty,
            'Faculty member created. Check email for account setup.',
            201
        );
    }

    /**
     * Update a faculty member.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'position' => 'required|string|max:255',
        ]);

        $faculty = $this->facultyService->updateFaculty($id, $validated);

        return ApiResponse::success($faculty, 'Faculty updated');
    }

    /**
     * Resend setup email to a pending faculty member.
     */
    public function resendSetup($id)
    {
        try {
            $this->facultyService->resendSetupEmail($id);
            return ApiResponse::success(null, 'Setup email resent successfully.');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    /**
     * Delete/archive a faculty member.
     */
    public function destroy(Request $request, $id)
    {
        $this->facultyService->archiveFaculty($id, $request->user()->id);
        return ApiResponse::success(null, 'Faculty archived');
    }

    /**
     * Import faculty from CSV file.
     * CSV columns: first_name, last_name, middle_name, email, position
     */
    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);

        $result = $this->facultyImportService->importFromFile($request->file('file')->getRealPath());

        return ApiResponse::success(
            ['imported' => $result['imported_count'], 'errors' => $result['errors']],
            "{$result['imported_count']} faculty members imported"
        );
    }
}

