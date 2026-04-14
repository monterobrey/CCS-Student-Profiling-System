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
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $departmentId = ($user->isDepartmentChair() || $user->isSecretary()) ? $user->faculty->department_id : null;
        
        $violations = $this->violationService->getAllViolations($departmentId);
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

