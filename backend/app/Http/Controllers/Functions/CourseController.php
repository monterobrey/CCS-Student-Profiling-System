<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Services\CourseService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    protected $courseService;

    public function __construct(CourseService $courseService)
    {
        $this->courseService = $courseService;
    }

    /**
     * Get all courses.
     */
    public function index(Request $request)
    {
        $courses = $this->courseService->getAllCourses($request->input('program_id'));
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

        $course = $this->courseService->createCourse($data);
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

        $course = $this->courseService->updateCourse($id, $data);
        return ApiResponse::success($course, 'Course updated successfully.');
    }

    /**
     * Delete a course.
     */
    public function destroy($id)
    {
        $this->courseService->deleteCourse($id);
        return ApiResponse::success(null, 'Course deleted successfully.');
    }
}

