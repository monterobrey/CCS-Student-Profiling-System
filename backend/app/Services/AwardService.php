<?php

namespace App\Services;

use App\Models\AcademicAward;
use App\Models\Student;
use App\Models\Faculty;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;

class AwardService
{
    protected NotificationService $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }
    /*
    |--------------------------------------------------------------------------
    | SCOPED LIST
    |--------------------------------------------------------------------------
    | Dean / Secretary  → all awards
    | Chair             → awards for students in their department
    | Faculty           → awards for students in their assigned sections
    | Student           → their own awards only
    */
    public function getAwards($user)
    {
        $query = AcademicAward::with([
            'student.program',
            'student.section',
            'faculty',
            'recommender',
            'approver',
        ]);

        if ($user->isDean() || $user->isSecretary()) {
            // Full visibility — no filter
        } elseif ($user->isDepartmentChair()) {
            $programId = $user->faculty->program_id;
            $query->whereHas('student', fn($q) =>
                $q->where('program_id', $programId)
            );
        } elseif ($user->isFaculty()) {
            // Only show awards this faculty member personally recommended
            $query->where('faculty_id', $user->faculty->id);
        } elseif ($user->isStudent()) {
            $query->where('student_id', $user->student->id);
        }

        return $query->latest()->get();
    }

    /*
    |--------------------------------------------------------------------------
    | CHAIR GIVES AWARD → auto-approved
    | FACULTY GIVES AWARD → pending, needs Chair/Dean approval
    |--------------------------------------------------------------------------
    */
    public function giveAward($user, array $data)
    {
        $isChair = $user->isDepartmentChair();

        // Chair can only give awards to students in their own program
        if ($isChair) {
            $student = \App\Models\Student::findOrFail($data['student_id']);
            if ($student->program_id !== $user->faculty->program_id) {
                throw new \Exception('You can only give awards to students in your program.');
            }
        }

        return DB::transaction(function () use ($user, $data, $isChair) {
            $facultyId = $user->faculty->id;

            $award = AcademicAward::create([
                'student_id'     => $data['student_id'],
                'faculty_id'     => $facultyId,
                'awardName'      => $data['awardName'],
                'description'    => $data['description'] ?? '',
                'date_received'  => $data['date_received'],
                'issued_by'      => $user->name,
                'applied_by'     => true,
                'recommended_by' => $user->id,
                'approved_by'    => $isChair ? $user->id : null,
                'status'         => $isChair ? 'approved' : 'pending',
                'approved_at'    => $isChair ? now() : null,
            ])->load(['student.program', 'student.section', 'faculty', 'recommender', 'approver']);

            // If chair gave it → auto-approved, notify student
            // If faculty gave it → pending, notify chair + dean
            if ($isChair) {
                $this->notifications->awardApproved($award);
            } else {
                $this->notifications->awardPendingApproval($award);
            }

            return $award;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT APPLIES FOR AWARD → always pending
    |--------------------------------------------------------------------------
    */
    public function applyForAward($user, array $data)
    {
        $award = AcademicAward::create([
            'student_id'     => $user->student->id,
            'faculty_id'     => null,
            'awardName'      => $data['awardName'],
            'category'       => $data['category'] ?? null,
            'description'    => $data['description'] ?? '',
            'date_received'  => $data['date_received'],
            'academic_year'  => $data['academic_year'] ?? null,
            'issued_by'      => 'Student Application',
            'applied_by'     => false,
            'recommended_by' => null,
            'approved_by'    => null,
            'status'         => 'pending',
            'approved_at'    => null,
        ])->load(['student.program', 'student.section']);

        $this->notifications->awardApplied($award);

        return $award;
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVE — Dean or Chair only
    | Validates that Chair only approves awards for their department's students
    |--------------------------------------------------------------------------
    */
    public function approveAward($user, $awardId)
    {
        $award = AcademicAward::with('student.program')->findOrFail($awardId);

        if ($award->status !== 'pending') {
            throw new \Exception('Only pending awards can be approved.');
        }

        // Chair scope check
        if ($user->isDepartmentChair()) {
            $programId = $user->faculty->program_id;
            if ($award->student->program_id !== $programId) {
                throw new \Exception('You can only approve awards for students in your program.');
            }
        }

        $award->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        $award->load(['student.program', 'student.section', 'faculty', 'recommender', 'approver']);

        $this->notifications->awardApproved($award);

        return $award;
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT — Dean or Chair only
    |--------------------------------------------------------------------------
    */
    public function rejectAward($user, $awardId, $reason = null)
    {
        $award = AcademicAward::with('student.program')->findOrFail($awardId);

        if ($award->status !== 'pending') {
            throw new \Exception('Only pending awards can be rejected.');
        }

        if ($user->isDepartmentChair()) {
            $programId = $user->faculty->program_id;
            if ($award->student->program_id !== $programId) {
                throw new \Exception('You can only reject awards for students in your program.');
            }
        }

        $award->update([
            'status'      => 'rejected',
            'approved_by' => $user->id,
            'action_taken' => $reason,
        ]);

        $award->load(['student.program', 'student.section', 'faculty', 'recommender', 'approver']);

        $this->notifications->awardRejected($award);

        return $award;
    }
}
