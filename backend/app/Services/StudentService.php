<?php

namespace App\Services;

use App\Models\Student;
use App\Models\User;
use App\Models\Program;
use App\Models\Section;
use App\Models\Guardian;
use App\Models\StudentSkill;
use App\Models\StudentOrganization;
use App\Models\AcademicActivity;
use App\Models\NonAcademicActivity;
use App\Notifications\SetupPasswordNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Service for student management operations.
 */
class StudentService
{
    /**
     * Create a new student account with optional guardian.
     */
    public function createStudent($data)
    {
        return DB::transaction(function () use ($data) {
            // Generate initial password: LastName + last 3 digits of student_number
            $digits = substr(preg_replace('/[^0-9]/', '', $data['student_number']), -3);
            $initialPassword = $data['last_name'] . $digits;
            $setupToken = Str::random(60);

            // Create user account
            $user = User::create([
                'email' => $data['email'],
                'student_number' => $data['student_number'],
                'password' => Hash::make($initialPassword),
                'role' => 'student',
                'password_setup_token' => $setupToken,
                'status' => 'pending',
            ]);

            // Create student record
            $student = Student::create([
                'user_id' => $user->id,
                'program_id' => $data['program_id'],
                'section_id' => $data['section_id'],
                'year_level' => $data['year_level'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'middle_name' => $data['middle_name'] ?? null,
            ]);

            // Send setup password notification — skip during bulk import
            if (empty($data['skip_notification'])) {
                $user->load('student');
                $user->notify(new SetupPasswordNotification($setupToken));
            }

            // Create guardian if provided
            if (isset($data['guardian']) && !empty($data['guardian']['first_name'])) {
                Guardian::create([
                    'student_id' => $student->id,
                    'first_name' => $data['guardian']['first_name'],
                    'last_name' => $data['guardian']['last_name'],
                    'contact_number' => $data['guardian']['contact_number'] ?? null,
                    'relationship' => $data['guardian']['relationship'] ?? null,
                ]);
            }

            return $student->load('user', 'program', 'section', 'guardian');
        });
    }

    /**
     * Get student's full profile with all relations.
     */
    public function getStudentProfile($studentId)
    {
        return Student::findOrFail($studentId)->load([
            'user',
            'program',
            'section',
            'guardian',
            'skills',
            'organizations.organization',
            'violations',
            'academicActivities',
            'nonAcademicActivities',
            'awards'
        ]);
    }

    /**
     * Update student profile (nullable fields).
     */
    public function updateStudentProfile($studentId, $data)
    {
        $student = Student::findOrFail($studentId);

        $student->update([
            'middle_name' => $data['middle_name'] ?? $student->middle_name,
            'gender' => $data['gender'] ?? $student->gender,
            'birthdate' => $data['birthdate'] ?? $student->birthdate,
            'civil_status' => $data['civil_status'] ?? $student->civil_status,
            'contact_number' => $data['contact_number'] ?? $student->contact_number,
            'address' => $data['address'] ?? $student->address,
        ]);

        return $student->load('section.program', 'program');
    }

    /**
     * Add skill to student.
     */
    public function addSkill($studentId, $skillName, $proficiency = 'intermediate')
    {
        $student = Student::findOrFail($studentId);

        return StudentSkill::updateOrCreate(
            ['student_id' => $studentId, 'skill_name' => $skillName],
            ['proficiency_level' => $proficiency]
        );
    }

    /**
     * Remove skill from student.
     */
    public function removeSkill($studentId, $skillId)
    {
        return StudentSkill::where('student_id', $studentId)
            ->where('id', $skillId)
            ->delete();
    }

    /**
     * Add organization affiliation.
     */
    public function addOrganizationAffiliation($studentId, $organizationId)
    {
        return StudentOrganization::updateOrCreate([
            'student_id' => $studentId,
            'organization_id' => $organizationId,
        ]);
    }

    /**
     * Remove organization affiliation.
     */
    public function removeOrganizationAffiliation($studentId, $organizationId)
    {
        return StudentOrganization::where('student_id', $studentId)
            ->where('organization_id', $organizationId)
            ->delete();
    }

    /**
     * Add academic activity (research, thesis, etc.)
     */
    public function addAcademicActivity($studentId, $data)
    {
        return AcademicActivity::create([
            'student_id' => $studentId,
            'activity_name' => $data['activity_name'],
            'description' => $data['description'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null,
            'status' => 'pending',
        ]);
    }

    /**
     * Add non-academic activity (sports, club, etc.)
     */
    public function addNonAcademicActivity($studentId, $data)
    {
        return NonAcademicActivity::create([
            'student_id' => $studentId,
            'activity_name' => $data['activity_name'],
            'description' => $data['description'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null,
            'status' => 'pending',
        ]);
    }

    /**
     * Resend password setup email to a pending student.
     */
    public function resendSetupEmail($studentId)
    {
        $student = Student::findOrFail($studentId);
        $user = $student->user;

        if (!$user || $user->status !== 'pending') {
            throw new \Exception('Student account is already active or not found.');
        }

        $setupToken = \Illuminate\Support\Str::random(60);
        $user->update(['password_setup_token' => $setupToken]);
        $user->notify(new SetupPasswordNotification($setupToken));

        return true;
    }

    /**
     * Archive a student account.
     */
    public function archiveStudent($studentId, $archivedByUserId)
    {
        return DB::transaction(function () use ($studentId, $archivedByUserId) {
            $student = Student::findOrFail($studentId);
            $user = $student->user;

            $student->update(['archived_by' => $archivedByUserId]);
            $student->delete();

            if ($user) {
                $user->tokens()->delete(); // Revoke all tokens
                $user->delete();
            }

            return true;
        });
    }
}
