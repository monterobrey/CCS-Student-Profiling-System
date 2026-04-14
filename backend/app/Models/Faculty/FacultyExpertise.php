<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyExpertise extends Model
{
    use HasFactory;

    protected $table = 'faculty_expertise';

    protected $fillable = [
        'faculty_id',
        'skillName',
        'skill_category',
    ];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
