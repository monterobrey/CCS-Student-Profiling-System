<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\User;
use App\Models\Department;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentViolation;
use App\Notifications\SetupPasswordNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Service for faculty management operations.
 */
class FacultyService
{
    /**
     * Create a new faculty member.
     */
    public function createFaculty($data)
    {
        return DB::transaction(function () use ($data) {
            // Generate initial password: LastNameCCS
            $initialPassword = $data['last_name'] . 'CCS';
            $setupToken = Str::random(60);

            // Create user account
            $user = User::create([
                'email' => $data['email'],
                'password' => Hash::make($initialPassword),
                'role' => 'faculty',
                'password_setup_token' => $setupToken,
                'status' => 'pending',
            ]);

            // Send setup password notification
            $user->notify(new SetupPasswordNotification($setupToken, $data['email']));

            // Create faculty record
            $faculty = Faculty::create([
                'user_id' => $user->id,
                'title' => $data['title'] ?? null,
                'department_id' => $data['department_id'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'position' => $data['position'],
            ]);

            return $faculty->load('user', 'department');
        });
    }

    /**
     * Get all students assigned to a faculty member.
     */
    public function getMyStudents($facultyId)
    {
        $schedules = Schedule::where('faculty_id', $facultyId)
            ->with(['course', 'section'])
            ->get();

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

        return [
            'students' => $students,
            'subjects' => $subjects,
        ];
    }

    /**
     * Get all violations reported by a faculty member.
     */
    public function getMyViolations($facultyId)
    {
        return StudentViolation::where('faculty_id', $facultyId)
            ->with(['student.user', 'student.section', 'student.program', 'course'])
            ->latest()
            ->get();
    }

    /**
     * Record violations for multiple students.
     */
    public function recordViolations($facultyId, $data)
    {
        $violations = [];

        DB::transaction(function () use ($facultyId, $data, &$violations) {
            foreach ($data['student_ids'] as $studentId) {
                $violations[] = StudentViolation::create([
                    'student_id' => $studentId,
                    'faculty_id' => $facultyId,
                    'course_id' => $data['course_id'] ?? null,
                    'violationType' => $data['violationType'],
                    'severity' => $data['severity'],
                    'description' => $data['description'],
                    'dateReported' => $data['dateReported'],
                    'incident_time' => $data['incident_time'] ?? null,
                    'location' => $data['location'] ?? null,
                    'status' => 'active',
                ]);
            }
        });

        return $violations;
    }

    /**
     * Update faculty information.
     */
    public function updateFaculty($facultyId, $data)
    {
        $faculty = Faculty::findOrFail($facultyId);

        $faculty->update([
            'title' => $data['title'] ?? $faculty->title,
            'department_id' => $data['department_id'],
            'position' => $data['position'],
        ]);

        return $faculty->load('user', 'department');
    }

    /**
     * Archive a faculty member and revoke their access.
     */
    public function archiveFaculty($facultyId, $archivedByUserId)
    {
        return DB::transaction(function () use ($facultyId, $archivedByUserId) {
            $faculty = Faculty::findOrFail($facultyId);
            $user = $faculty->user;

            // Mark who archived this faculty
            $faculty->update(['archived_by' => $archivedByUserId]);

            // Soft delete faculty
            $faculty->delete();

            // Soft delete user and revoke all tokens
            if ($user) {
                $user->tokens()->delete();
                $user->delete();
            }

            return true;
        });
    }
}
