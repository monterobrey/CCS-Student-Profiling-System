<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\User;
use App\Models\Faculty;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class FacultySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $department = Department::firstOrCreate(['department_name' => 'College of Computing Studies']);

        $instructors = [
            ['first' => 'Mateo', 'last' => 'Delos Reyes', 'email' => 'mateo.delosreyes@pnc.edu.ph', 'pos' => 'Assistant Professor'],
            ['first' => 'Aria', 'last' => 'Villanueva', 'email' => 'aria.villanueva@pnc.edu.ph', 'pos' => 'Associate Professor'],
            ['first' => 'Nathaniel', 'last' => 'Pascual', 'email' => 'nathaniel.pascual@pnc.edu.ph', 'pos' => 'Instructor I'],
            ['first' => 'Sofia', 'last' => 'Mendoza', 'email' => 'sofia.mendoza@pnc.edu.ph', 'pos' => 'Instructor II'],
            ['first' => 'Gabriel', 'last' => 'Santiago', 'email' => 'gabriel.santiago@pnc.edu.ph', 'pos' => 'Professor'],
            ['first' => 'Chloe', 'last' => 'Dela Cruz', 'email' => 'chloe.delacruz@pnc.edu.ph', 'pos' => 'Instructor III'],
            ['first' => 'Liam', 'last' => 'Salvador', 'email' => 'liam.salvador@pnc.edu.ph', 'pos' => 'Department Head'],
        ];

        foreach ($instructors as $ins) {
            $user = User::create([
                'email' => $ins['email'],
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'status' => 'active',
                'password_set_at' => now(),
            ]);

            Faculty::create([
                'user_id' => $user->id,
                'department_id' => $department->id,
                'first_name' => $ins['first'],
                'last_name' => $ins['last'],
                'position' => $ins['pos'],
                'gender' => rand(0, 1) ? 'Male' : 'Female',
                'civil_status' => 'Single',
                'contact_number' => '09' . rand(100000000, 999999999),
                'address' => 'Cabuyao, Laguna',
            ]);
        }
    }
}
