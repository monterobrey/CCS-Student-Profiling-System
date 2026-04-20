<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\ViolationService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class ViolationController extends Controller
{
    protected $violationService;

    public function __construct(ViolationService $violationService)
    {
        $this->violationService = $violationService;
    }

    /**
     * Get all violations (for Dean and Chair).
     * Dean sees all. Chair sees only their program. Secretary sees their department.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $departmentId = null;
        $programId    = null;

        if ($user->isDepartmentChair() && $user->faculty) {
            $programId = $user->faculty->program_id;
            // If no program assigned yet, fall back to department scope
            if (!$programId) {
                $departmentId = $user->faculty->department_id;
            }
        } elseif ($user->isSecretary() && $user->faculty) {
            $departmentId = $user->faculty->department_id;
        }

        $violations = $this->violationService->getAllViolations($departmentId, $programId);
        return ApiResponse::success($violations);
    }

    /**
     * Update violation status and action taken.
     */
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|in:Pending,Under Review,Resolved,Dismissed,Sanctioned',
            'action_taken' => 'nullable|string',
        ]);

        $violation = $this->violationService->updateViolation($id, $data, $request->user()->id);
        return ApiResponse::success($violation, 'Violation status updated successfully.');
    }
}

