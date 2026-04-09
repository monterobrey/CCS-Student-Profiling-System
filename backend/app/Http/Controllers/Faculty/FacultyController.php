<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\User;
use App\Models\Department;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentViolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Notifications\SetupPasswordNotification;

class FacultyController extends Controller
{
    /**
     * Get students handled by the authenticated faculty.
     */
    public function myStudents(Request $request)
    {
        $user = $request->user();
        if (!$user->isFaculty()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $facultyId = $user->faculty->id;
        $schedules = Schedule::where('faculty_id', $facultyId)->with(['course', 'section'])->get();
        $sectionIds = $schedules->pluck('section_id')->unique();

        $subjects = $schedules->map(function($s) {
            return [
                'id' => $s->course->id,
                'name' => $s->course->course_name,
                'code' => $s->course->course_code,
                'section_id' => $s->section_id,
                'section_name' => $s->section->section_name
            ];
        })->values();

        $students = Student::whereIn('section_id', $sectionIds)
            ->with(['user', 'section', 'program', 'guardian', 'skills', 'organizations.organization'])
            ->get();

        return response()->json([
            'students' => $students,
            'subjects' => $subjects
        ]);
    }

    /**
     * Get violations reported by the authenticated faculty.
     */
    public function myViolations(Request $request)
    {
        $user = $request->user();
        if (!$user->isFaculty()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return StudentViolation::where('faculty_id', $user->faculty->id)
            ->with(['student.user', 'student.section', 'student.program', 'course'])
            ->latest()
            ->get();
    }

    /**
     * Store a new student violation.
     */
    public function storeViolation(Request $request)
    {
        $user = $request->user();
        if (!$user->isFaculty()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
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

        $violations = [];
        DB::transaction(function () use ($request, $user, &$violations) {
            foreach ($request->student_ids as $studentId) {
                $violations[] = StudentViolation::create([
                    'student_id' => $studentId,
                    'faculty_id' => $user->faculty->id,
                    'course_id' => $request->course_id,
                    'violationType' => $request->violationType,
                    'severity' => $request->severity,
                    'description' => $request->description,
                    'dateReported' => $request->dateReported,
                    'incident_time' => $request->incident_time,
                    'location' => $request->location,
                    'status' => 'active',
                ]);
            }
        });

        return response()->json([
            'message' => count($violations) . ' violation(s) recorded successfully.',
            'count' => count($violations)
        ]);
    }

    /**
     * Get all faculty members (for Dean/Secretary).
     */
    public function index(Request $request)
    {
        if (!$request->user()->isDean() && !$request->user()->isDepartmentChair() && !$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return Faculty::with(['user', 'department', 'expertise', 'organizations', 'schedules.course', 'schedules.section'])->get();
    }

    /**
     * Store a new faculty member (for Secretary).
     */
    public function store(Request $request)
    {
        if (!$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'nullable|string',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'email' => 'required|email|unique:users,email',
            'department_id' => 'required|exists:departments,id',
            'position' => 'required|string',
        ]);

        return DB::transaction(function () use ($request) {
            // Initial password: last_name + random 3 numbers (or just last_name123)
            // But for faculty, we'll use a standard pattern like last_name + "CCS"
            $initialPassword = $request->last_name . 'CCS';
            $setupToken = Str::random(60);

            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($initialPassword),
                'role' => 'faculty',
                'password_setup_token' => $setupToken,
                'status' => 'pending',
            ]);

            $faculty = Faculty::create([
                'user_id' => $user->id,
                'title' => $request->title,
                'department_id' => $request->department_id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middle_name' => $request->middle_name,
                'position' => $request->position,
            ]);

            // Notify faculty to set up password (Synchronous for now to avoid queue errors)
            $user->notify(new SetupPasswordNotification($setupToken, $request->email));

            return response()->json([
                'message' => 'Faculty member added successfully. An email has been sent for account setup.',
                'faculty' => $faculty->load('user')
            ]);
        });
    }

    /**
     * Update a faculty member (for Secretary).
     */
    public function update(Request $request, $id)
    {
        if (!$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $faculty = Faculty::findOrFail($id);

        $request->validate([
            'title' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'position' => 'required|string',
        ]);

        $faculty->update([
            'title' => $request->title,
            'department_id' => $request->department_id,
            'position' => $request->position,
        ]);

        return response()->json([
            'message' => 'Faculty account updated successfully.',
            'faculty' => $faculty->load('user', 'department')
        ]);
    }

    /**
     * Delete a faculty member (Soft Delete/Archive).
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isDean() && !$request->user()->isDepartmentChair() && !$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $faculty = Faculty::findOrFail($id);
        $user = $faculty->user;

        return DB::transaction(function () use ($faculty, $user, $request) {
            // Set who archived this faculty
            $faculty->update(['archived_by' => $request->user()->id]);

            // Soft delete faculty record
            $faculty->delete();
            
            // Soft delete associated user account and revoke tokens
            if ($user) {
                $user->tokens()->delete(); // Revoke all active sessions
                $user->delete();
            }

            return response()->json(['message' => 'Faculty account archived successfully.']);
        });
    }

    /**
     * Import faculty from CSV.
     */
    public function import(Request $request)
    {
        if (!$request->user()->isSecretary() && !$request->user()->isDean()) {
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
                if (count($data) < 5) {
                    throw new \Exception("Insufficient columns. Expected at least 5 (first_name, last_name, middle_name, email, position).");
                }

                $firstName = trim($data[0]);
                $lastName = trim($data[1]);
                $middleName = trim($data[2]) ?: null;
                $email = trim($data[3]);
                $position = trim($data[4]);

                if (empty($firstName) || empty($lastName) || empty($email) || empty($position)) {
                    throw new \Exception("Required fields missing.");
                }

                if (User::where('email', $email)->exists()) {
                    throw new \Exception("Email $email already exists.");
                }

                DB::transaction(function () use ($firstName, $lastName, $middleName, $email, $position) {
                    $initialPassword = $lastName . 'CCS';
                    $setupToken = Str::random(60);

                    // For now, assume CCS department
                    $department = \App\Models\Department::firstOrCreate(['department_name' => 'College of Computing Studies']);

                    $user = User::create([
                        'email' => $email,
                        'password' => Hash::make($initialPassword),
                        'role' => 'faculty',
                        'password_setup_token' => $setupToken,
                        'status' => 'pending',
                    ]);

                    Faculty::create([
                        'user_id' => $user->id,
                        'department_id' => $department->id,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'middle_name' => $middleName,
                        'position' => $position,
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
            'message' => "Successfully imported $imported faculty members.",
            'imported_count' => $imported,
            'errors' => $errors
        ]);
    }
}

