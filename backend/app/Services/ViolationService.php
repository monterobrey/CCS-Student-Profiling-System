<?php

namespace App\Services;

use App\Models\StudentViolation;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

/**
 * Service for student violation management.
 */
class ViolationService
{
    /**
     * Get all violations, optionally filtered by department.
     */
    public function getAllViolations($departmentId = null)
    {
        $query = StudentViolation::with(['student.user', 'student.section', 'student.program', 'faculty', 'course', 'actionByUser'])
            ->whereNotNull('faculty_id');

        if ($departmentId) {
            $query->whereHas('student', function($q) use ($departmentId) {
                $q->whereHas('program', function($pq) use ($departmentId) {
                    $pq->where('department_id', $departmentId);
                });
            });
        }

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

        return $violation->load(['student.user', 'student.section', 'faculty', 'course', 'actionByUser']);
    }
}
