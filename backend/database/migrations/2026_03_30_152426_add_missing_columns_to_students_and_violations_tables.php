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
            if (!Schema::hasColumn('students', 'gwa')) {
                $table->float('gwa', 3, 2)->nullable()->after('address');
            }
        });

        Schema::table('student_violations', function (Blueprint $table) {
            if (!Schema::hasColumn('student_violations', 'severity')) {
                $table->enum('severity', ['Minor', 'Moderate', 'Major'])->default('Minor')->after('violationType');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('gwa');
        });

        Schema::table('student_violations', function (Blueprint $table) {
            $table->dropColumn('severity');
        });
    }
};
