<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentOrganization extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'org_id',
        'role',
        'dateJoined',
        'dateLeft',
    ];

    protected $appends = ['is_default'];

    public function getIsDefaultAttribute(): bool
    {
        $defaultNames = [
            'Society of Information Technology Students',
            'Association of Computer Science Students',
        ];
        return in_array($this->organization?->organization_name, $defaultNames, true);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(UniversityOrganization::class, 'org_id');
    }
}
