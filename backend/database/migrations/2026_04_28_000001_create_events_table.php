<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('date');
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->string('location')->nullable();
                $table->enum('type', ['event', 'activity', 'meeting'])->default('event');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
