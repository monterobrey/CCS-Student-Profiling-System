<?php

namespace App\Services;

use App\Models\Event;

class EventService
{
    /**
     * Return all events (visible to all authenticated users).
     */
    public function getAll(): \Illuminate\Database\Eloquent\Collection
    {
        return Event::with('creator:id,email')
            ->orderBy('date')
            ->get();
    }

    /**
     * Create a new event. Only secretary / admin roles call this.
     */
    public function create($user, array $data): Event
    {
        return Event::create([
            'created_by'  => $user->id,
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'date'        => $data['date'],
            'start_time'  => $data['start_time'] ?? null,
            'end_time'    => $data['end_time'] ?? null,
            'location'    => $data['location'] ?? null,
            'type'        => $data['type'] ?? 'event',
        ]);
    }

    /**
     * Delete an event. Only the creator or dean may delete.
     */
    public function delete($user, int $id): void
    {
        $event = Event::findOrFail($id);

        if ($event->created_by !== $user->id && !$user->isDean()) {
            throw new \Exception('You are not allowed to delete this event.');
        }

        $event->delete();
    }
}
