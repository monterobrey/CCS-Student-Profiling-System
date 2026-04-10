<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Program;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * Get all courses.
     */
    public function index(Request $request)
    {
        $query = Course::with(['program', 'department']);

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->input('program_id'));
        }

        $courses = $query->get();
        return ApiResponse::success($courses);
    }

    /**
     * Store a new course.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'course_code' => 'required|string|unique:courses,course_code',
            'course_name' => 'required|string',
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
            'type' => 'required|in:lec,lab,lec+lab',
            'lec_units' => 'nullable|integer',
            'lab_units' => 'nullable|integer',
            'units' => 'required|integer',
            'prerequisites' => 'nullable|string',
        ]);

        $program = Program::findOrFail($data['program_id']);

        $course = Course::create([
            'course_code' => $data['course_code'],
            'course_name' => $data['course_name'],
            'program_id' => $data['program_id'],
            'department_id' => $program->department_id,
            'year_level' => $data['year_level'],
            'semester' => $data['semester'],
            'type' => $data['type'],
            'lec_units' => $data['lec_units'] ?? 0,
            'lab_units' => $data['lab_units'] ?? 0,
            'units' => $data['units'],
            'prerequisites' => $data['prerequisites'] ?? null,
        ])->load(['program', 'department']);

        return ApiResponse::success($course, 'Course created successfully.', 201);
    }

    /**
     * Update a course.
     */
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'course_code' => 'required|string|unique:courses,course_code,' . $id,
            'course_name' => 'required|string',
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
            'type' => 'required|in:lec,lab,lec+lab',
            'lec_units' => 'nullable|integer',
            'lab_units' => 'nullable|integer',
            'units' => 'required|integer',
            'prerequisites' => 'nullable|string',
        ]);

        $course = Course::findOrFail($id);
        $program = Program::findOrFail($data['program_id']);

        $course->update([
            'course_code' => $data['course_code'],
            'course_name' => $data['course_name'],
            'program_id' => $data['program_id'],
            'department_id' => $program->department_id,
            'year_level' => $data['year_level'],
            'semester' => $data['semester'],
            'type' => $data['type'],
            'lec_units' => $data['lec_units'] ?? 0,
            'lab_units' => $data['lab_units'] ?? 0,
            'units' => $data['units'],
            'prerequisites' => $data['prerequisites'] ?? null,
        ]);

        $course->load(['program', 'department']);
        return ApiResponse::success($course, 'Course updated successfully.');
    }

    /**
     * Delete a course.
     */
    public function destroy($id)
    {
        Course::destroy($id);
        return ApiResponse::success(null, 'Course deleted successfully.');
    }
}

