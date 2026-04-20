<?php

namespace App\Services;

use App\Models\User;
use App\Models\Program;
use App\Models\Section;
use App\Models\Department;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

/**
 * Service for importing students from CSV files.
 * Handles CSV parsing, validation, and bulk student creation.
 */
class StudentImportService
{
    protected $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    /**
     * Import students from file.
     * Expected columns: student_number, first_name, last_name, middle_name, email, program_code, year_level, section_char
     * 
     * @param string $filePath
     * @param string $defaultDepartment
     * @return array [imported_count, errors]
     */
    public function importFromFile($filePath, $defaultDepartment = 'College of Computing Studies')
    {
        ini_set('auto_detect_line_endings', true);
        $handle = fopen($filePath, 'r');
        fgetcsv($handle); // Skip header

        $csvData = [];
        while (($data = fgetcsv($handle)) !== FALSE) {
            if (empty($data) || (count($data) === 1 && empty($data[0]))) continue;
            $csvData[] = $data;
        }
        fclose($handle);

        return $this->processStudentData($csvData, $defaultDepartment);
    }

    /**
     * Process array of student data from CSV.
     */
    public function processStudentData($csvData, $defaultDepartment = 'College of Computing Studies')
    {
        $imported = 0;
        $errors = [];
        $rowNumber = 2; // Start at 2 since row 1 is header

        foreach ($csvData as $data) {
            try {
                if (count($data) < 8) {
                    throw new \Exception("Insufficient columns. Expected 8 (student_number, first_name, last_name, middle_name, email, program_code, year_level, section_char).");
                }

                // Extract and trim data
                $studentNumber = trim($data[0]);
                $firstName = trim($data[1]);
                $lastName = trim($data[2]);
                $middleName = trim($data[3]) ?: null;
                $email = trim($data[4]);
                $programCode = trim($data[5]);
                $year = trim($data[6]);
                $sectionChar = trim($data[7]);

                // Validation
                if (empty($studentNumber) || empty($firstName) || empty($lastName) || empty($email)) {
                    throw new \Exception("Required fields missing (student_number, first_name, last_name, email).");
                }

                // Check for duplicates
                if (User::where('student_number', $studentNumber)->exists()) {
                    throw new \Exception("Student number $studentNumber already exists.");
                }
                if (User::where('email', $email)->exists()) {
                    throw new \Exception("Email $email already exists.");
                }

                if (!is_numeric($year) || $year < 1 || $year > 4) {
                    throw new \Exception("Year level must be between 1-4.");
                }

                // Create student
                $this->createStudentFromCsvRow([
                    'student_number' => $studentNumber,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $middleName,
                    'email' => $email,
                    'program_code' => $programCode,
                    'year_level' => (int)$year,
                    'section_char' => $sectionChar,
                    'department_name' => $defaultDepartment,
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row $rowNumber: " . $e->getMessage();
            }

            $rowNumber++;
        }

        return [
            'imported_count' => $imported,
            'errors' => $errors,
        ];
    }

    /**
     * Create single student from CSV row data.
     */
    protected function createStudentFromCsvRow($data)
    {
        DB::transaction(function () use ($data) {
            // Get or create department
            $department = Department::firstOrCreate(
                ['department_name' => $data['department_name']]
            );

            // Get or create program
            $program = Program::firstOrCreate(
                ['program_code' => $data['program_code'], 'department_id' => $department->id],
                [
                    'program_name' => $this->getProgramName($data['program_code']),
                    'department_id' => $department->id
                ]
            );

            // Get or create section
            $sectionName = "{$data['program_code']} {$data['year_level']}-{$data['section_char']}";
            $section = Section::firstOrCreate(
                [
                    'section_name' => $sectionName,
                    'program_id' => $program->id,
                    'department_id' => $department->id
                ],
                [
                    'year_level' => $data['year_level'],
                    'school_year' => '2026-2027'
                ]
            );

            // Create student using StudentService — skip email during bulk import
            $this->studentService->createStudent([
                'student_number'    => $data['student_number'],
                'first_name'        => $data['first_name'],
                'last_name'         => $data['last_name'],
                'middle_name'       => $data['middle_name'],
                'email'             => $data['email'],
                'program_id'        => $program->id,
                'section_id'        => $section->id,
                'year_level'        => $data['year_level'],
                'skip_notification' => true,
            ]);
        });
    }

    /**
     * Map program code to proper program name.
     */
    protected function getProgramName($programCode)
    {
        $programs = [
            'BSIT'  => 'Bachelor of Science in Information Technology',
            'BSCS'  => 'Bachelor of Science in Computer Science',
            'BSIS'  => 'Bachelor of Science in Information Systems',
            'BSDED' => 'Bachelor of Science in Data Engineering and Design',
        ];

        return $programs[$programCode] ?? $programCode;
    }
}
