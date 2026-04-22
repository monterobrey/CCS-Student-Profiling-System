<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\User;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class FacultySeeder extends Seeder
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

        $instructors = [
            // first, last, email, position, program_code (null = no program assignment)
            ['first' => 'Arcelito', 'last' => 'Quiatchon',      'email' => 'arcelito.quiatchon@pnc.edu.ph',      'pos' => 'Department Chair',  'program' => 'BSIT'],
            ['first' => 'Gima',     'last' => 'Montecillo',     'email' => 'gima.montecillo@pnc.edu.ph',         'pos' => 'Dean',              'program' => null],
            ['first' => 'Luvim',    'last' => 'Eusebio',        'email' => 'luvim.eusebio@pnc.edu.ph',          'pos' => 'Professor',         'program' => null],
            ['first' => 'Gia Mae',  'last' => 'Gaviola',        'email' => 'giamae.gaviola@pnc.edu.ph',         'pos' => 'Secretary',         'program' => null],
            ['first' => 'Evangelina','last' => 'Magaling',      'email' => 'evangelina.magaling@pnc.edu.ph',    'pos' => 'Department Chair',  'program' => 'BSCS'],
            ['first' => 'Joseph',   'last' => 'Cartagenas',     'email' => 'joseph.cartagenas@pnc.edu.ph',      'pos' => 'Instructor I',      'program' => null],
            ['first' => 'John Patrick','last' => 'Ogalesco',    'email' => 'johnpatrick.ogalesco@pnc.edu.ph',   'pos' => 'Instructor II',     'program' => null],
            ['first' => 'Marvin',   'last' => 'Bicua',          'email' => 'marvin.bicua@pnc.edu.ph',           'pos' => 'Instructor I',      'program' => null],
            ['first' => 'Janus Raymond','last' => 'Tan',        'email' => 'janusraymond.tan@pnc.edu.ph',       'pos' => 'Instructor II',     'program' => null],
            ['first' => 'Fe',       'last' => 'Hablanida',      'email' => 'fe.hablanida@pnc.edu.ph',           'pos' => 'Associate Professor','program' => null],
            ['first' => 'Christian','last' => 'Bana',           'email' => 'christian.bana@pnc.edu.ph',         'pos' => 'Instructor III',    'program' => null],
            ['first' => 'Melissa',  'last' => 'Dimaculangan',   'email' => 'melissa.dimaculangan@pnc.edu.ph',   'pos' => 'Assistant Professor','program' => null],
            ['first' => 'Miro',     'last' => 'Dela Cruz',      'email' => 'miro.delacruz@pnc.edu.ph',          'pos' => 'Instructor I',      'program' => null],
            ['first' => 'Albert',   'last' => 'Alforja',        'email' => 'albert.alforja@pnc.edu.ph',         'pos' => 'Instructor II',     'program' => null],
            ['first' => 'Renzo',    'last' => 'Evangelista',    'email' => 'renzo.evangelista@pnc.edu.ph',      'pos' => 'Instructor I',      'program' => null],
        ];

        $programMap = [
            'BSIT' => $bsit->id,
            'BSCS' => $bscs->id,
        ];

        foreach ($instructors as $ins) {
            // Determine role based on email
            $role = 'faculty'; // default role
            
            if ($ins['email'] === 'arcelito.quiatchon@pnc.edu.ph' || $ins['email'] === 'evangelina.magaling@pnc.edu.ph') {
                $role = 'department_chair';
            } elseif ($ins['email'] === 'gima.montecillo@pnc.edu.ph') {
                $role = 'dean';
            } elseif ($ins['email'] === 'giamae.gaviola@pnc.edu.ph') {
                $role = 'secretary';
            }
            
            $user = User::firstOrCreate(
                ['email' => $ins['email']],
                [
                    'password'        => Hash::make('password'),
                    'role'            => $role,
                    'status'          => 'active',
                    'password_set_at' => now(),
                ]
            );

            Faculty::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id'  => $department->id,
                    'program_id'     => $ins['program'] ? ($programMap[$ins['program']] ?? null) : null,
                    'first_name'     => $ins['first'],
                    'last_name'      => $ins['last'],
                    'position'       => $ins['pos'],
                    'gender'         => rand(0, 1) ? 'Male' : 'Female',
                    'civil_status'   => 'Single',
                    'contact_number' => '09' . rand(100000000, 999999999),
                    'address'        => 'Cabuyao, Laguna',
                ]
            );
        }
    }
}
