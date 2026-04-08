<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Section;
use App\Models\Course;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Notifications\SetupPasswordNotification;

use App\Models\Program;
use App\Models\StudentSkill;
use App\Models\Guardian;
use App\Models\StudentOrganization;
use App\Models\AcademicActivity;
use App\Models\NonAcademicActivity;

class StudentController extends Controller
{
    /**
     * Get the authenticated student's profile.
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $user->student()->with(['section.program', 'program', 'guardian', 'skills', 'organizations.organization', 'awards'])->first();
    }

    /**
     * Update student profile (nullable fields).
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = $user->student;

        $validated = $request->validate([
            'middle_name' => 'nullable|string',
            'gender' => 'nullable|string',
            'birthdate' => 'nullable|date',
            'civil_status' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $student->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'student' => $student->load(['section.program', 'program'])
        ]);
    }

    /**
     * Import students from CSV.
     */
    public function import(Request $request)
    {
        if (!$request->user()->isDean() && !$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        ini_set('auto_detect_line_endings', true);
        $handle = fopen($file->getRealPath(), 'r');
        fgetcsv($handle); // Skip header

        $imported = 0;
        $errors = [];
        $row = 2;

        while (($data = fgetcsv($handle)) !== FALSE) {
            if (empty($data) || (count($data) === 1 && empty($data[0]))) continue;

            try {
                if (count($data) < 8) {
                    throw new \Exception("Insufficient columns. Expected 8.");
                }

                $studentNumber = trim($data[0]);
                $firstName = trim($data[1]);
                $lastName = trim($data[2]);
                $middleName = trim($data[3]) ?: null;
                $email = trim($data[4]);
                $programCode = trim($data[5]);
                $year = trim($data[6]);
                $sectionChar = trim($data[7]);

                if (empty($studentNumber) || empty($firstName) || empty($lastName) || empty($email)) {
                    throw new \Exception("Required fields missing.");
                }

                // Check for existing user
                if (User::where('student_number', $studentNumber)->exists()) {
                    throw new \Exception("Student number $studentNumber already exists.");
                }
                if (User::where('email', $email)->exists()) {
                    throw new \Exception("Email $email already exists.");
                }

                DB::transaction(function () use ($studentNumber, $firstName, $lastName, $middleName, $email, $programCode, $year, $sectionChar) {
                    $department = Department::firstOrCreate(['department_name' => 'College of Computing Studies']);
                    
                    $program = Program::firstOrCreate(
                        ['program_code' => $programCode, 'department_id' => $department->id],
                        ['program_name' => $programCode === 'BSIT' ? 'Bachelor of Science in Information Technology' : 'Bachelor of Science in Computer Science']
                    );

                    $sectionName = "$programCode $year-$sectionChar";
                    $section = Section::firstOrCreate(
                        ['section_name' => $sectionName, 'program_id' => $program->id, 'department_id' => $department->id],
                        ['year_level' => $year, 'school_year' => '2026-2027']
                    );

                    $initialPassword = $lastName . substr(preg_replace('/[^0-9]/', '', $studentNumber), -3);
                    $setupToken = Str::random(60);

                    $user = User::create([
                        'email' => $email,
                        'student_number' => $studentNumber,
                        'password' => Hash::make($initialPassword),
                        'role' => 'student',
                        'password_setup_token' => $setupToken,
                        'status' => 'pending'
                    ]);

                    Student::create([
                        'user_id' => $user->id,
                        'program_id' => $program->id,
                        'section_id' => $section->id,
                        'year_level' => $year,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'middle_name' => $middleName,
                    ]);

                    $user->notify(new SetupPasswordNotification($setupToken, $email));
                });

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row $row: " . $e->getMessage();
            }
            $row++;
        }
        fclose($handle);

        return response()->json([
            'message' => "Successfully imported $imported students.",
            'imported_count' => $imported,
            'errors' => $errors
        ]);
    }

    /**
     * Store a new student account (for Secretary).
     */
    public function store(Request $request)
    {
        if (!$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'student_number' => 'required|string|unique:users,student_number',
            'email' => 'required|email|unique:users,email',
            'course' => 'required|string',
            'year_level' => 'required|integer|min:1|max:4',
            'section_id' => 'required|exists:sections,id',
            // Guardian fields
            'guardian_first_name' => 'nullable|string',
            'guardian_last_name' => 'nullable|string',
            'guardian_contact_number' => 'nullable|string',
            'guardian_relationship' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $department = Department::firstOrCreate(['department_name' => 'College of Computing Studies']);
            
            $program = Program::where('program_code', $request->course)->first();
            if (!$program) {
                $program = Program::firstOrCreate(
                    ['program_code' => $request->course, 'department_id' => $department->id],
                    ['program_name' => $request->course === 'BSIT' ? 'Bachelor of Science in Information Technology' : 'Bachelor of Science in Computer Science']
                );
            }

            $initialPassword = $request->last_name . substr(preg_replace('/[^0-9]/', '', $request->student_number), -3);
            $setupToken = Str::random(60);

            $user = User::create([
                'email' => $request->email,
                'student_number' => $request->student_number,
                'password' => Hash::make($initialPassword),
                'role' => 'student',
                'password_setup_token' => $setupToken,
                'status' => 'pending'
            ]);

            $student = Student::create([
                'user_id' => $user->id,
                'program_id' => $program->id,
                'section_id' => $request->section_id,
                'year_level' => $request->year_level,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middle_name' => $request->middle_name,
            ]);

            // Create guardian record if provided
            if ($request->guardian_first_name && $request->guardian_last_name) {
                Guardian::create([
                    'student_id' => $student->id,
                    'first_name' => $request->guardian_first_name,
                    'last_name' => $request->guardian_last_name,
                    'contact_number' => $request->guardian_contact_number,
                    'relationship' => $request->guardian_relationship,
                ]);
            }

            $user->notify(new SetupPasswordNotification($setupToken, $request->email));

            return response()->json([
                'message' => 'Student account created successfully.',
                'student' => $student->load('user', 'section', 'program', 'guardian')
            ], 201);
        });
    }

    /**
     * Update a student member (Secretary and Department Chair).
     */
    public function update(Request $request, $id)
    {
        if (!$request->user()->isSecretary() && !$request->user()->isDepartmentChair()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = Student::findOrFail($id);
        $user = $student->user;

        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'student_number' => 'required|string|unique:users,student_number,' . ($user ? $user->id : 0),
            'course' => 'required|string',
            'year_level' => 'required|integer|min:1|max:4',
            'section_id' => 'required|exists:sections,id',
        ]);

        return DB::transaction(function () use ($request, $student, $user) {
            // Update student number and email (if allowed, though frontend prevents it) in the users table
            if ($user) {
                $user->update([
                    'student_number' => $request->student_number
                ]);
            }

            // Find or create the program
            $program = Program::where('program_code', $request->course)->first();
            if (!$program) {
                $program = Program::firstOrCreate(
                    ['program_code' => $request->course],
                    ['program_name' => $request->course, 'department_id' => $student->program->department_id]
                );
            }

            $student->update([
                'program_id' => $program ? $program->id : $student->program_id,
                'section_id' => $request->section_id,
                'year_level' => $request->year_level,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middle_name' => $request->middle_name ?? $student->middle_name,
            ]);

            return response()->json([
                'message' => 'Student account updated successfully.',
                'student' => $student->load('user', 'section', 'program', 'guardian')
            ]);
        });
    }

    /**
     * Delete a student account (Soft Delete/Archive).
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isDean() && !$request->user()->isDepartmentChair() && !$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = Student::findOrFail($id);
        $user = $student->user;

        return DB::transaction(function () use ($student, $user, $request) {
            // Set who archived this student
            $student->update(['archived_by' => $request->user()->id]);
            
            // Soft delete student record
            $student->delete();
            
            // Soft delete associated user account and revoke tokens
            if ($user) {
                $user->tokens()->delete(); // Revoke all active sessions
                $user->delete();
            }

            return response()->json(['message' => 'Student account archived successfully.']);
        });
    }

    /**
     * Get all students (for Dean).
     */
    public function index(Request $request)
    {
        if (!$request->user()->isDean() && !$request->user()->isDepartmentChair() && !$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return Student::with(['user', 'section', 'program', 'guardian', 'skills', 'organizations.organization'])->get();
    }
}
