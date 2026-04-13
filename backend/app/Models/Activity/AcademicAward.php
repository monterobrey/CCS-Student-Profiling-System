<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicAward extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'faculty_id',
        'awardName',
        'description',
        'date_received',
        'issued_by',
        'applied_by',
        'recommended_by',
        'approved_by',
        'status',
        'approved_at',
        'action_taken',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function recommender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recommended_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
