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
        $data = $this->analyticsService->getDeanSummary($request->user());
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
     * Scoped strictly to the chair's program_id.
     * Dean/Secretary get unscoped (full department) data.
     */
    public function academicPerformance(Request $request)
    {
        $user = $request->user();
        $departmentId = null;
        $programId    = null;

        if ($user->isDepartmentChair()) {
            // Chair must be scoped to their program only — never fall back to full department
            $programId = $user->faculty?->program_id ?? null;
            // If no program assigned yet, return empty data rather than leaking other programs
            if (!$programId) {
                return ApiResponse::success([
                    'summary'             => [],
                    'distribution'        => [],
                    'by_program'          => [],
                    'by_year_level'       => [],
                    'violations_severity' => [],
                    'top_students'        => [],
                    'risk_vs_honors'      => [],
                    'chart_data'          => [],
                    'total_students'      => 0,
                    'total_with_gwa'      => 0,
                    'scope_label'         => null,
                    'no_program_assigned' => true,
                ]);
            }
        }

        $data = $this->analyticsService->getAcademicPerformance($departmentId, $programId);
        return ApiResponse::success($data);
    }

    /**
     * Get overall department-wide report for the Dean.
     */
    public function deanReport(Request $request)
    {
        $data = $this->analyticsService->getDeanReport();
        return ApiResponse::success($data);
    }
}

