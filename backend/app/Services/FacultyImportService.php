<?php

namespace App\Services;

use App\Models\User;
use App\Models\Faculty;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

/**
 * Service for importing faculty members from CSV files.
 */
class FacultyImportService
{
    protected $facultyService;

    public function __construct(FacultyService $facultyService)
    {
        $this->facultyService = $facultyService;
    }

    /**
     * Import faculty from file.
     * Expected columns: first_name, last_name, middle_name, email, position
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

        return $this->processFacultyData($csvData, $defaultDepartment);
    }

    /**
     * Process array of faculty data from CSV.
     */
    public function processFacultyData($csvData, $defaultDepartment = 'College of Computing Studies')
    {
        $imported = 0;
        $errors = [];
        $rowNumber = 2; // Start at 2 since row 1 is header

        foreach ($csvData as $data) {
            try {
                if (count($data) < 5) {
                    throw new \Exception("Insufficient columns. Expected 5 (first_name, last_name, middle_name, email, position).");
                }

                // Extract and trim data
                $firstName = trim($data[0]);
                $lastName = trim($data[1]);
                $middleName = trim($data[2]) ?: null;
                $email = trim($data[3]);
                $position = trim($data[4]);

                // Validation
                if (empty($firstName) || empty($lastName) || empty($email) || empty($position)) {
                    throw new \Exception("Required fields missing (first_name, last_name, email, position).");
                }

                // Check for duplicates
                if (User::where('email', $email)->exists()) {
                    throw new \Exception("Email $email already exists.");
                }

                // Create faculty
                $this->createFacultyFromCsvRow([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $middleName,
                    'email' => $email,
                    'position' => $position,
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
     * Create single faculty from CSV row data.
     */
    protected function createFacultyFromCsvRow($data)
    {
        DB::transaction(function () use ($data) {
            // Get or create department
            $department = Department::firstOrCreate(
                ['department_name' => $data['department_name']]
            );

            // Create faculty using FacultyService
            $this->facultyService->createFaculty([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'middle_name' => $data['middle_name'],
                'email' => $data['email'],
                'position' => $data['position'],
                'department_id' => $department->id,
            ]);
        });
    }
}
