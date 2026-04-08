<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;

use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'student_number',
        'password',
        'role',
        'email_verified_at',
        'password_setup_token',
        'password_set_at',
        'status',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['name'];

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function faculty(): HasOne
    {
        return $this->hasOne(Faculty::class);
    }

    public function isDean(): bool
    {
        return $this->role === 'dean';
    }

    public function isDepartmentChair(): bool
    {
        return $this->role === 'department_chair';
    }

    public function isSecretary(): bool
    {
        return $this->role === 'secretary';
    }

    public function isFaculty(): bool
    {
        return $this->role === 'faculty';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isFacultyMember(): bool
    {
        return in_array($this->role, ['faculty', 'dean', 'department_chair', 'secretary']);
    }

    public function getNameAttribute()
    {
        if ($this->isStudent() && $this->student) {
            return $this->student->first_name . ' ' . $this->student->last_name;
        }
        if ($this->isFacultyMember() && $this->faculty) {
            return $this->faculty->first_name . ' ' . $this->faculty->last_name;
        }
        return $this->email;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
