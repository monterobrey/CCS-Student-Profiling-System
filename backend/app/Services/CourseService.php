<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Program;

class CourseService
{
    /**
     * Get all courses, optionally filtered by program.
     */
    public function getAll($programId = null)
    {
        $query = Course::with(['program', 'department', 'curriculumPrograms']);

        if ($programId) {
            $query->where('program_id', $programId);
        }

        return $query->get();
    }

    /**
     * Create a new course.
     */
    public function create(array $data)
    {
        $program = Program::findOrFail($data['program_id']);

        return Course::create([
            'course_code'   => $data['course_code'],
            'course_name'   => $data['course_name'],
            'program_id'    => $data['program_id'],
            'department_id' => $program->department_id,
            'year_level'    => $data['year_level'],
            'semester'      => $data['semester'],
            'type'          => $data['type'],
            'lec_units'     => $data['lec_units'] ?? 0,
            'lab_units'     => $data['lab_units'] ?? 0,
            'units'         => $data['units'],
            'prerequisites' => $data['prerequisites'] ?? null,
        ])->load(['program', 'department']);
    }

    /**
     * Update an existing course.
     */
    public function update($id, array $data)
    {
        $course  = Course::findOrFail($id);
        $program = Program::findOrFail($data['program_id']);

        $course->update([
            'course_code'   => $data['course_code'],
            'course_name'   => $data['course_name'],
            'program_id'    => $data['program_id'],
            'department_id' => $program->department_id,
            'year_level'    => $data['year_level'],
            'semester'      => $data['semester'],
            'type'          => $data['type'],
            'lec_units'     => $data['lec_units'] ?? 0,
            'lab_units'     => $data['lab_units'] ?? 0,
            'units'         => $data['units'],
            'prerequisites' => $data['prerequisites'] ?? null,
        ]);

        return $course->load(['program', 'department']);
    }

    /**
     * Delete a course.
     */
    public function delete($id)
    {
        return Course::destroy($id);
    }
}
