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
        Schema::table('students', function (Blueprint $table) {
            $table->string('year_level')->nullable()->after('section_id');
        });

        // Populate existing data
        DB::statement("UPDATE students s JOIN sections sec ON s.section_id = sec.id SET s.year_level = sec.year_level");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('year_level');
        });
    }
};
