<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSkill extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'skillName',
        'skill_category',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
