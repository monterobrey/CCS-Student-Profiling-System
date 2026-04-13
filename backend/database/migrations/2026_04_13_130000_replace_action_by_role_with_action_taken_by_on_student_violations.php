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
            if (Schema::hasColumn('student_violations', 'action_by_role')) {
                $table->dropColumn('action_by_role');
            }

            if (!Schema::hasColumn('student_violations', 'action_taken_by')) {
                $table->foreignId('action_taken_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete()
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
            if (Schema::hasColumn('student_violations', 'action_taken_by')) {
                $table->dropForeign(['action_taken_by']);
                $table->dropColumn('action_taken_by');
            }

            if (!Schema::hasColumn('student_violations', 'action_by_role')) {
                $table->enum('action_by_role', ['dean', 'department_chair'])
                    ->nullable()
                    ->after('action_taken');
            }
        });
    }
};
