<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Department;
use App\Services\ProfilingService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class ProfilingController extends Controller
{
    protected $profilingService;

    public function __construct(ProfilingService $profilingService)
    {
        $this->profilingService = $profilingService;
    }

    /**
     * Get all programs.
     */
    public function getPrograms()
    {
        return ApiResponse::success(Program::all());
    }

    /**
     * Get all departments.
     */
    public function getDepartments()
    {
        return ApiResponse::success(Department::all());
    }

    /**
     * Profiling query engine for generating qualified-student reports.
     */
    public function report(Request $request)
    {
        $filters = [
            'year_level' => $request->input('year_level'),
            'section_id' => $request->input('section_id'),
            'program_id' => $request->input('program_id'),
            'skill_name' => $request->input('skill_name'),
            'skill_category' => $request->input('skill_category'),
            'academic_activity' => $request->input('academic_activity'),
            'org_id' => $request->input('org_id'),
            'organization' => $request->input('organization'),
            'award_name' => $request->input('award_name'),
        ];

        $report = $this->profilingService->generateReport($filters);

        return ApiResponse::success($report);
    }
}

