<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\SectionService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    protected $sectionService;

    public function __construct(SectionService $sectionService)
    {
        $this->sectionService = $sectionService;
    }

    /**
     * Get all sections.
     */
    public function index(Request $request)
    {
        $sections = $this->sectionService->getAllSections();
        return ApiResponse::success($sections);
    }
}

