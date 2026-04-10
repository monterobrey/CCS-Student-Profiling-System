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
     */
    public function academicPerformance(Request $request)
    {
        $data = $this->analyticsService->getAcademicPerformance();
        return ApiResponse::success($data);
    }
}

