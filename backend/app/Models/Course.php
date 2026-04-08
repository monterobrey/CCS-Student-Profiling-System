<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'program_id',
        'course_code',
        'course_name',
        'year_level',
        'semester',
        'type',
        'lec_units',
        'lab_units',
        'units',
        'prerequisites',
    ];

    public function prerequisiteCourses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_prerequisites', 'course_id', 'prerequisite_course_id')->withTimestamps();
    }

    public function dependentCourses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_prerequisites', 'prerequisite_course_id', 'course_id')->withTimestamps();
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function sectionSubjects(): HasMany
    {
        return $this->hasMany(SectionSubject::class);
    }

    public function subjectInstructors(): HasMany
    {
        return $this->hasMany(SubjectInstructor::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function studentSubjects(): HasMany
    {
        return $this->hasMany(StudentSubject::class);
    }
}
