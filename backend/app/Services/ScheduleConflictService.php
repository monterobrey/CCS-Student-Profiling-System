<?php

namespace App\Services;

use App\Models\Schedule;
use Carbon\Carbon;

/**
 * Service for validating and detecting schedule conflicts.
 * Ensures no overlapping classes in time slots.
 */
class ScheduleConflictService
{
    /**
     * Check if a new schedule conflicts with existing schedules.
     * 
     * @param int $courseId
     * @param int $facultyId
     * @param int $sectionId
     * @param string $dayOfWeek (Monday, Tuesday, etc.)
     * @param string $startTime (HH:MM format)
     * @param string $endTime (HH:MM format)
     * @return bool
     */
    public function hasConflict($courseId, $facultyId, $sectionId, $dayOfWeek, $startTime, $endTime)
    {
        // Check faculty schedule conflict (same faculty can't teach two courses at same time)
        $facultyConflict = Schedule::where('faculty_id', $facultyId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                    });
            })
            ->exists();

        if ($facultyConflict) {
            return true;
        }

        // Check section schedule conflict (same section can't be in two places at same time)
        $sectionConflict = Schedule::where('section_id', $sectionId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                    });
            })
            ->exists();

        return $sectionConflict;
    }

    /**
     * Get all conflicts for a specific schedule range.
     */
    public function getConflicts($courseId, $facultyId, $sectionId, $dayOfWeek, $startTime, $endTime)
    {
        $conflicts = [];

        // Faculty conflicts
        $facultyConflicts = Schedule::where('faculty_id', $facultyId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                    });
            })
            ->with('course', 'faculty')
            ->get();

        if ($facultyConflicts->isNotEmpty()) {
            $conflicts['faculty_conflicts'] = $facultyConflicts;
        }

        // Section conflicts
        $sectionConflicts = Schedule::where('section_id', $sectionId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                    });
            })
            ->with('course', 'section')
            ->get();

        if ($sectionConflicts->isNotEmpty()) {
            $conflicts['section_conflicts'] = $sectionConflicts;
        }

        return $conflicts;
    }

    /**
     * Validate if time range is valid (end time after start time).
     */
    public function isValidTimeRange($startTime, $endTime)
    {
        try {
            $start = Carbon::createFromFormat('H:i', $startTime);
            $end = Carbon::createFromFormat('H:i', $endTime);
            return $end->isAfter($start);
        } catch (\Exception $e) {
            return false;
        }
    }
}
