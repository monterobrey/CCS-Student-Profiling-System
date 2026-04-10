<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\SoftDeletes;

class Faculty extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'faculty';

    protected $fillable = [
        'user_id',
        'title',
        'department_id',
        'first_name',
        'last_name',
        'middle_name',
        'position',
        'birthDate',
        'contact_number',
        'civil_status',
        'gender',
        'address',
        'archived_by',
    ];

    public function archiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function advisingSections(): HasMany
    {
        return $this->hasMany(SectionAdviser::class);
    }

    public function subjectInstructors(): HasMany
    {
        return $this->hasMany(SubjectInstructor::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function violationsReported(): HasMany
    {
        return $this->hasMany(StudentViolation::class);
    }

    public function expertise(): HasMany
    {
        return $this->hasMany(FacultyExpertise::class);
    }

    public function organizations(): HasMany
    {
        return $this->hasMany(FacultyOrganization::class);
    }

    public function awardsRecommended(): HasMany
    {
        return $this->hasMany(AcademicAward::class);
    }
}
