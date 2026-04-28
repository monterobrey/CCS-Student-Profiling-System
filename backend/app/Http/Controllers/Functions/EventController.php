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
     * GET /calendar-events
     * Returns only events where the authenticated user's role is in visible_to.
     */
    public function index(Request $request)
    {
        $events = $this->eventService
            ->getForRole($request->user()->role)
            ->map(fn($e) => $this->eventService->format($e));

        return ApiResponse::success($events);
    }

    /**
     * POST /calendar-events — secretary only.
     * visible_to: array of roles that can see this event.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'date'         => 'required|date_format:Y-m-d',
            'start_time'   => 'nullable|date_format:H:i',
            'end_time'     => 'nullable|date_format:H:i',
            'location'     => 'nullable|string|max:255',
            'type'         => 'required|in:event,activity,meeting',
            'visible_to'   => 'required|array|min:1',
            'visible_to.*' => 'in:dean,department_chair,faculty,student,secretary',
        ]);

        $event = $this->eventService->create($request->user(), $data);

        return ApiResponse::success(
            $this->eventService->format($event),
            'Event created successfully.',
            201
        );
    }

    /**
     * DELETE /calendar-events/{id} — secretary only, must be creator.
     */
    public function destroy(Request $request, int $id)
    {
        try {
            $this->eventService->delete($request->user(), $id);
            return ApiResponse::success(null, 'Event deleted.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ApiResponse::error('Event not found or you are not the creator.', 404);
        }
    }
}
