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
            if (!Schema::hasColumn('student_violations', 'action_by_role')) {
                $table->enum('action_by_role', ['dean', 'department_chair'])
                    ->nullable()
                    ->after('action_taken');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_violations', function (Blueprint $table) {
            if (Schema::hasColumn('student_violations', 'action_by_role')) {
                $table->dropColumn('action_by_role');
            }
        });
    }
};
