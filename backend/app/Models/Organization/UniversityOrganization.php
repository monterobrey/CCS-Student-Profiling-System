<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityOrganization extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_name',
        'organization_type',
        'description',
    ];

    public function studentOrganizations(): HasMany
    {
        return $this->hasMany(StudentOrganization::class, 'org_id');
    }

    public function academicActivities(): HasMany
    {
        return $this->hasMany(AcademicActivity::class, 'org_id');
    }

    public function nonAcademicActivities(): HasMany
    {
        return $this->hasMany(NonAcademicActivity::class, 'org_id');
    }
}
