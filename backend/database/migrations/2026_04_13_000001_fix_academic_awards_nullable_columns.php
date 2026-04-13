<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_awards', function (Blueprint $table) {
            // faculty_id nullable — Dean/Secretary are not faculty members
            $table->foreignId('faculty_id')->nullable()->change();

            // recommended_by nullable — student self-applications have no recommender
            $table->foreignId('recommended_by')->nullable()->change();

            // action_taken — stores rejection reason or admin remarks
            $table->text('action_taken')->nullable()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('academic_awards', function (Blueprint $table) {
            $table->dropColumn('action_taken');
            $table->foreignId('faculty_id')->nullable(false)->change();
            $table->foreignId('recommended_by')->nullable(false)->change();
        });
    }
};
