<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\User;
use App\Models\Student;
use App\Models\Program;
use App\Models\Section;
use App\Models\Department;
use App\Models\StudentSkill;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
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
            'Halakhak', 'Indak', 'Sayaw', 'Tugtog', 'Kumpas', 'Galaw', 'Likha', 'Obra', 'Sining', 'Diwa',
            'Marco', 'Sofia', 'Diego', 'Camille', 'Rafael', 'Isabelle', 'Anton', 'Pia', 'Carlo', 'Lea',
        ];

        $lastNames = [
            'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrada',
            'Castillo', 'Flores', 'Villanueva', 'Ramos', 'Castro', 'Rivera', 'Aquino', 'Guzman', 'Lucero', 'Dizon',
            'Mercado', 'Pascual', 'Delos Reyes', 'Santiago', 'Soriano', 'Valencia', 'Navarro', 'Ferrer', 'Corpuz', 'Padilla',
            'Dela Cruz', 'Espiritu', 'Bernardo', 'Macaraeg', 'Tolentino', 'Legaspi', 'Ibarra', 'Umali', 'Galang', 'Lacson',
        ];

        // Skills pool: mix of sports, tech, and soft skills
        $skillsPool = [
            // Sports
            ['name' => 'Basketball',        'category' => 'Sports'],
            ['name' => 'Volleyball',        'category' => 'Sports'],
            ['name' => 'Badminton',         'category' => 'Sports'],
            ['name' => 'Swimming',          'category' => 'Sports'],
            ['name' => 'Table Tennis',      'category' => 'Sports'],
            ['name' => 'Chess',             'category' => 'Sports'],
            ['name' => 'Futsal',            'category' => 'Sports'],
            ['name' => 'Track and Field',   'category' => 'Sports'],
            // Programming
            ['name' => 'Java',              'category' => 'Programming'],
            ['name' => 'C++',               'category' => 'Programming'],
            ['name' => 'Python',            'category' => 'Programming'],
            ['name' => 'JavaScript',        'category' => 'Programming'],
            ['name' => 'PHP',               'category' => 'Programming'],
            ['name' => 'Kotlin',            'category' => 'Programming'],
            ['name' => 'Swift',             'category' => 'Programming'],
            ['name' => 'C#',                'category' => 'Programming'],
            // Web / Design
            ['name' => 'React',             'category' => 'Web Development'],
            ['name' => 'Laravel',           'category' => 'Web Development'],
            ['name' => 'UI/UX Design',      'category' => 'Design'],
            ['name' => 'Figma',             'category' => 'Design'],
            ['name' => 'Graphic Design',    'category' => 'Design'],
            // Data / Systems
            ['name' => 'MySQL',             'category' => 'Database'],
            ['name' => 'Data Analysis',     'category' => 'Data Science'],
            ['name' => 'Machine Learning',  'category' => 'Data Science'],
            ['name' => 'Networking',        'category' => 'Systems'],
            ['name' => 'Linux',             'category' => 'Systems'],
            // Soft skills / Arts
            ['name' => 'Public Speaking',   'category' => 'Communication'],
            ['name' => 'Leadership',        'category' => 'Soft Skills'],
            ['name' => 'Photography',       'category' => 'Arts'],
            ['name' => 'Video Editing',     'category' => 'Arts'],
        ];

        $studentCount = 0;
        $targetTotal  = 1000;

        // Distribute 1000 students across 4 year levels × 2 programs = 8 groups
        // Varied distribution: more students in lower years
        $yearDistribution = [
            1 => 0.35,  // 35% first year
            2 => 0.30,  // 30% second year
            3 => 0.20,  // 20% third year
            4 => 0.15,  // 15% fourth year
        ];

        $studentsPerSection = 30;

        for ($year = 1; $year <= 4; $year++) {
            foreach ($programs as $program) {
                if ($studentCount >= $targetTotal) break 2;

                // Calculate group size based on year distribution
                $groupSize = (int) floor(($targetTotal / 2) * $yearDistribution[$year]);
                $sectionCount = (int) ceil($groupSize / $studentsPerSection);

                // Ensure sections exist
                $sections = [];
                for ($s = 0; $s < $sectionCount; $s++) {
                    $letter = chr(65 + $s); // A, B, C...
                    $sections[] = Section::firstOrCreate([
                        'section_name'  => $program->program_code . " {$year}-{$letter}",
                        'program_id'    => $program->id,
                        'department_id' => $department->id,
                        'year_level'    => (string) $year,
                        'school_year'   => '2026-2027',
                    ]);
                }

                for ($i = 0; $i < $groupSize; $i++) {
                    if ($studentCount >= $targetTotal) break;

                    $firstName     = $firstNames[array_rand($firstNames)];
                    $lastName      = $lastNames[array_rand($lastNames)];
                    $studentNumber = "2026" . str_pad($studentCount + 1, 5, '0', STR_PAD_LEFT);
                    $email         = strtolower($firstName . "." . Str::slug($lastName) . rand(1, 999) . "@gmail.com");

                    // Assign to section round-robin
                    $section = $sections[$i % count($sections)];

                    $user = User::firstOrCreate(
                        ['email' => $email],
                        [
                            'student_number'  => $studentNumber,
                            'password'        => Hash::make('password'),
                            'role'            => 'student',
                            'status'          => 'active',
                            'password_set_at' => now(),
                        ]
                    );

                    // GWA distribution with realistic spread:
                    // 5% Dean's List (1.00-1.50)
                    // 25% Very Good (1.51-2.00)
                    // 40% Good (2.01-2.50)
                    // 20% Satisfactory (2.51-3.00)
                    // 10% At Risk (3.01-5.00)
                    $rand = rand(1, 100);
                    if ($rand <= 5) {
                        // Dean's List
                        $gwa = 1.00 + (rand(0, 50) / 100);
                    } elseif ($rand <= 30) {
                        // Very Good
                        $gwa = 1.51 + (rand(0, 49) / 100);
                    } elseif ($rand <= 70) {
                        // Good
                        $gwa = 2.01 + (rand(0, 49) / 100);
                    } elseif ($rand <= 90) {
                        // Satisfactory
                        $gwa = 2.51 + (rand(0, 49) / 100);
                    } else {
                        // At Risk
                        $gwa = 3.01 + (rand(0, 199) / 100);
                    }

                    $student = Student::updateOrCreate(
                        ['user_id' => $user->id],
                        [
                            'program_id'     => $program->id,
                            'section_id'     => $section->id,
                            'year_level'     => $year,
                            'first_name'     => $firstName,
                            'last_name'      => $lastName,
                            'gender'         => rand(0, 1) ? 'Male' : 'Female',
                            'contact_number' => '09' . rand(100000000, 999999999),
                            'address'        => 'Cabuyao, Laguna',
                            'gwa'            => number_format($gwa, 2),
                        ]
                    );

                    // Assign 1–3 random skills per student
                    $skillCount     = rand(1, 3);
                    $shuffled       = $skillsPool;
                    shuffle($shuffled);
                    $pickedSkills   = array_slice($shuffled, 0, $skillCount);

                    foreach ($pickedSkills as $skill) {
                        StudentSkill::firstOrCreate(
                            [
                                'student_id' => $student->id,
                                'skillName'  => $skill['name'],
                            ],
                            ['skill_category' => $skill['category']]
                        );
                    }

                    $studentCount++;
                }
            }
        }
    }
}
