<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\CurriculumService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{
    protected $curriculumService;

    public function __construct(CurriculumService $curriculumService)
    {
        $this->curriculumService = $curriculumService;
    }

    /**
     * Get curriculum list (filtered by program if provided).
     */
    public function index(Request $request)
    {
        $curriculum = $this->curriculumService->getAllCurriculum($request->input('program_id'));
        return ApiResponse::success($curriculum);
    }

    /**
     * Store a single curriculum entry (manual entry).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'course_id' => 'required|exists:courses,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
        ]);

        try {
            $entry = $this->curriculumService->createEntry($data, $request->user()->id);
            return ApiResponse::success($entry, 'Curriculum entry added successfully.', 201);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    /**
     * Store multiple curriculum entries (bulk manual entry).
     */
    public function bulkStore(Request $request)
    {
        $data = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
            'course_ids' => 'required|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        $result = $this->curriculumService->bulkCreate($data, $request->user()->id);
        return ApiResponse::success(null, "Successfully added {$result['created']} courses. Skipped {$result['skipped']} existing courses.", 201);
    }

    /**
     * Import curriculum via CSV.
     */
    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);

        try {
            $result = $this->curriculumService->importFromCsv($request->file('file'), $request->user()->id);
            return ApiResponse::success(['errors' => $result['errors']], "Successfully imported {$result['imported']} entries.");
        } catch (\Exception $e) {
            return ApiResponse::error('Import failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove a curriculum entry.
     */
    public function destroy($id)
    {
        $this->curriculumService->deleteEntry($id);
        return ApiResponse::success(null, 'Curriculum entry removed.');
    }
}

