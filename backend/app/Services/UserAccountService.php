<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\SetupPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Base service for user account creation.
 * Handles common user account setup logic shared by Faculty and Students.
 */
class UserAccountService
{
    /**
     * Create a new user account with password setup token.
     * 
     * @param array $data - ['email', 'role', 'password_pattern', 'student_number' (optional)]
     * @return User
     */
    public function createUserAccount($data)
    {
        $setupToken = Str::random(60);

        $user = User::create([
            'email' => $data['email'],
            'student_number' => $data['student_number'] ?? null,
            'password' => Hash::make($data['password_pattern']),
            'role' => $data['role'],
            'password_setup_token' => $setupToken,
            'status' => 'pending',
        ]);

        // Send setup password notification
        $user->notify(new SetupPasswordNotification($setupToken));

        return $user;
    }

    /**
     * Generate initial password for faculty/student.
     */
    public function generateInitialPassword($lastName, $identifier)
    {
        // Faculty: LastNameCCS
        // Student: LastName + last 3 digits of student_number
        if (strlen($identifier) > 3) {
            return $lastName . substr(preg_replace('/[^0-9]/', '', $identifier), -3);
        }
        return $lastName . 'CCS';
    }

    /**
     * Revoke all user tokens and optionally delete the user.
     */
    public function deactivateUser($user, $softDelete = true)
    {
        // Revoke all active tokens
        $user->tokens()->delete();

        if ($softDelete) {
            $user->delete();
        }

        return true;
    }
}
