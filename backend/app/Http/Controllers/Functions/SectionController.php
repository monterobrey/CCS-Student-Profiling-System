<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    /**
     * Get all sections.
     */
    public function index(Request $request)
    {
        $sections = Section::with(['program', 'department'])->get();
        return ApiResponse::success($sections);
    }
}

