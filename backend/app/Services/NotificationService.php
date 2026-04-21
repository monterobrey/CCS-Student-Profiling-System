<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Faculty;

class NotificationService
{
    // ─── Generic creator ────────────────────────────────────
    public function create(int $userId, string $type, string $title, string $message, array $data = []): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'data'    => $data,
        ]);
    }

    // ─── AWARD EVENTS ────────────────────────────────────────

    /**
     * Student applied for an award → notify the chair of that program + all deans.
     */
    public function awardApplied(\App\Models\AcademicAward $award): void
    {
        $student     = $award->student;
        $programId   = $student->program_id ?? null;
        $studentName = trim("{$student->first_name} {$student->last_name}");

        // Notify chairs assigned to this program
        $chairs = Faculty::whereHas('user', fn($q) => $q->where('role', 'department_chair'))
            ->where('program_id', $programId)
            ->with('user')
            ->get();

        foreach ($chairs as $chair) {
            $this->create(
                $chair->user_id,
                'award_applied',
                'New Award Application',
                "{$studentName} submitted an award application: \"{$award->awardName}\".",
                ['award_id' => $award->id, 'student_id' => $student->id]
            );
        }

        // Notify all deans
        User::where('role', 'dean')->each(function ($dean) use ($award, $studentName, $student) {
            $this->create(
                $dean->id,
                'award_applied',
                'New Award Application',
                "{$studentName} submitted an award application: \"{$award->awardName}\".",
                ['award_id' => $award->id, 'student_id' => $student->id]
            );
        });
    }

    /**
     * Award approved → notify the student.
     */
    public function awardApproved(\App\Models\AcademicAward $award): void
    {
        $this->create(
            $award->student->user_id,
            'award_approved',
            'Award Approved 🎉',
            "Your award application \"{$award->awardName}\" has been approved.",
            ['award_id' => $award->id]
        );
    }

    /**
     * Award rejected → notify the student.
     */
    public function awardRejected(\App\Models\AcademicAward $award): void
    {
        $reason = $award->action_taken ? " Reason: {$award->action_taken}" : "";
        $this->create(
            $award->student->user_id,
            'award_rejected',
            'Award Application Update',
            "Your award application \"{$award->awardName}\" was not approved.{$reason}",
            ['award_id' => $award->id]
        );
    }

    /**
     * Faculty gave an award (needs chair/dean approval) → notify chair + dean.
     */
    public function awardPendingApproval(\App\Models\AcademicAward $award): void
    {
        $giverName   = $award->recommender?->name ?? 'A faculty member';
        $studentName = trim("{$award->student->first_name} {$award->student->last_name}");
        $programId   = $award->student->program_id ?? null;

        // Notify chairs of that program
        $chairs = Faculty::whereHas('user', fn($q) => $q->where('role', 'department_chair'))
            ->where('program_id', $programId)
            ->with('user')
            ->get();

        foreach ($chairs as $chair) {
            $this->create(
                $chair->user_id,
                'award_pending',
                'Award Pending Approval',
                "{$giverName} gave \"{$award->awardName}\" to {$studentName}. Awaiting your approval.",
                ['award_id' => $award->id]
            );
        }

        // Notify all deans
        User::where('role', 'dean')->each(function ($dean) use ($award, $giverName, $studentName) {
            $this->create(
                $dean->id,
                'award_pending',
                'Award Pending Approval',
                "{$giverName} gave \"{$award->awardName}\" to {$studentName}. Awaiting approval.",
                ['award_id' => $award->id]
            );
        });
    }

    // ─── VIOLATION EVENTS ────────────────────────────────────

    /**
     * Violation reported → notify the student, the program's chair, and all deans.
     */
    public function violationReported(\App\Models\StudentViolation $violation): void
    {
        $student     = $violation->student;
        $studentName = trim("{$student->first_name} {$student->last_name}");
        $programId   = $student->program_id ?? null;

        // Notify the student
        $this->create(
            $student->user_id,
            'violation_reported',
            'Violation Recorded',
            "A \"{$violation->violationType}\" violation has been recorded on your account.",
            ['violation_id' => $violation->id]
        );

        // Notify the program's chair
        $chairs = Faculty::whereHas('user', fn($q) => $q->where('role', 'department_chair'))
            ->where('program_id', $programId)
            ->with('user')
            ->get();

        foreach ($chairs as $chair) {
            $this->create(
                $chair->user_id,
                'violation_reported',
                'Violation Reported',
                "A \"{$violation->violationType}\" violation was reported for {$studentName}.",
                ['violation_id' => $violation->id, 'student_id' => $student->id]
            );
        }

        // Notify all deans
        User::where('role', 'dean')->each(function ($dean) use ($violation, $studentName, $student) {
            $this->create(
                $dean->id,
                'violation_reported',
                'Violation Reported',
                "A \"{$violation->violationType}\" violation was reported for {$studentName}.",
                ['violation_id' => $violation->id, 'student_id' => $student->id]
            );
        });
    }

    /**
     * Violation status updated → notify the student only.
     * (Chair/Dean are the ones updating it, no need to notify them.)
     */
    public function violationUpdated(\App\Models\StudentViolation $violation): void
    {
        $this->create(
            $violation->student->user_id,
            'violation_updated',
            'Violation Status Updated',
            "Your violation \"{$violation->violationType}\" status has been updated to: {$violation->status}.",
            ['violation_id' => $violation->id]
        );
    }
}
