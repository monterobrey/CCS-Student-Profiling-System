<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     * Keeps only the essential structural data and administrative accounts.
     */
    public function run(): void
    {
        // 1. Create Essential Department
        $dept = \App\Models\Department::firstOrCreate(['department_name' => 'College of Computing Studies']);

        // 2. Create Essential Programs
        \App\Models\Program::firstOrCreate([
            'program_code' => 'BSIT'
        ], [
            'department_id' => $dept->id,
            'program_name' => 'Bachelor of Science in Information Technology'
        ]);

        \App\Models\Program::firstOrCreate([
            'program_code' => 'BSCS'
        ], [
            'department_id' => $dept->id,
            'program_name' => 'Bachelor of Science in Computer Science'
        ]);

        \App\Models\Program::firstOrCreate([
            'program_code' => 'BSIS'
        ], [
            'department_id' => $dept->id,
            'program_name' => 'Bachelor of Science in Information Systems'
        ]);

        // 3. Create Essential Sections (A, B, C, D) for each program and year level
        $programs = \App\Models\Program::all();
        $yearLevels = ['1', '2', '3', '4'];
        $sections = ['A', 'B', 'C', 'D'];

        foreach ($programs as $program) {
            foreach ($yearLevels as $year) {
                foreach ($sections as $letter) {
                    \App\Models\Section::firstOrCreate([
                        'program_id' => $program->id,
                        'year_level' => $year,
                        'section_name' => "{$program->program_code} {$year}-{$letter}",
                    ], [
                        'department_id' => $dept->id,
                        'school_year' => date('Y') . '-' . (date('Y') + 1),
                    ]);
                }
            }
        }

        // 4. Create Essential Administrative Accounts (So you can still log in)
        
        // Dean
        $deanUser = User::firstOrCreate([
            'email' => 'dean@example.com'
        ], [
            'password' => bcrypt('password'),
            'role' => 'dean',
            'status' => 'active',
            'password_set_at' => now(),
        ]);

        \App\Models\Faculty::firstOrCreate([
            'user_id' => $deanUser->id
        ], [
            'title' => 'Dr.',
            'department_id' => $dept->id,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'position' => 'College Dean',
        ]);

        // Department Chair
        $chairUser = User::firstOrCreate([
            'email' => 'chair@example.com'
        ], [
            'password' => bcrypt('password'),
            'role' => 'department_chair',
            'status' => 'active',
            'password_set_at' => now(),
        ]);

        \App\Models\Faculty::firstOrCreate([
            'user_id' => $chairUser->id
        ], [
            'title' => 'Engr.',
            'department_id' => $dept->id,
            'first_name' => 'Roberto',
            'last_name' => 'Dela Cruz',
            'position' => 'Department Chair',
        ]);

        // Secretary
        $secUser = User::firstOrCreate([
            'email' => 'secretary@example.com'
        ], [
            'password' => bcrypt('password'),
            'role' => 'secretary',
            'status' => 'active',
            'password_set_at' => now(),
        ]);

        \App\Models\Faculty::firstOrCreate([
            'user_id' => $secUser->id
        ], [
            'title' => 'Ms.',
            'department_id' => $dept->id,
            'first_name' => 'Clarisse',
            'last_name' => 'Villanueva',
            'position' => 'College Secretary',
        ]);

        // 4. Run additional seeders
        $this->call([
            FacultySeeder::class,
            StudentSeeder::class,
        ]);
    }
}
