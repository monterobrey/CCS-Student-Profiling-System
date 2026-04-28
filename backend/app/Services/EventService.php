<?php

namespace App\Services;

use App\Models\Event;

class EventService
{
    /**
     * Return events visible to the given role.
     * Secretary sees all events she created.
     */
    public function getForRole(string $role): \Illuminate\Database\Eloquent\Collection
    {
        return Event::orderBy('date')
            ->where(function ($q) use ($role) {
                $q->whereJsonContains('visible_to', $role);
            })
            ->get();
    }

    /**
     * Create a new event. Secretary always included in visible_to.
     */
    public function create($user, array $data): Event
    {
        $visibleTo = array_values(
            array_unique(array_merge($data['visible_to'] ?? [], ['secretary']))
        );

        return Event::create([
            'created_by'  => $user->id,
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'date'        => $data['date'],
            'start_time'  => $data['start_time'] ?? null,
            'end_time'    => $data['end_time'] ?? null,
            'location'    => $data['location'] ?? null,
            'type'        => $data['type'] ?? 'event',
            'visible_to'  => $visibleTo,
        ]);
    }

    /**
     * Delete an event. Only the creator may delete.
     */
    public function delete($user, int $id): void
    {
        $event = Event::where('id', $id)
            ->where('created_by', $user->id)
            ->firstOrFail();

        $event->delete();
    }

    /**
     * Format an event for API response.
     */
    public function format(Event $e): array
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
            'visible_to'  => $e->visible_to ?? [],
            'created_by'  => $e->created_by,
        ];
    }
}
