<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    protected $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get dashboard summary stats for Dean, Chair, and Secretary.
     */
    public function deanSummary(Request $request)
    {
        $data = $this->analyticsService->getDeanSummary();
        return ApiResponse::success($data);
    }

    /**
     * Get dashboard summary stats for Faculty.
     */
    public function facultySummary(Request $request)
    {
        $data = $this->analyticsService->getFacultySummary($request->user()->faculty->id);
        return ApiResponse::success($data);
    }

    /**
     * Get academic performance statistics.
     * Scoped to the chair's department/program if the user is a department chair.
     */
    public function academicPerformance(Request $request)
    {
        $user = $request->user();
        $departmentId = null;
        $programId    = null;

        if ($user->isDepartmentChair() && $user->faculty) {
            $departmentId = $user->faculty->department_id;
            $programId    = $user->faculty->program_id; // null if not assigned to a specific program
        }

        $data = $this->analyticsService->getAcademicPerformance($departmentId, $programId);
        return ApiResponse::success($data);
    }
}

