<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\CalendarEvent;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    /**
     * Return all calendar events visible to the authenticated user's role.
     * Secretary sees everything they created.
     */
    public function index(Request $request)
    {
        $role = $request->user()->role;

        $events = CalendarEvent::where(function ($q) use ($role) {
                // JSON contains the role
                $q->whereJsonContains('visible_to', $role);
            })
            ->orderBy('date')
            ->get()
            ->map(fn($e) => $this->format($e));

        return ApiResponse::success($events);
    }

    /**
     * Secretary creates a new calendar event with audience targeting.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'date'        => 'required|date_format:Y-m-d',
            'start_time'  => 'nullable|date_format:H:i',
            'end_time'    => 'nullable|date_format:H:i',
            'location'    => 'nullable|string|max:255',
            'type'        => 'required|in:event,activity,meeting',
            'visible_to'  => 'required|array|min:1',
            'visible_to.*'=> 'in:dean,department_chair,faculty,student,secretary',
        ]);

        // Always include secretary so she can see her own events
        $visibleTo = array_unique(array_merge($validated['visible_to'], ['secretary']));

        $event = CalendarEvent::create([
            ...$validated,
            'visible_to' => array_values($visibleTo),
            'created_by' => $request->user()->id,
        ]);

        return ApiResponse::success($this->format($event), 'Event created.', 201);
    }

    /**
     * Update an existing event (secretary only, must be creator).
     */
    public function update(Request $request, $id)
    {
        $event = CalendarEvent::where('id', $id)
            ->where('created_by', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date'        => 'sometimes|date_format:Y-m-d',
            'start_time'  => 'nullable|date_format:H:i',
            'end_time'    => 'nullable|date_format:H:i',
            'location'    => 'nullable|string|max:255',
            'type'        => 'sometimes|in:event,activity,meeting',
            'visible_to'  => 'sometimes|array|min:1',
            'visible_to.*'=> 'in:dean,department_chair,faculty,student,secretary',
        ]);

        if (isset($validated['visible_to'])) {
            $validated['visible_to'] = array_values(
                array_unique(array_merge($validated['visible_to'], ['secretary']))
            );
        }

        $event->update($validated);

        return ApiResponse::success($this->format($event), 'Event updated.');
    }

    /**
     * Delete an event (secretary only, must be creator).
     */
    public function destroy(Request $request, $id)
    {
        $event = CalendarEvent::where('id', $id)
            ->where('created_by', $request->user()->id)
            ->firstOrFail();

        $event->delete();

        return ApiResponse::success(null, 'Event deleted.');
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private function format(CalendarEvent $e): array
    {
        return [
            'id'          => $e->id,
            'title'       => $e->title,
            'description' => $e->description ?? '',
            'date'        => $e->date->format('Y-m-d'),
            'start_time'  => $e->start_time,
            'end_time'    => $e->end_time,
            'location'    => $e->location ?? '',
            'type'        => $e->type,
            'visible_to'  => $e->visible_to,
            'created_by'  => $e->created_by,
        ];
    }
}
