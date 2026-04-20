<?php

namespace App\Services;

use App\Models\StudentViolation;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ViolationService
{
    protected NotificationService $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }
    /**
     * Get all violations, scoped by program (chair) or department (secretary) or all (dean).
     */
    public function getAllViolations($departmentId = null, $programId = null)
    {
        $query = StudentViolation::with(['student.user', 'student.section', 'student.program', 'faculty', 'course', 'actionByUser'])
            ->whereNotNull('faculty_id');

        if ($programId) {
            // Chair: scope strictly to their program
            $query->whereHas('student', function ($q) use ($programId) {
                $q->where('program_id', $programId);
            });
        } elseif ($departmentId) {
            // Secretary: scope to their department
            $query->whereHas('student', function ($q) use ($departmentId) {
                $q->whereHas('program', function ($pq) use ($departmentId) {
                    $pq->where('department_id', $departmentId);
                });
            });
        }
        // Dean: no scope — sees everything

        return $query->latest()->get();
    }

    /**
     * Update violation status and action.
     */
    public function updateViolation($violationId, $data, $actorUserId = null)
    {
        $violation = StudentViolation::findOrFail($violationId);

        if (strcasecmp((string) $violation->status, 'Resolved') === 0) {
            throw ValidationException::withMessages([
                'status' => ['Resolved violations can no longer be edited.'],
            ]);
        }

        $payload = [
            'status' => $data['status'],
            'action_taken' => $data['action_taken'] ?? null,
        ];

        if (Schema::hasColumn('student_violations', 'action_taken_by')) {
            $payload['action_taken_by'] = $actorUserId;
        }

        $violation->update($payload);

        $violation->load(['student.user', 'student.section', 'faculty', 'course', 'actionByUser']);

        $this->notifications->violationUpdated($violation);

        return $violation;
    }
}
