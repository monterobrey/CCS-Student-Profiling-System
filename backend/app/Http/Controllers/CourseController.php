<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Department;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CourseController extends Controller
{
    /**
     * Get all courses.
     */
    public function index(Request $request)
    {
        $query = Course::with(['program', 'department']);

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        return response()->json($query->get());
    }

    /**
     * Store a new course.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'course_code' => 'required|string|unique:courses,course_code',
            'course_name' => 'required|string',
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
            'type' => 'required|in:lec,lab,lec+lab',
            'lec_units' => 'nullable|integer',
            'lab_units' => 'nullable|integer',
            'units' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get department from program
        $program = Program::find($request->program_id);

        $course = Course::create([
            'course_code' => $request->course_code,
            'course_name' => $request->course_name,
            'program_id' => $request->program_id,
            'department_id' => $program->department_id,
            'year_level' => $request->year_level,
            'semester' => $request->semester,
            'type' => $request->type,
            'lec_units' => $request->lec_units ?? 0,
            'lab_units' => $request->lab_units ?? 0,
            'units' => $request->units,
            'prerequisites' => $request->prerequisites,
        ]);

        return response()->json([
            'message' => 'Course created successfully.',
            'data' => $course->load(['program', 'department'])
        ], 201);
    }

    /**
     * Update a course.
     */
    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'course_code' => 'required|string|unique:courses,course_code,' . $id,
            'course_name' => 'required|string',
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
            'type' => 'required|in:lec,lab,lec+lab',
            'lec_units' => 'nullable|integer',
            'lab_units' => 'nullable|integer',
            'units' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $program = Program::find($request->program_id);

        $course->update([
            'course_code' => $request->course_code,
            'course_name' => $request->course_name,
            'program_id' => $request->program_id,
            'department_id' => $program->department_id,
            'year_level' => $request->year_level,
            'semester' => $request->semester,
            'type' => $request->type,
            'lec_units' => $request->lec_units ?? 0,
            'lab_units' => $request->lab_units ?? 0,
            'units' => $request->units,
            'prerequisites' => $request->prerequisites,
        ]);

        return response()->json([
            'message' => 'Course updated successfully.',
            'data' => $course->load(['program', 'department'])
        ]);
    }

    /**
     * Remove a course.
     */
    public function destroy($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully.']);
    }
}
