<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Models\StudentViolation;
use Illuminate\Http\Request;

class ViolationController extends Controller
{
    /**
     * Get all violations (for Dean and Chair).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->isDean() && !$user->isDepartmentChair() && !$user->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = StudentViolation::with(['student.user', 'student.section', 'student.program', 'faculty', 'course']);

        // If department chair or secretary, filter by department
        if ($user->isDepartmentChair() || $user->isSecretary()) {
            $deptId = $user->faculty->department_id;
            $query->whereHas('student', function($q) use ($deptId) {
                $q->whereHas('program', function($pq) use ($deptId) {
                    $pq->where('department_id', $deptId);
                });
            });
        }

        return $query->latest()->get();
    }

    /**
     * Update violation status and action taken.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        // Only Dean, Chair, or Secretary can update
        if (!$user->isDean() && !$user->isDepartmentChair() && !$user->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:Pending,Under Review,Resolved,Dismissed,Sanctioned',
            'action_taken' => 'nullable|string',
        ]);

        $violation = StudentViolation::findOrFail($id);
        
        $violation->update([
            'status' => $request->status,
            'action_taken' => $request->action_taken,
        ]);

        return response()->json([
            'message' => 'Violation status updated successfully.',
            'violation' => $violation->load(['student.user', 'student.section', 'faculty', 'course'])
        ]);
    }
}

