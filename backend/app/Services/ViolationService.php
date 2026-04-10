<?php

namespace App\Services;

use App\Models\StudentViolation;

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
        $query = StudentViolation::with(['student.user', 'student.section', 'student.program', 'faculty', 'course']);

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
    public function updateViolation($violationId, $data)
    {
        $violation = StudentViolation::findOrFail($violationId);
        
        $violation->update([
            'status' => $data['status'],
            'action_taken' => $data['action_taken'] ?? null,
        ]);

        return $violation->load(['student.user', 'student.section', 'faculty', 'course']);
    }
}
