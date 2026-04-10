<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\User;
use App\Models\Student;
use App\Models\Program;
use App\Models\Section;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $department = Department::firstOrCreate(['department_name' => 'College of Computing Studies']);
        
        $bsit = Program::firstOrCreate(
            ['program_code' => 'BSIT', 'department_id' => $department->id],
            ['program_name' => 'Bachelor of Science in Information Technology']
        );
        
        $bscs = Program::firstOrCreate(
            ['program_code' => 'BSCS', 'department_id' => $department->id],
            ['program_name' => 'Bachelor of Science in Computer Science']
        );

        $programs = [$bsit, $bscs];

        $firstNames = [
            'Ethan', 'Althea', 'Joaquin', 'Bianca', 'Miguel', 'Yuan', 'Tala', 'Hiraya', 'Lakan', 'Mayari',
            'Sari', 'Datu', 'Malaya', 'Kidlat', 'Liwayway', 'Ulan', 'Bituin', 'Araw', 'Sinag', 'Lakambini',
            'Alon', 'Agos', 'Himig', 'Awit', 'Laya', 'Bagwis', 'Sulyap', 'Ngiti', 'Tawa', 'Yakap',
            'Halakhak', 'Indak', 'Sayaw', 'Tugtog', 'Kumpas', 'Galaw', 'Likha', 'Obra', 'Sining', 'Diwa'
        ];

        $lastNames = [
            'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrada',
            'Castillo', 'Flores', 'Villanueva', 'Ramos', 'Castro', 'Rivera', 'Aquino', 'Guzman', 'Lucero', 'Dizon',
            'Mercado', 'Pascual', 'Delos Reyes', 'Santiago', 'Soriano', 'Valencia', 'Navarro', 'Ferrer', 'Corpuz', 'Padilla'
        ];

        for ($year = 1; $year <= 4; $year++) {
            foreach ($programs as $program) {
                $section = Section::firstOrCreate([
                    'section_name' => $program->program_code . " " . $year . "-A",
                    'program_id' => $program->id,
                    'department_id' => $department->id,
                    'year_level' => (string)$year,
                    'school_year' => '2026-2027'
                ]);

                // Create 5 students per program per year = 10 students per year
                for ($i = 1; $i <= 5; $i++) {
                    $firstName = $firstNames[array_rand($firstNames)];
                    $lastName = $lastNames[array_rand($lastNames)];
                    $studentNumber = "2026-" . Str::padLeft(rand(0, 99999), 5, '0');
                    $email = strtolower($firstName . "." . Str::slug($lastName) . rand(1, 99) . "@gmail.com");

                    $user = User::firstOrCreate([
                        'email' => $email,
                    ], [
                        'student_number' => $studentNumber,
                        'password' => Hash::make('password'),
                        'role' => 'student',
                        'status' => 'active',
                        'password_set_at' => now(),
                    ]);

                    Student::updateOrCreate([
                        'user_id' => $user->id,
                    ], [
                        'program_id' => $program->id,
                        'section_id' => $section->id,
                        'year_level' => $year,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'gender' => rand(0, 1) ? 'Male' : 'Female',
                        'contact_number' => '09' . rand(100000000, 999999999),
                        'address' => 'Cabuyao, Laguna',
                        'gwa' => number_format(1.0 + (rand(0, 200) / 100), 2), // Random GWA between 1.0 and 3.0
                    ]);
                }
            }
        }
    }
}
