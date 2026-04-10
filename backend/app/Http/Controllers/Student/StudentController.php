<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Program;
use App\Models\Section;
use App\Models\Department;
use App\Services\StudentService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Student management controller.
 * Handles CRUD operations, profile management, and imports.
 */
class StudentController extends Controller
{
    protected $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
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
                if (count($data) < 8) {
                    throw new \Exception("Expected 8 columns");
                }

                $studentNumber = trim($data[0]);
                $firstName = trim($data[1]);
                $lastName = trim($data[2]);
                $middleName = trim($data[3]) ?: null;
                $email = trim($data[4]);
                $programCode = trim($data[5]);
                $year = (int)trim($data[6]);
                $sectionChar = trim($data[7]);

                if (empty($studentNumber) || empty($firstName) || empty($lastName) || empty($email)) {
                    throw new \Exception("Missing required fields");
                }

                if ($year < 1 || $year > 4) {
                    throw new \Exception("Year level must be 1-4");
                }

                // Get or create program
                $program = Program::firstOrCreate(
                    ['program_code' => $programCode, 'department_id' => $department->id],
                    ['program_name' => $this->getProgramName($programCode)]
                );

                // Get or create section
                $sectionName = "$programCode $year-$sectionChar";
                $section = Section::firstOrCreate(
                    ['section_name' => $sectionName, 'program_id' => $program->id, 'department_id' => $department->id],
                    ['year_level' => $year, 'school_year' => '2026-2027']
                );

                // Create student
                $this->studentService->createStudent([
                    'student_number' => $studentNumber,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $middleName,
                    'email' => $email,
                    'program_id' => $program->id,
                    'section_id' => $section->id,
                    'year_level' => $year,
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
            "$imported students imported"
        );
    }

    /**
     * Helper to map program code to full name.
     */
    private function getProgramName($code)
    {
        return [
            'BSIT' => 'Bachelor of Science in Information Technology',
            'BSCS' => 'Bachelor of Science in Computer Science',
            'BSDED' => 'Bachelor of Science in Data Engineering and Design',
        ][$code] ?? $code;
    }
}

