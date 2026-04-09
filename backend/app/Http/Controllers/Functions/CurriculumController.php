<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\Program;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CurriculumController extends Controller
{
    /**
     * Get curriculum list (filtered by program if provided).
     */
    public function index(Request $request)
    {
        $query = Curriculum::with(['program', 'course', 'creator']);

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        return response()->json($query->get());
    }

    /**
     * Store a single curriculum entry (manual entry).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'program_id' => 'required|exists:programs,id',
            'course_id' => 'required|exists:courses,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Avoid duplicate course in same program/year/semester
        $exists = Curriculum::where([
            'program_id' => $request->program_id,
            'course_id' => $request->course_id,
        ])->exists();

        if ($exists) {
            return response()->json(['message' => 'Course already exists in this program curriculum.'], 422);
        }

        $curriculum = Curriculum::create([
            'program_id' => $request->program_id,
            'course_id' => $request->course_id,
            'year_level' => $request->year_level,
            'semester' => $request->semester,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Curriculum entry added successfully.',
            'data' => $curriculum->load(['program', 'course'])
        ], 201);
    }

    /**
     * Store multiple curriculum entries (bulk manual entry).
     */
    public function bulkStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'semester' => 'required|string',
            'course_ids' => 'required|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $createdCount = 0;
        $skippedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($request->course_ids as $courseId) {
                // Check if it already exists for this program
                $exists = Curriculum::where([
                    'program_id' => $request->program_id,
                    'course_id' => $courseId,
                ])->exists();

                if (!$exists) {
                    Curriculum::create([
                        'program_id' => $request->program_id,
                        'course_id' => $courseId,
                        'year_level' => $request->year_level,
                        'semester' => $request->semester,
                        'created_by' => $request->user()->id,
                    ]);
                    $createdCount++;
                } else {
                    $skippedCount++;
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Bulk store failed: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'message' => "Successfully added $createdCount courses. Skipped $skippedCount existing courses.",
        ], 201);
    }

    /**
     * Import curriculum via CSV.
     * Expected CSV headers: program_code, course_code, course_name, lec_units, lab_units, units, prerequisites, year_level, semester
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle); // Read headers
        $header = array_map('trim', $header); // Clean headers

        $importedCount = 0;
        $errors = [];
        $rowNum = 1;
        $prerequisitesMap = []; // Store course_id => prerequisites_text

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;
                if (count($row) < 9) {
                    $errors[] = "Row $rowNum: Not enough columns (Found " . count($row) . ", expected 9).";
                    continue;
                }

                if (count($header) !== count($row)) {
                    $errors[] = "Row $rowNum: Column count mismatch (Expected " . count($header) . ", got " . count($row) . ").";
                    continue;
                }

                $data = array_combine($header, $row);
                
                // Normalize semester (convert '1' to '1st', '2' to '2nd')
                $semester = $data['semester'];
                if ($semester == '1') $semester = '1st';
                elseif ($semester == '2') $semester = '2nd';

                // Try to find by code first, then by ID if numeric
                $program = Program::where('program_code', $data['program_code'])->first();
                if (!$program && is_numeric($data['program_code'])) {
                    $program = Program::find($data['program_code']);
                }

                if (!$program) {
                    $errors[] = "Row $rowNum: Program '{$data['program_code']}' not found.";
                    continue;
                }

                // Determine course type
                $lecUnits = (int)($data['lec_units'] ?? 0);
                $labUnits = (int)($data['lab_units'] ?? 0);
                $type = 'lec';
                if ($lecUnits > 0 && $labUnits > 0) $type = 'lec+lab';
                elseif ($labUnits > 0) $type = 'lab';

                // Create or update course with detailed info
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
                        'created_by' => $request->user()->id,
                    ]
                );
                $importedCount++;
            }

            // Process prerequisites after all courses are created
            foreach ($prerequisitesMap as $courseId => $prereqText) {
                $course = Course::find($courseId);
                // Clear existing prerequisites to avoid duplicates
                $course->prerequisiteCourses()->detach();

                // Split by comma if there are multiple prerequisites
                $prereqCodes = array_map('trim', explode(',', $prereqText));
                foreach ($prereqCodes as $code) {
                    $prereqCourse = Course::where('course_code', $code)->first();
                    if ($prereqCourse) {
                        $course->prerequisiteCourses()->attach($prereqCourse->id);
                    }
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
        } finally {
            fclose($handle);
        }

        return response()->json([
            'message' => "Successfully imported $importedCount entries.",
            'errors' => $errors
        ]);
    }

    /**
     * Remove a curriculum entry.
     */
    public function destroy($id)
    {
        $curriculum = Curriculum::findOrFail($id);
        $curriculum->delete();

        return response()->json(['message' => 'Curriculum entry removed.']);
    }
}

