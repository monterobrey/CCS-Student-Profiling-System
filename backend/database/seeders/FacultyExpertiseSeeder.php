<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Faculty;

class FacultyExpertiseSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing expertise (idempotent re-seed)
        DB::table('faculty_expertise')->truncate();

        // Expertise keyed by the faculty member's login email.
        // Using email instead of hardcoded IDs makes this seeder
        // safe to run on any fresh database.
        $expertiseByEmail = [

            // ── Arcelito Quiatchon — BSIT Chair (admin account, no teaching) ──
            // No expertise needed; teaching is done via the faculty account below.

            // ── a.quiatchon — Arcelito's teaching account ──
            'a.quiatchon@pnc.edu.ph' => [
                ['skillName' => 'Java, Python, C++',                    'skill_category' => 'Programming'],
                ['skillName' => 'Object-Oriented Programming',          'skill_category' => 'Programming'],
                ['skillName' => 'Data Structures & Algorithms',         'skill_category' => 'Programming'],
                ['skillName' => 'System Analysis & Design',             'skill_category' => 'Systems'],
                ['skillName' => 'IT Project Management',                'skill_category' => 'Management'],
                ['skillName' => 'Capstone Project Management',          'skill_category' => 'Research'],
            ],

            // ── g.montecillo — Gima's teaching account ──
            'g.montecillo@pnc.edu.ph' => [
                ['skillName' => 'Information Systems',                  'skill_category' => 'Systems'],
                ['skillName' => 'System Analysis & Design',             'skill_category' => 'Systems'],
                ['skillName' => 'Research Methods',                     'skill_category' => 'Research'],
                ['skillName' => 'IT Governance',                        'skill_category' => 'Management'],
                ['skillName' => 'Technopreneurship',                    'skill_category' => 'Management'],
                ['skillName' => 'Thesis Advising',                      'skill_category' => 'Research'],
            ],

            // ── Evangelina Magaling — BSCS Chair (admin account, no teaching) ──
            // No expertise entry; she uses a separate teaching account if needed.

            // ── Luvim Eusebio — Professor ──
            'luvim.eusebio@pnc.edu.ph' => [
                ['skillName' => 'Discrete Structures',                  'skill_category' => 'Mathematics'],
                ['skillName' => 'Statistics & Probability',             'skill_category' => 'Mathematics'],
                ['skillName' => 'Quantitative Methods',                 'skill_category' => 'Mathematics'],
                ['skillName' => 'Algorithms Analysis',                  'skill_category' => 'Programming'],
                ['skillName' => 'Linear Algebra',                       'skill_category' => 'Mathematics'],
            ],

            // ── Joseph Cartagenas — Instructor I ──
            'joseph.cartagenas@pnc.edu.ph' => [
                ['skillName' => 'HTML / CSS',                           'skill_category' => 'Web Development'],
                ['skillName' => 'React, Vue.js',                        'skill_category' => 'Web Development'],
                ['skillName' => 'PHP / Laravel',                        'skill_category' => 'Web Development'],
                ['skillName' => 'REST API Design',                      'skill_category' => 'Web Development'],
                ['skillName' => 'Electronic Commerce',                  'skill_category' => 'Web Development'],
                ['skillName' => 'Server-Side Scripting',                'skill_category' => 'Web Development'],
            ],

            // ── John Patrick Ogalesco — Instructor II ──
            'johnpatrick.ogalesco@pnc.edu.ph' => [
                ['skillName' => 'Android (Java/Kotlin)',                'skill_category' => 'Mobile Development'],
                ['skillName' => 'Flutter',                              'skill_category' => 'Mobile Development'],
                ['skillName' => 'Mobile App Development',               'skill_category' => 'Mobile Development'],
                ['skillName' => 'Cross-Platform Development',           'skill_category' => 'Mobile Development'],
                ['skillName' => 'Emerging Technologies',                'skill_category' => 'Systems'],
            ],

            // ── Marvin Bicua — Instructor I ──
            'marvin.bicua@pnc.edu.ph' => [
                ['skillName' => 'MySQL / MariaDB',                      'skill_category' => 'Database'],
                ['skillName' => 'PostgreSQL',                           'skill_category' => 'Database'],
                ['skillName' => 'Database Design & Normalization',      'skill_category' => 'Database'],
                ['skillName' => 'Information Management',               'skill_category' => 'Database'],
                ['skillName' => 'Data Analytics',                       'skill_category' => 'Database'],
            ],

            // ── Janus Raymond Tan — Instructor II ──
            'janusraymond.tan@pnc.edu.ph' => [
                ['skillName' => 'TCP/IP Fundamentals',                  'skill_category' => 'Networking'],
                ['skillName' => 'Cisco Networking',                     'skill_category' => 'Networking'],
                ['skillName' => 'Network Administration',               'skill_category' => 'Networking'],
                ['skillName' => 'Network Security',                     'skill_category' => 'Security'],
                ['skillName' => 'Cloud Networking (AWS/Azure/GCP)',     'skill_category' => 'Networking'],
            ],

            // ── Fe Hablanida — Associate Professor ──
            'fe.hablanida@pnc.edu.ph' => [
                ['skillName' => 'Information Assurance & Security',     'skill_category' => 'Security'],
                ['skillName' => 'Ethical Hacking / Penetration Testing','skill_category' => 'Security'],
                ['skillName' => 'Cryptography',                         'skill_category' => 'Security'],
                ['skillName' => 'Cybersecurity Fundamentals',           'skill_category' => 'Security'],
                ['skillName' => 'Secure Software Development',          'skill_category' => 'Security'],
            ],

            // ── Christian Bana — Instructor III ──
            'christian.bana@pnc.edu.ph' => [
                ['skillName' => 'Capstone Project Management',          'skill_category' => 'Research'],
                ['skillName' => 'Thesis Advising',                      'skill_category' => 'Research'],
                ['skillName' => 'Human-Computer Interaction',           'skill_category' => 'Systems'],
                ['skillName' => 'System Integration & Architecture',    'skill_category' => 'Systems'],
                ['skillName' => 'Integrative Programming',              'skill_category' => 'Programming'],
            ],

            // ── Melissa Dimaculangan — Assistant Professor ──
            'melissa.dimaculangan@pnc.edu.ph' => [
                ['skillName' => 'Technopreneurship',                    'skill_category' => 'Management'],
                ['skillName' => 'IT Project Management',                'skill_category' => 'Management'],
                ['skillName' => 'Entrepreneurship',                     'skill_category' => 'Management'],
                ['skillName' => 'Agile / Scrum',                        'skill_category' => 'Management'],
                ['skillName' => 'Business Analysis',                    'skill_category' => 'Management'],
            ],

            // ── Miro Dela Cruz — Instructor I ──
            'miro.delacruz@pnc.edu.ph' => [
                ['skillName' => 'Java, Python, C++',                    'skill_category' => 'Programming'],
                ['skillName' => 'Data Structures & Algorithms',         'skill_category' => 'Programming'],
                ['skillName' => 'Discrete Structures',                  'skill_category' => 'Mathematics'],
                ['skillName' => 'Object-Oriented Programming',          'skill_category' => 'Programming'],
            ],

            // ── Albert Alforja — Instructor II ──
            'albert.alforja@pnc.edu.ph' => [
                ['skillName' => 'Platform Technologies',                'skill_category' => 'Systems'],
                ['skillName' => 'System Administration & Maintenance',  'skill_category' => 'Systems'],
                ['skillName' => 'IT Infrastructure',                    'skill_category' => 'Systems'],
                ['skillName' => 'Operating Systems',                    'skill_category' => 'Systems'],
                ['skillName' => 'Emerging Technologies',                'skill_category' => 'Systems'],
            ],

            // ── Renzo Evangelista — Instructor I ──
            'renzo.evangelista@pnc.edu.ph' => [
                ['skillName' => 'HTML / CSS',                           'skill_category' => 'Web Development'],
                ['skillName' => 'JavaScript / TypeScript',              'skill_category' => 'Programming'],
                ['skillName' => 'React, Vue.js',                        'skill_category' => 'Web Development'],
                ['skillName' => 'Node.js / Express',                    'skill_category' => 'Web Development'],
                ['skillName' => 'REST API Design',                      'skill_category' => 'Web Development'],
            ],
        ];

        $now    = now();
        $count  = 0;
        $missed = [];

        foreach ($expertiseByEmail as $email => $skills) {
            // Resolve faculty ID via the user's email
            $user = User::where('email', $email)->first();
            if (!$user) {
                $missed[] = $email;
                continue;
            }

            $faculty = Faculty::where('user_id', $user->id)->first();
            if (!$faculty) {
                $missed[] = $email;
                continue;
            }

            foreach ($skills as $skill) {
                DB::table('faculty_expertise')->insert([
                    'faculty_id'     => $faculty->id,
                    'skillName'      => $skill['skillName'],
                    'skill_category' => $skill['skill_category'],
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]);
                $count++;
            }
        }

        $this->command->info("Faculty expertise seeded: {$count} records.");

        if (!empty($missed)) {
            $this->command->warn('Skipped (user/faculty not found): ' . implode(', ', $missed));
        }
    }
}
