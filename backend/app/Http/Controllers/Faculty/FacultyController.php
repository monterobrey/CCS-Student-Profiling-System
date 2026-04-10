<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Department;
use App\Services\FacultyService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Faculty management controller.
 * Handles CRUD operations and imports for faculty members.
 */
class FacultyController extends Controller
{
    protected $facultyService;

    public function __construct(FacultyService $facultyService)
    {
        $this->facultyService = $facultyService;
    }

    /**
     * Get students handled by authenticated faculty.
     */
    public function myStudents(Request $request)
    {
        $result = $this->facultyService->getMyStudents($request->user()->faculty->id);
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

        $file = $request->file('file');
        ini_set('auto_detect_line_endings', true);
        $handle = fopen($file->getRealPath(), 'r');
        fgetcsv($handle); // Skip header

        $imported = 0;
        $errors = [];
        $row = 2;
        $department = Department::firstOrCreate(['department_name' => 'College of Computing Studies']);

        while (($data = fgetcsv($handle)) !== FALSE) {
            if (empty($data) || (count($data) === 1 && empty($data[0]))) continue;

            try {
                if (count($data) < 5) {
                    throw new \Exception("Expected 5 columns: first_name, last_name, middle_name, email, position");
                }

                $this->facultyService->createFaculty([
                    'first_name' => trim($data[0]),
                    'last_name' => trim($data[1]),
                    'middle_name' => trim($data[2]) ?: null,
                    'email' => trim($data[3]),
                    'position' => trim($data[4]),
                    'department_id' => $department->id,
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row $row: " . $e->getMessage();
            }
            $row++;
        }
        fclose($handle);

        return ApiResponse::success(
            ['imported' => $imported, 'errors' => $errors],
            "$imported faculty members imported"
        );
    }
}

