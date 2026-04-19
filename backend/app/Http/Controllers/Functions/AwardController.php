<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\AwardService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class AwardController extends Controller
{
    protected $awardService;

    public function __construct(AwardService $awardService)
    {
        $this->awardService = $awardService;
    }

    /**
     * List awards — scoped by role automatically in the service.
     */
    public function index(Request $request)
    {
        $awards = $this->awardService->getAwards($request->user());
        return ApiResponse::success($awards);
    }

    /**
     * Chair or Faculty gives an award to a student.
     * Chair → auto-approved. Faculty → pending.
     */
    public function give(Request $request)
    {
        $data = $request->validate([
            'student_id'    => 'required|exists:students,id',
            'awardName'     => 'required|string|max:255',
            'description'   => 'nullable|string',
            'date_received' => 'required|date',
        ]);

        try {
            $award = $this->awardService->giveAward($request->user(), $data);
            $msg = $request->user()->isDepartmentChair()
                ? 'Award given and auto-approved.'
                : 'Award submitted. Pending Chair/Dean approval.';
            return ApiResponse::success($award, $msg, 201);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    /**
     * Student applies for an award.
     */
    public function apply(Request $request)
    {
        $data = $request->validate([
            'awardName'     => 'required|string|max:255',
            'description'   => 'nullable|string',
            'date_received' => 'required|date',
        ]);

        $award = $this->awardService->applyForAward($request->user(), $data);
        return ApiResponse::success($award, 'Award application submitted. Pending approval.', 201);
    }

    /**
     * Dean or Chair approves a pending award.
     */
    public function approve(Request $request, $id)
    {
        try {
            $award = $this->awardService->approveAward($request->user(), $id);
            return ApiResponse::success($award, 'Award approved successfully.');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    /**
     * Dean or Chair rejects a pending award.
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string',
        ]);

        try {
            $award = $this->awardService->rejectAward($request->user(), $id, $request->input('reason'));
            return ApiResponse::success($award, 'Award rejected.');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }
}
