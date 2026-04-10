<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\ArchiveService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    protected $archiveService;

    public function __construct(ArchiveService $archiveService)
    {
        $this->archiveService = $archiveService;
    }

    /**
     * Get all archived accounts (Students and Faculty).
     */
    public function index(Request $request)
    {
        $archived = $this->archiveService->getArchivedAccounts();
        return ApiResponse::success($archived);
    }

    /**
     * Restore an archived account.
     */
    public function restore(Request $request, $id)
    {
        $type = $request->validate(['type' => 'required|in:student,faculty'])['type'];

        try {
            $account = $this->archiveService->restoreAccount($id, $type);
            return ApiResponse::success($account, 'Account restored successfully.');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 400);
        }
    }
}

