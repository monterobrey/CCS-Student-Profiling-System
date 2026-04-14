<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('university_organizations', function (Blueprint $table) {
            $table->id();
            $table->string('organization_name');
            $table->string('organization_type');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('student_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('course_id')->constrained('courses')->onDelete('restrict');
            $table->foreignId('section_id')->constrained('sections')->onDelete('restrict');
            $table->string('status');
            $table->float('prelimGrade')->nullable();
            $table->float('midtermGrade')->nullable();
            $table->float('finalGrade')->nullable();
            $table->float('finalRating')->nullable();
            $table->timestamps();
        });

        Schema::create('section_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('sections')->onDelete('restrict');
            $table->foreignId('course_id')->constrained('courses')->onDelete('restrict');
            $table->timestamps();
        });

        Schema::create('section_adviser', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('sections')->onDelete('restrict');
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('restrict');
            $table->timestamps();
        });

        Schema::create('subject_instructor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('restrict');
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('restrict');
            $table->timestamps();
        });

        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('restrict');
            $table->foreignId('faculty_id')->nullable()->constrained('faculty')->onDelete('restrict');
            $table->foreignId('section_id')->constrained('sections')->onDelete('restrict');
            $table->enum('class_type', ['lec', 'lab'])->default('lec');
            $table->enum('dayOfWeek', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
            $table->time('startTime');
            $table->time('endTime');
            $table->string('room')->nullable();
            $table->timestamps();
        });

        Schema::create('student_violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('restrict');
            $table->string('violationType');
            $table->text('description');
            $table->date('dateReported');
            $table->string('status');
            $table->string('action_taken')->nullable();
            $table->timestamps();
        });

        Schema::create('academic_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('org_id')->nullable()->constrained('university_organizations')->onDelete('restrict');
            $table->string('activity_name');
            $table->text('description');
            $table->date('date');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            
            $table->index(['student_id', 'status']);
        });

        Schema::create('non_academic_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('org_id')->nullable()->constrained('university_organizations')->onDelete('restrict');
            $table->string('activity_name');
            $table->text('description');
            $table->date('date');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            
            $table->index(['student_id', 'status']);
        });

        Schema::create('student_organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('org_id')->constrained('university_organizations')->onDelete('restrict');
            $table->string('role');
            $table->date('dateJoined');
            $table->date('dateLeft')->nullable();
            $table->timestamps();
            
            $table->index(['student_id', 'org_id']);
        });

        Schema::create('faculty_expertise', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('restrict');
            $table->string('skillName');
            $table->string('skill_category');
            $table->timestamps();
        });

        Schema::create('faculty_organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('restrict');
            $table->date('dateFacilitated');
            $table->timestamps();
        });

        Schema::create('academic_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('restrict');
            $table->string('awardName');
            $table->text('description');
            $table->date('date_received');
            $table->string('issued_by');
            $table->boolean('applied_by')->default(false);
            $table->foreignId('recommended_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index(['student_id', 'status']);
        });

        Schema::create('curriculum', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->foreignId('course_id')->constrained('courses')->onDelete('restrict');
            $table->string('year_level');
            $table->string('semester');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curriculum');
        Schema::dropIfExists('academic_awards');
        Schema::dropIfExists('faculty_organizations');
        Schema::dropIfExists('faculty_expertise');
        Schema::dropIfExists('student_organizations');
        Schema::dropIfExists('non_academic_activities');
        Schema::dropIfExists('academic_activities');
        Schema::dropIfExists('student_violations');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('subject_instructor');
        Schema::dropIfExists('section_adviser');
        Schema::dropIfExists('section_subjects');
        Schema::dropIfExists('student_subjects');
        Schema::dropIfExists('university_organizations');
    }
};
