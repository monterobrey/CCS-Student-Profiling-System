<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_name',
    ];

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function faculty(): HasMany
    {
        return $this->hasMany(Faculty::class);
    }
}