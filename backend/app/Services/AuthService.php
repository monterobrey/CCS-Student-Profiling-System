<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthService
{
    // =========================
    // LOGIN LOGIC
    // =========================
    public function login($request)
    {
        // Step 1: Find user in database
        $user = $this->findUser($request);

        // Step 2: Check password
        if (! $this->validateCredentials($user, $request)) {
            return ['message' => 'Invalid credentials', 'status' => 401];
        }

        // Step 3: Check role access
        if (! $this->validateRole($user, $request->role)) {
            return ['message' => 'Invalid credentials', 'status' => 401];
        }

        // Step 4: Check if account still needs setup
        if ($this->requiresSetup($user)) {
            return ['message' => 'Account setup required', 'status' => 403];
        }

        // Step 5: Generate API token (Sanctum)
        return [
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $this->loadUserRelations($user),
            'status' => 200
        ];
    }

    // =========================
    // PASSWORD SETUP (first login)
    // =========================
    public function setupPassword($request)
    {
        // Find user using email + token (security check)
        $user = User::where('email', $request->email)
            ->where('password_setup_token', $request->token)
            ->first();

        if (!$user) {
            return ['message' => 'Invalid setup link', 'status' => 400];
        }

        // Transaction = ensures all DB updates succeed or fail together
        DB::transaction(function () use ($request, $user) {
            $user->update([
                'password' => Hash::make($request->password),
                'password_set_at' => now(),
                'password_setup_token' => null,
                'status' => 'active',
            ]);
        });

        return ['message' => 'Account setup successful', 'status' => 200];
    }

    // =========================
    // LOGOUT
    // =========================
    public function logout($request)
    {
        // Delete current API token
        $request->user()->currentAccessToken()->delete();

        return ['message' => 'Logged out successfully', 'status' => 200];
    }

    // ==================================================
    // 🔽 PRIVATE HELPER METHODS (internal logic only)
    // ==================================================

    // Find user depending on login type
    private function findUser($request)
    {
        $query = User::query();

        // Students log in using student_number
        if ($request->role === 'student') {
            $query->where('student_number', $request->email);
        } else {
            // Faculty/admin can use email OR student_number
            $query->where(function($q) use ($request) {
                $q->where('email', $request->email)
                  ->orWhere('student_number', $request->email);
            });
        }

        return $query->first();
    }

    // Check password match
    private function validateCredentials($user, $request)
    {
        return $user && Hash::check($request->password, $user->password);
    }

    // Check if user role is allowed
    private function validateRole($user, $role)
    {
        if (!$role) return true;

        $exactRoles = ['faculty', 'dean', 'department_chair', 'secretary'];

        if ($role === 'student') {
            return $user->role === 'student';
        }

        if (in_array($role, $exactRoles, true)) {
            return $user->role === $role;
        }

        if ($role === 'faculty_portal') {
            return in_array($user->role, [
                'faculty',
                'dean',
                'department_chair',
                'secretary'
            ], true);
        }

        return false;
    }

    // Check if user must setup password first
    private function requiresSetup($user)
    {
        return in_array($user->role, ['student', 'faculty']) &&
               is_null($user->password_set_at) &&
               $user->password_setup_token;
    }

    // Load relationships based on role
    private function loadUserRelations($user)
    {
        return $user->load(
            $user->role === 'student'
                ? 'student'
                : ($user->isFacultyMember() ? 'faculty' : [])
        );
    }
}