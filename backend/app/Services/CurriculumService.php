<?php

namespace App\Services;

use App\Models\Curriculum;
use App\Models\Program;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

/**
 * Service for curriculum management.
 */
class CurriculumService
{
    /**
     * Get all curriculum entries, optionally filtered by program.
     */
    public function getAllCurriculum($programId = null)
    {
        $query = Curriculum::with(['program', 'course', 'creator']);

        if ($programId) {
            $query->where('program_id', $programId);
        }

        return $query->get();
    }

    /**
     * Create a single curriculum entry.
     */
    public function createEntry($data, $userId)
    {
        $exists = Curriculum::where([
            'program_id' => $data['program_id'],
            'course_id' => $data['course_id'],
        ])->exists();

        if ($exists) {
            throw new \Exception('Course already exists in this program curriculum.');
        }

        return Curriculum::create([
            'program_id' => $data['program_id'],
            'course_id' => $data['course_id'],
            'year_level' => $data['year_level'],
            'semester' => $data['semester'],
            'created_by' => $userId,
        ])->load(['program', 'course']);
    }

    /**
     * Store multiple curriculum entries in bulk.
     */
    public function bulkCreate($data, $userId)
    {
        $createdCount = 0;
        $skippedCount = 0;

        DB::transaction(function () use (&$data, &$userId, &$createdCount, &$skippedCount) {
            foreach ($data['course_ids'] as $courseId) {
                $exists = Curriculum::where([
                    'program_id' => $data['program_id'],
                    'course_id' => $courseId,
                ])->exists();

                if (!$exists) {
                    Curriculum::create([
                        'program_id' => $data['program_id'],
                        'course_id' => $courseId,
                        'year_level' => $data['year_level'],
                        'semester' => $data['semester'],
                        'created_by' => $userId,
                    ]);
                    $createdCount++;
                } else {
                    $skippedCount++;
                }
            }
        });

        return [
            'created' => $createdCount,
            'skipped' => $skippedCount,
        ];
    }

    /**
     * Import curriculum from CSV.
     */
    public function importFromCsv($file, $userId)
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);
        $header = array_map('trim', $header);

        $importedCount = 0;
        $errors = [];
        $rowNum = 1;
        $prerequisitesMap = [];

        DB::transaction(function () use (&$handle, &$header, &$importedCount, &$errors, &$rowNum, &$prerequisitesMap, &$userId) {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;
                if (count($row) < 9) {
                    $errors[] = "Row $rowNum: Not enough columns.";
                    continue;
                }

                if (count($header) !== count($row)) {
                    $errors[] = "Row $rowNum: Column count mismatch.";
                    continue;
                }

                $data = array_combine($header, $row);
                
                $semester = $data['semester'];
                if ($semester == '1') $semester = '1st';
                elseif ($semester == '2') $semester = '2nd';

                $program = Program::where('program_code', $data['program_code'])->first();
                if (!$program && is_numeric($data['program_code'])) {
                    $program = Program::find($data['program_code']);
                }

                if (!$program) {
                    $errors[] = "Row $rowNum: Program '{$data['program_code']}' not found.";
                    continue;
                }

                $lecUnits = (int)($data['lec_units'] ?? 0);
                $labUnits = (int)($data['lab_units'] ?? 0);
                $type = 'lec';
                if ($lecUnits > 0 && $labUnits > 0) $type = 'lec+lab';
                elseif ($labUnits > 0) $type = 'lab';

                $course = Course::updateOrCreate(
                    ['course_code' => $data['course_code']],
                    [
                        'course_name' => $data['course_name'],
                        'lec_units' => $lecUnits,
                        'lab_units' => $labUnits,
                        'units' => $data['units'],
                        'program_id' => $program->id,
                        'department_id' => $program->department_id,
                        'year_level' => $data['year_level'],
                        'semester' => $semester,
                        'type' => $type,
                        'prerequisites' => $data['prerequisites'] !== 'none' ? $data['prerequisites'] : null,
                    ]
                );

                if ($data['prerequisites'] && $data['prerequisites'] !== 'none') {
                    $prerequisitesMap[$course->id] = $data['prerequisites'];
                }

                Curriculum::updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'course_id' => $course->id,
                    ],
                    [
                        'year_level' => $data['year_level'],
                        'semester' => $semester,
                        'created_by' => $userId,
                    ]
                );
                $importedCount++;
            }

            foreach ($prerequisitesMap as $courseId => $prereqText) {
                $course = Course::find($courseId);
                $course->prerequisiteCourses()->detach();

                $prereqCodes = array_map('trim', explode(',', $prereqText));
                foreach ($prereqCodes as $code) {
                    $prereqCourse = Course::where('course_code', $code)->first();
                    if ($prereqCourse) {
                        $course->prerequisiteCourses()->attach($prereqCourse->id);
                    }
                }
            }
        });

        fclose($handle);

        return [
            'imported' => $importedCount,
            'errors' => $errors,
        ];
    }

    /**
     * Delete a curriculum entry.
     */
    public function deleteEntry($curriculumId)
    {
        return Curriculum::destroy($curriculumId);
    }
}
