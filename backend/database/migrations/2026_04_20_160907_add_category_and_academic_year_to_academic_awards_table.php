<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_awards', function (Blueprint $table) {
            $table->string('category')->nullable()->after('awardName');
            $table->string('academic_year')->nullable()->after('date_received');
        });
    }

    public function down(): void
    {
        Schema::table('academic_awards', function (Blueprint $table) {
            $table->dropColumn(['category', 'academic_year']);
        });
    }
};
