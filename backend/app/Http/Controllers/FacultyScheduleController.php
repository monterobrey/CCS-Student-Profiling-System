<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Student;
use Illuminate\Http\Request;

class FacultyScheduleController extends Controller
{
    /**
     * Get the authenticated faculty's teaching schedule.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->isFaculty()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return Schedule::where('faculty_id', $user->faculty->id)
            ->with(['course', 'section' => function($q) {
                $q->withCount('students');
            }])
            ->get();
    }

    /**
     * Get students in a specific section (only if the faculty teaches them).
     */
    public function getSectionStudents(Request $request, $section_id)
    {
        $user = $request->user();
        if (!$user->isFaculty()) return response()->json(['message' => 'Unauthorized'], 403);

        // Verify that this faculty teaches this section
        $teachesSection = Schedule::where('faculty_id', $user->faculty->id)
            ->where('section_id', $section_id)
            ->exists();

        if (!$teachesSection) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return Student::where('section_id', $section_id)
            ->with('user')
            ->get();
    }
}
