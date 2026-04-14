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
            $table->unsignedBigInteger('archived_by')->nullable()->after('deleted_at');
            $table->foreign('archived_by')->references('id')->on('users')->onDelete('set null');
        });

        Schema::table('faculty', function (Blueprint $table) {
            $table->unsignedBigInteger('archived_by')->nullable()->after('deleted_at');
            $table->foreign('archived_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['archived_by']);
            $table->dropColumn('archived_by');
        });

        Schema::table('faculty', function (Blueprint $table) {
            $table->dropForeign(['archived_by']);
            $table->dropColumn('archived_by');
        });
    }
};
