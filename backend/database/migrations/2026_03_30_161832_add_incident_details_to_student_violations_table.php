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
        Schema::table('student_violations', function (Blueprint $table) {
            $table->time('incident_time')->nullable()->after('dateReported');
            $table->string('location')->nullable()->after('incident_time');
            $table->foreignId('course_id')->nullable()->constrained('courses')->onDelete('set null')->after('location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_violations', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn(['incident_time', 'location', 'course_id']);
        });
    }
};
