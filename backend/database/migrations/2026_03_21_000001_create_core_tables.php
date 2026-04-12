<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('student_number')->nullable()->unique();
            $table->string('password');
            $table->enum('role', ['dean', 'department_chair', 'secretary', 'faculty', 'student']);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->string('password_setup_token')->nullable();
            $table->timestamp('password_set_at')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('department_name');
            $table->timestamps();
        });

        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->string('program_code');
            $table->string('program_name');
            $table->timestamps();
        });

        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->string('section_name');
            $table->string('year_level');
            $table->string('school_year');
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->string('course_code');
            $table->string('course_name');
            $table->string('year_level');
            $table->string('semester');
            $table->enum('type', ['lec', 'lab', 'lec+lab'])->default('lec');
            $table->integer('units');
            $table->string('prerequisites')->nullable();
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->foreignId('section_id')->constrained('sections')->onDelete('restrict');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('gender')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('address')->nullable();
            $table->timestamps();
            
            $table->index(['section_id', 'program_id']);
        });

        Schema::create('faculty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('position');
            $table->string('birthDate')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('gender')->nullable();
            $table->string('address')->nullable();
            $table->timestamps();
        });

        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('contact_number')->nullable();
            $table->string('relationship')->nullable();
            $table->timestamps();
        });

        Schema::create('student_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->string('skillName');
            $table->string('skill_category');
            $table->timestamps();
            
            $table->index(['skill_category', 'student_id']);
        });

        // ─── INITIAL DATA SEEDING (FOR DROPDOWNS) ───────────────────────────
        
        // 1. Create Default Department
        $deptId = DB::table('departments')->insertGetId([
            'department_name' => 'College of Computing Studies',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Create Default Programs
        $programs = [
            ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology'],
            ['code' => 'BSCS', 'name' => 'Bachelor of Science in Computer Science'],
            ['code' => 'BSIS', 'name' => 'Bachelor of Science in Information Systems'],
        ];

        foreach ($programs as $p) {
            $progId = DB::table('programs')->insertGetId([
                'department_id' => $deptId,
                'program_code' => $p['code'],
                'program_name' => $p['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Create Sections A, B, C, D for each Year Level (1-4)
            for ($year = 1; $year <= 4; $year++) {
                foreach (['A', 'B', 'C', 'D'] as $letter) {
                    DB::table('sections')->insert([
                        'department_id' => $deptId,
                        'program_id' => $progId,
                        'year_level' => (string)$year,
                        'section_name' => "{$p['code']} {$year}-{$letter}",
                        'school_year' => date('Y') . '-' . (date('Y') + 1),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_skills');
        Schema::dropIfExists('guardians');
        Schema::dropIfExists('faculty');
        Schema::dropIfExists('students');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('sections');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
