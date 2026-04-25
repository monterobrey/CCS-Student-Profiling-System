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
            // Classic Filipino
            'Jose', 'Maria', 'Juan', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Luz', 'Ramon', 'Nena',
            'Eduardo', 'Teresita', 'Roberto', 'Corazon', 'Ernesto', 'Felicidad', 'Rodrigo', 'Milagros', 'Alfredo', 'Remedios',
            // Modern Filipino
            'Ethan', 'Althea', 'Joaquin', 'Bianca', 'Miguel', 'Camille', 'Rafael', 'Isabelle', 'Anton', 'Pia',
            'Marco', 'Sofia', 'Diego', 'Lea', 'Carlo', 'Trisha', 'Lance', 'Kyla', 'Vince', 'Alyssa',
            'Jericho', 'Katrina', 'Aldrin', 'Maricel', 'Ronnie', 'Sheila', 'Arvin', 'Jennie', 'Rodel', 'Glenda',
            // Baybayin-inspired / indigenous
            'Tala', 'Hiraya', 'Lakan', 'Mayari', 'Alon', 'Agos', 'Himig', 'Awit', 'Laya', 'Bagwis',
            'Sinag', 'Bituin', 'Araw', 'Kidlat', 'Liwayway', 'Ulan', 'Malaya', 'Datu', 'Sari', 'Lakambini',
            'Diwa', 'Likha', 'Obra', 'Sining', 'Sulyap', 'Ngiti', 'Tawa', 'Yakap', 'Indak', 'Sayaw',
            // More contemporary
            'Andrei', 'Janine', 'Kristoffer', 'Pauline', 'Renz', 'Charmaine', 'Jayson', 'Lovely', 'Alvin', 'Mariz',
            'Noel', 'Hazel', 'Rommel', 'Danica', 'Gian', 'Abigail', 'Jomar', 'Kristine', 'Nico', 'Vanessa',
            'Brent', 'Czarina', 'Derick', 'Erica', 'Franz', 'Giselle', 'Harold', 'Ivy', 'Jerome', 'Karen',
            'Louie', 'Mylene', 'Nathan', 'Odessa', 'Patrick', 'Queenie', 'Ricky', 'Stella', 'Tyrone', 'Uma',
            'Warren', 'Xandra', 'Yvan', 'Zara', 'Aldous', 'Bea', 'Cris', 'Donna', 'Elmo', 'Faith',
        ];

        $lastNames = [
            // Very common Filipino surnames
            'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrada',
            'Castillo', 'Flores', 'Villanueva', 'Ramos', 'Castro', 'Rivera', 'Aquino', 'Guzman', 'Lucero', 'Dizon',
            'Mercado', 'Pascual', 'Santiago', 'Soriano', 'Valencia', 'Navarro', 'Ferrer', 'Corpuz', 'Padilla', 'Lacson',
            'Dela Cruz', 'Delos Reyes', 'Espiritu', 'Bernardo', 'Macaraeg', 'Tolentino', 'Legaspi', 'Ibarra', 'Umali', 'Galang',
            // Regional / less common
            'Abella', 'Acosta', 'Aguilar', 'Alcantara', 'Alegre', 'Alvarado', 'Alvarez', 'Amador', 'Ambrosio', 'Andres',
            'Angeles', 'Antiporda', 'Antonio', 'Aragon', 'Arellano', 'Arias', 'Arroyo', 'Asuncion', 'Austria', 'Avila',
            'Bacani', 'Bagasao', 'Balbuena', 'Balderas', 'Baluyot', 'Banzon', 'Barrientos', 'Bartolome', 'Batungbakal', 'Bautista',
            'Bayani', 'Belen', 'Bellosillo', 'Benedicto', 'Benitez', 'Bernal', 'Borja', 'Briones', 'Buenaventura', 'Bueno',
            'Caballero', 'Cabrera', 'Caguioa', 'Calanog', 'Camacho', 'Camposano', 'Canlas', 'Capistrano', 'Carandang', 'Carbonell',
            'Cardenas', 'Carino', 'Carpio', 'Carreon', 'Casimiro', 'Catalan', 'Cayabyab', 'Cayanan', 'Chua', 'Clemente',
            'Cobarrubias', 'Concepcion', 'Constantino', 'Cordero', 'Coronel', 'Cortez', 'Cosico', 'Crisostomo', 'Cristobal', 'Cuaresma',
            'Dacanay', 'Dacumos', 'Dagdag', 'Dalisay', 'Dalmacio', 'Damian', 'David', 'De Guzman', 'De Jesus', 'De Leon',
            'De Villa', 'Del Rosario', 'Delgado', 'Delos Santos', 'Dimaculangan', 'Dimayuga', 'Dionisio', 'Dizon', 'Domingo', 'Donato',
            'Dulay', 'Dumlao', 'Duque', 'Dy', 'Ebora', 'Echevarria', 'Edralin', 'Ejercito', 'Enriquez', 'Escoto',
            'Espejo', 'Espinosa', 'Estacio', 'Estrada', 'Evangelista', 'Fajardo', 'Faustino', 'Fernandez', 'Figueroa', 'Fontanilla',
            'Francisco', 'Fronda', 'Fuentes', 'Gabriel', 'Gallardo', 'Gamboa', 'Garay', 'Gatdula', 'Gatmaitan', 'Genuino',
            'Gomez', 'Gonzales', 'Guerrero', 'Guevarra', 'Gutierrez', 'Hernandez', 'Herrera', 'Hidalgo', 'Hilario', 'Hontiveros',
            'Ignacio', 'Ilagan', 'Imperial', 'Infante', 'Isidro', 'Jacinto', 'Javier', 'Jimenez', 'Joaquin', 'Joson',
            'Juarez', 'Jurado', 'Katigbak', 'Lacuesta', 'Lagman', 'Laguardia', 'Lao', 'Lapid', 'Lara', 'Laurel',
            'Laxamana', 'Lazaro', 'Ledesma', 'Lim', 'Limjoco', 'Lising', 'Llamas', 'Llorente', 'Lopez', 'Lorenzo',
            'Lozada', 'Luna', 'Macapagal', 'Maceda', 'Madrigal', 'Magalona', 'Magsaysay', 'Manalang', 'Manalastas', 'Manalo',
            'Manaois', 'Mangahas', 'Maniego', 'Manlapaz', 'Manrique', 'Manuel', 'Manzano', 'Marasigan', 'Mariano', 'Marquez',
            'Martin', 'Martinez', 'Mateo', 'Medina', 'Mejia', 'Melgar', 'Mendez', 'Mendiola', 'Molina', 'Montano',
            'Montemayor', 'Montero', 'Morales', 'Morato', 'Moreno', 'Muñoz', 'Natividad', 'Nepomuceno', 'Nicolas', 'Nieto',
            'Nolasco', 'Noriega', 'Nuñez', 'Obligacion', 'Obusan', 'Ong', 'Ongpin', 'Ordonez', 'Oreta', 'Ortega',
            'Ortiz', 'Osorio', 'Pacheco', 'Paglinawan', 'Palma', 'Palo', 'Pangan', 'Panganiban', 'Panlilio', 'Paraiso',
            'Paredes', 'Pardo', 'Pasia', 'Paterno', 'Pedrosa', 'Peña', 'Peralta', 'Perez', 'Pineda', 'Poblete',
            'Policarpio', 'Ponce', 'Porciuncula', 'Prado', 'Prieto', 'Principe', 'Prodigalidad', 'Punzalan', 'Quiambao', 'Quizon',
            'Ramirez', 'Recto', 'Resurreccion', 'Ricafort', 'Rigor', 'Robles', 'Roces', 'Rodrigo', 'Rodriguez', 'Rojas',
            'Roldan', 'Roman', 'Romero', 'Rosales', 'Roxas', 'Ruiz', 'Sabio', 'Sagun', 'Salazar', 'Salcedo',
            'Salgado', 'Salonga', 'Samson', 'San Diego', 'San Juan', 'Sanchez', 'Sandoval', 'Sarmiento', 'Serrano', 'Sierra',
            'Silva', 'Silverio', 'Simbulan', 'Simon', 'Singson', 'Sison', 'Soliman', 'Sotto', 'Suarez', 'Sy',
            'Tabios', 'Tan', 'Tanada', 'Tañada', 'Tayag', 'Tayao', 'Tiangco', 'Tiongco', 'Tiongson', 'Tobias',
            'Trinidad', 'Tuazon', 'Tupas', 'Uy', 'Valdez', 'Valenzuela', 'Vargas', 'Vasquez', 'Velasco', 'Velasquez',
            'Vera', 'Vergara', 'Vibar', 'Vicente', 'Victorino', 'Viernes', 'Villafuerte', 'Villalobos', 'Villalon', 'Villareal',
            'Villaruel', 'Villaruz', 'Villasis', 'Villena', 'Viray', 'Virtucio', 'Vitug', 'Yap', 'Yaptinchay', 'Yuchengco',
            'Zabala', 'Zamora', 'Zaragoza', 'Zubiri',
        ];

        $skillsPool = [
            ['name' => 'Basketball',        'category' => 'Sports'],
            ['name' => 'Volleyball',        'category' => 'Sports'],
            ['name' => 'Badminton',         'category' => 'Sports'],
            ['name' => 'Swimming',          'category' => 'Sports'],
            ['name' => 'Table Tennis',      'category' => 'Sports'],
            ['name' => 'Chess',             'category' => 'Sports'],
            ['name' => 'Futsal',            'category' => 'Sports'],
            ['name' => 'Track and Field',   'category' => 'Sports'],
            ['name' => 'Java',              'category' => 'Programming'],
            ['name' => 'C++',               'category' => 'Programming'],
            ['name' => 'Python',            'category' => 'Programming'],
            ['name' => 'JavaScript',        'category' => 'Programming'],
            ['name' => 'PHP',               'category' => 'Programming'],
            ['name' => 'Kotlin',            'category' => 'Programming'],
            ['name' => 'Swift',             'category' => 'Programming'],
            ['name' => 'C#',                'category' => 'Programming'],
            ['name' => 'React',             'category' => 'Web Development'],
            ['name' => 'Laravel',           'category' => 'Web Development'],
            ['name' => 'UI/UX Design',      'category' => 'Design'],
            ['name' => 'Figma',             'category' => 'Design'],
            ['name' => 'Graphic Design',    'category' => 'Design'],
            ['name' => 'MySQL',             'category' => 'Database'],
            ['name' => 'Data Analysis',     'category' => 'Data Science'],
            ['name' => 'Machine Learning',  'category' => 'Data Science'],
            ['name' => 'Networking',        'category' => 'Systems'],
            ['name' => 'Linux',             'category' => 'Systems'],
            ['name' => 'Public Speaking',   'category' => 'Communication'],
            ['name' => 'Leadership',        'category' => 'Soft Skills'],
            ['name' => 'Photography',       'category' => 'Arts'],
            ['name' => 'Video Editing',     'category' => 'Arts'],
        ];

        $studentCount       = 0;
        $targetTotal        = 1000;
        $studentsPerGroup   = (int) ceil($targetTotal / 8); // 8 groups: 4 years × 2 programs
        $studentsPerSection = 25;

        for ($year = 1; $year <= 4; $year++) {
            foreach ($programs as $program) {
                if ($studentCount >= $targetTotal) break 2;

                $groupSize    = min($studentsPerGroup, $targetTotal - $studentCount);
                $sectionCount = (int) ceil($groupSize / $studentsPerSection);

                $sections = [];
                for ($s = 0; $s < $sectionCount; $s++) {
                    $letter     = chr(65 + $s);
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
                    $slug          = strtolower(preg_replace('/\s+/', '', $lastName));
                    $email         = strtolower($firstName) . '.' . $slug . ($studentCount + 1) . '@pnc.edu.ph';

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

                    // Assign 1–3 random skills
                    $shuffled = $skillsPool;
                    shuffle($shuffled);
                    foreach (array_slice($shuffled, 0, rand(1, 3)) as $skill) {
                        StudentSkill::firstOrCreate(
                            ['student_id' => $student->id, 'skillName' => $skill['name']],
                            ['skill_category' => $skill['category']]
                        );
                    }

                    $studentCount++;
                }
            }
        }

        $this->command->info("Students seeded: {$studentCount}");
    }
}
