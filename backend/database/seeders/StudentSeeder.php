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
        $targetTotal  = 500;

        // Distribute 500 students across 4 year levels × 2 programs = 8 groups
        // ~62-63 students per group, split into sections of ~25 each
        $studentsPerGroup   = (int) ceil($targetTotal / 8);
        $studentsPerSection = 25;

        for ($year = 1; $year <= 4; $year++) {
            foreach ($programs as $program) {
                if ($studentCount >= $targetTotal) break 2;

                $groupSize    = min($studentsPerGroup, $targetTotal - $studentCount);
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
                            'gwa'            => number_format(1.0 + (rand(0, 200) / 100), 2),
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
