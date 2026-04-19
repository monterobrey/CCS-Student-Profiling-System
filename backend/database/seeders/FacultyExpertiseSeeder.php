<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FacultyExpertiseSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing expertise first (idempotent)
        DB::table('faculty_expertise')->truncate();

        $expertise = [
            // ID 1 — Maria Santos (College Dean)
            // Broad academic background: systems, research, management
            1 => [
                ['skillName' => 'Information Systems',       'skill_category' => 'Systems'],
                ['skillName' => 'Research Methods',          'skill_category' => 'Research'],
                ['skillName' => 'IT Governance',             'skill_category' => 'Management'],
                ['skillName' => 'System Analysis and Design','skill_category' => 'Systems'],
            ],

            // ID 2 — Roberto Dela Cruz (Department Chair)
            // Networking & security focus
            2 => [
                ['skillName' => 'TCP/IP, Cisco Networking',  'skill_category' => 'Networking'],
                ['skillName' => 'Network Security',          'skill_category' => 'Security'],
                ['skillName' => 'System Administration',     'skill_category' => 'Systems'],
                ['skillName' => 'Information Assurance',     'skill_category' => 'Security'],
            ],

            // ID 3 — Clarisse Villanueva (College Secretary)
            // GE / soft skills / ethics
            3 => [
                ['skillName' => 'Technical Writing',         'skill_category' => 'General Education'],
                ['skillName' => 'Professional Ethics',       'skill_category' => 'General Education'],
                ['skillName' => 'Gender and Development',    'skill_category' => 'General Education'],
                ['skillName' => 'Purposive Communication',   'skill_category' => 'General Education'],
            ],

            // ID 4 — Mateo Delos Reyes (Department Chair)
            // Programming & software engineering
            4 => [
                ['skillName' => 'Java, Python, C++',         'skill_category' => 'Programming'],
                ['skillName' => 'Object-Oriented Programming','skill_category' => 'Programming'],
                ['skillName' => 'Data Structures and Algorithms','skill_category' => 'Programming'],
                ['skillName' => 'Software Engineering',      'skill_category' => 'Systems'],
            ],

            // ID 5 — Aria Villanueva (Associate Professor)
            // Database & information management (already has 1 entry, we replace all)
            5 => [
                ['skillName' => 'SQL, PostgreSQL, MySQL',    'skill_category' => 'Database'],
                ['skillName' => 'Information Management',    'skill_category' => 'Database'],
                ['skillName' => 'Data Analytics',            'skill_category' => 'Database'],
                ['skillName' => 'Quantitative Methods',      'skill_category' => 'Mathematics'],
            ],

            // ID 6 — Nathaniel Pascual (Instructor I)
            // Web development
            6 => [
                ['skillName' => 'HTML, CSS, JavaScript',     'skill_category' => 'Web Development'],
                ['skillName' => 'React, Vue.js',             'skill_category' => 'Web Development'],
                ['skillName' => 'PHP, Laravel',              'skill_category' => 'Web Development'],
                ['skillName' => 'Electronic Commerce',       'skill_category' => 'Web Development'],
            ],

            // ID 7 — Sofia Mendoza (Instructor II)
            // Mobile & emerging technologies
            7 => [
                ['skillName' => 'Android, Flutter',          'skill_category' => 'Mobile Development'],
                ['skillName' => 'Mobile Application Development','skill_category' => 'Mobile Development'],
                ['skillName' => 'Emerging Technologies',     'skill_category' => 'Systems'],
                ['skillName' => 'Platform Technologies',     'skill_category' => 'Systems'],
            ],

            // ID 8 — Gabriel Santiago (Professor)
            // Mathematics & discrete structures
            8 => [
                ['skillName' => 'Discrete Mathematics',      'skill_category' => 'Mathematics'],
                ['skillName' => 'Statistics, Probability',   'skill_category' => 'Mathematics'],
                ['skillName' => 'Quantitative Methods',      'skill_category' => 'Mathematics'],
                ['skillName' => 'Algorithms Analysis',       'skill_category' => 'Programming'],
            ],

            // ID 9 — Chloe Dela Cruz (Instructor III)
            // Capstone / integrative / HCI
            9 => [
                ['skillName' => 'Capstone Project Management','skill_category' => 'Research'],
                ['skillName' => 'Human Computer Interaction', 'skill_category' => 'Systems'],
                ['skillName' => 'System Integration',        'skill_category' => 'Systems'],
                ['skillName' => 'Integrative Programming',   'skill_category' => 'Programming'],
            ],

            // ID 10 — Liam Salvador (Department Head)
            // Entrepreneurship & professional issues
            10 => [
                ['skillName' => 'Technopreneurship',         'skill_category' => 'Management'],
                ['skillName' => 'Entrepreneurship',          'skill_category' => 'Management'],
                ['skillName' => 'Social and Professional Issues','skill_category' => 'General Education'],
                ['skillName' => 'IT Project Management',     'skill_category' => 'Management'],
            ],

            // ID 11 — ni ni (Instructor) — placeholder faculty, give generic programming
            11 => [
                ['skillName' => 'Computer Programming',      'skill_category' => 'Programming'],
                ['skillName' => 'Introduction to Computing', 'skill_category' => 'Programming'],
            ],
        ];

        $now = now();
        foreach ($expertise as $facultyId => $skills) {
            foreach ($skills as $skill) {
                DB::table('faculty_expertise')->insert([
                    'faculty_id'     => $facultyId,
                    'skillName'      => $skill['skillName'],
                    'skill_category' => $skill['skill_category'],
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]);
            }
        }

        $this->command->info('Faculty expertise seeded: ' . DB::table('faculty_expertise')->count() . ' records.');
    }
}
