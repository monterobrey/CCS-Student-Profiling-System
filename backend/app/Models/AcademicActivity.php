<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'org_id',
        'activity_name',
        'description',
        'date',
        'verified_by',
        'status',
        'verified_at',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(UniversityOrganization::class, 'org_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
