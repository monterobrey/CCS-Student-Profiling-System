<?php

namespace App\Services;

use App\Models\AcademicAward;
use App\Models\Student;
use App\Models\Faculty;
use App\Models\Schedule;
use Illuminate\Support\Facades\DB;

class AwardService
{
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
            $departmentId = $user->faculty->department_id;
            $query->whereHas('student.program', fn($q) =>
                $q->where('department_id', $departmentId)
            );
        } elseif ($user->isFaculty()) {
            $sectionIds = Schedule::where('faculty_id', $user->faculty->id)
                ->pluck('section_id')
                ->unique();
            $query->whereHas('student', fn($q) =>
                $q->whereIn('section_id', $sectionIds)
            );
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

        return DB::transaction(function () use ($user, $data, $isChair) {
            $facultyId = $user->faculty->id;

            return AcademicAward::create([
                'student_id'     => $data['student_id'],
                'faculty_id'     => $facultyId,
                'awardName'      => $data['awardName'],
                'description'    => $data['description'],
                'date_received'  => $data['date_received'],
                'issued_by'      => $user->name,
                'applied_by'     => true,           // admin-given
                'recommended_by' => $user->id,
                'approved_by'    => $isChair ? $user->id : null,
                'status'         => $isChair ? 'approved' : 'pending',
                'approved_at'    => $isChair ? now() : null,
            ])->load(['student.program', 'student.section', 'faculty', 'recommender', 'approver']);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT APPLIES FOR AWARD → always pending
    |--------------------------------------------------------------------------
    */
    public function applyForAward($user, array $data)
    {
        return AcademicAward::create([
            'student_id'     => $user->student->id,
            'faculty_id'     => null,
            'awardName'      => $data['awardName'],
            'description'    => $data['description'],
            'date_received'  => $data['date_received'],
            'issued_by'      => 'Student Application',
            'applied_by'     => false,              // student-applied
            'recommended_by' => null,
            'approved_by'    => null,
            'status'         => 'pending',
            'approved_at'    => null,
        ])->load(['student.program', 'student.section']);
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
            $deptId = $user->faculty->department_id;
            if ($award->student->program->department_id !== $deptId) {
                throw new \Exception('You can only approve awards for students in your department.');
            }
        }

        $award->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return $award->load(['student.program', 'student.section', 'faculty', 'recommender', 'approver']);
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
            $deptId = $user->faculty->department_id;
            if ($award->student->program->department_id !== $deptId) {
                throw new \Exception('You can only reject awards for students in your department.');
            }
        }

        $award->update([
            'status'      => 'rejected',
            'approved_by' => $user->id,   // tracks who rejected
            'action_taken' => $reason,
        ]);

        return $award->load(['student.program', 'student.section', 'faculty', 'recommender', 'approver']);
    }
}
