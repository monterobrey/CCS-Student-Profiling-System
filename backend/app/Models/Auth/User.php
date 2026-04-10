<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | ROLE CONSTANTS
    |--------------------------------------------------------------------------
    | These define the possible roles in your system.
    | Instead of typing strings like 'dean' everywhere,
    | you use these constants for consistency and safety.
    */
    public const ROLE_STUDENT = 'student';
    public const ROLE_FACULTY = 'faculty';
    public const ROLE_DEAN = 'dean';
    public const ROLE_CHAIR = 'department_chair';
    public const ROLE_SECRETARY = 'secretary';

    /*
    |--------------------------------------------------------------------------
    | GROUPED ROLES
    |--------------------------------------------------------------------------
    | This groups roles that belong to the "faculty side".
    | Useful for checking permissions like accessing faculty portal.
    */
    public const FACULTY_ROLES = [
        self::ROLE_FACULTY,
        self::ROLE_DEAN,
        self::ROLE_CHAIR,
        self::ROLE_SECRETARY,
    ];

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNABLE FIELDS
    |--------------------------------------------------------------------------
    | These are the fields allowed to be inserted/updated using
    | methods like User::create() or $user->update().
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

    /*
    |--------------------------------------------------------------------------
    | APPENDED ATTRIBUTES
    |--------------------------------------------------------------------------
    | This tells Laravel to include "name" automatically when
    | the model is converted to JSON (e.g., API response).
    */
    protected $appends = ['name'];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    | These define how the user connects to other tables.
    | A user can either have a student profile OR faculty profile.
    */

    public function student(): HasOne
    {
        // Links user to the student table (1-to-1)
        return $this->hasOne(Student::class);
    }

    public function faculty(): HasOne
    {
        // Links user to the faculty table (1-to-1)
        return $this->hasOne(Faculty::class);
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE CHECKING METHODS
    |--------------------------------------------------------------------------
    | These helper methods make it easy to check user roles
    | anywhere in your system (controller, service, middleware).
    */

    public function isStudent(): bool
    {
        // Returns true if the user is a student
        return $this->role === self::ROLE_STUDENT;
    }

    public function isFaculty(): bool
    {
        return $this->role === self::ROLE_FACULTY;
    }

    public function isDean(): bool
    {
        return $this->role === self::ROLE_DEAN;
    }

    public function isDepartmentChair(): bool
    {
        return $this->role === self::ROLE_CHAIR;
    }

    public function isSecretary(): bool
    {
        return $this->role === self::ROLE_SECRETARY;
    }

    public function isFacultyMember(): bool
    {
        // Checks if the user belongs to any faculty-related role
        return in_array($this->role, self::FACULTY_ROLES);
    }

    public function canAccessFacultyPortal(): bool
    {
        // Used specifically for login/authorization
        // Returns true if user is allowed in faculty portal
        return $this->isFacultyMember();
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSOR: NAME
    |--------------------------------------------------------------------------
    | This dynamically creates a "name" attribute.
    | It decides where to get the name based on the user's role.
    */
    public function getNameAttribute()
    {
        // If student, get name from student profile
        if ($this->isStudent() && $this->student) {
            return trim(
                $this->student->first_name . ' ' . $this->student->last_name
            );
        }

        // If faculty-related, get name from faculty profile
        if ($this->isFacultyMember() && $this->faculty) {
            return trim(
                $this->faculty->first_name . ' ' . $this->faculty->last_name
            );
        }

        // Fallback if no profile exists
        return $this->email;
    }

    /*
    |--------------------------------------------------------------------------
    | HIDDEN ATTRIBUTES
    |--------------------------------------------------------------------------
    | These fields will NOT be included in API responses.
    | Important for security (e.g., password).
    */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTING
    |--------------------------------------------------------------------------
    | Automatically converts fields into proper data types.
    | Example:
    | - email_verified_at → becomes a DateTime object
    | - password → automatically hashed when set
    */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}