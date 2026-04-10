<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Student;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class FacultyScheduleController extends Controller
{
    /**
     * Get the authenticated faculty's teaching schedule.
     */
    public function index(Request $request)
    {
        $schedules = Schedule::where('faculty_id', $request->user()->faculty->id)
            ->with(['course', 'section' => function($q) {
                $q->withCount('students');
            }])
            ->get();

        return ApiResponse::success($schedules);
    }

    /**
     * Get students in a specific section (only if the faculty teaches them).
     */
    public function getSectionStudents(Request $request, $section_id)
    {
        $user = $request->user();
        
        // Verify that this faculty teaches this section
        $teachesSection = Schedule::where('faculty_id', $user->faculty->id)
            ->where('section_id', $section_id)
            ->exists();

        if (!$teachesSection) {
            return ApiResponse::unauthorized('You do not teach this section.');
        }

        $students = Student::where('section_id', $section_id)
            ->with('user')
            ->get();

        return ApiResponse::success($students);
    }
}

