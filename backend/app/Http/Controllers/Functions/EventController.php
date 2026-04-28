<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\EventService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    protected EventService $eventService;

    public function __construct(EventService $eventService)
    {
        $this->eventService = $eventService;
    }

    /**
     * GET /events — all authenticated users can view.
     */
    public function index()
    {
        $events = $this->eventService->getAll();
        return ApiResponse::success($events);
    }

    /**
     * POST /events — secretary only.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'date'        => 'required|date',
            'start_time'  => 'nullable|date_format:H:i',
            'end_time'    => 'nullable|date_format:H:i|after_or_equal:start_time',
            'location'    => 'nullable|string|max:255',
            'type'        => 'nullable|in:event,activity,meeting',
        ]);

        $event = $this->eventService->create($request->user(), $data);
        return ApiResponse::success($event, 'Event created successfully.', 201);
    }

    /**
     * DELETE /events/{id} — creator or dean only.
     */
    public function destroy(Request $request, int $id)
    {
        try {
            $this->eventService->delete($request->user(), $id);
            return ApiResponse::success(null, 'Event deleted.');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 403);
        }
    }
}
