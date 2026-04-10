<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\StudentService;
use App\Services\StudentImportService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

/**
 * Student management controller.
 * Handles CRUD operations, profile management, and imports.
 */
class StudentController extends Controller
{
    protected $studentService;
    protected $studentImportService;

    public function __construct(StudentService $studentService, StudentImportService $studentImportService)
    {
        $this->studentService = $studentService;
        $this->studentImportService = $studentImportService;
    }

    /**
     * Get authenticated student's profile.
     */
    public function profile(Request $request)
    {
        $profile = $this->studentService->getStudentProfile($request->user()->student->id);
        return ApiResponse::success($profile);
    }

    /**
     * Update authenticated student's profile.
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'middle_name' => 'nullable|string',
            'gender' => 'nullable|string',
            'birthdate' => 'nullable|date',
            'civil_status' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $student = $this->studentService->updateStudentProfile($request->user()->student->id, $validated);

        return ApiResponse::success($student, 'Profile updated');
    }

    /**
     * List all students.
     */
    public function index()
    {
        $students = Student::with(['user', 'program', 'section', 'guardian'])->get();
        return ApiResponse::success($students);
    }

    /**
     * Create a new student.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'student_number' => 'required|string|unique:users,student_number',
            'email' => 'required|email|unique:users,email',
            'program_id' => 'required|exists:programs,id',
            'section_id' => 'required|exists:sections,id',
            'year_level' => 'required|integer|between:1,4',
            'guardian.first_name' => 'nullable|string|max:255',
            'guardian.last_name' => 'nullable|string|max:255',
            'guardian.contact_number' => 'nullable|string',
            'guardian.relationship' => 'nullable|string',
        ]);

        $student = $this->studentService->createStudent($validated);

        return ApiResponse::success($student, 'Student created. Check email for account setup.', 201);
    }

    /**
     * Update a student's details.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'year_level' => 'nullable|integer|between:1,4',
            'section_id' => 'nullable|exists:sections,id',
        ]);

        $student = Student::findOrFail($id);
        $student->update($validated);

        return ApiResponse::success($student, 'Student updated');
    }

    /**
     * Delete/archive a student.
     */
    public function destroy(Request $request, $id)
    {
        $this->studentService->archiveStudent($id, $request->user()->id);
        return ApiResponse::success(null, 'Student archived');
    }

    /**
     * Import students from CSV file.
     * CSV columns: student_number, first_name, last_name, middle_name, email, program_code, year_level, section_char
     */
    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);

        $result = $this->studentImportService->importFromFile($request->file('file')->getRealPath());

        return ApiResponse::success(
            ['imported' => $result['imported_count'], 'errors' => $result['errors']],
            "{$result['imported_count']} students imported"
        );
    }
}

