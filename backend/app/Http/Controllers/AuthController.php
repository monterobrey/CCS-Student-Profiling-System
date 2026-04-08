<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required',
            'role' => 'nullable|string|in:student,faculty,dean,department_chair,secretary,faculty_portal',
        ]);

        $query = User::query();

        if ($request->role === 'student') {
            $query->where('student_number', $request->email);
        } else {
            $query->where(function($q) use ($request) {
                $q->where('email', $request->email)
                  ->orWhere('student_number', $request->email);
            });
        }

        $user = $query->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Enforce role restriction if provided
        if ($request->filled('role')) {
            if ($request->role === 'student') {
                if ($user->role !== 'student') {
                    return response()->json(['message' => 'Invalid credentials'], 401);
                }
            } elseif ($request->role === 'faculty_portal') {
                // Allow faculty, dean, department_chair, and secretary for the faculty portal
                $allowedFacultyRoles = ['faculty', 'dean', 'department_chair', 'secretary'];
                if (!in_array($user->role, $allowedFacultyRoles)) {
                    return response()->json(['message' => 'Invalid credentials'], 401);
                }
            }
        }

        // Check if student/faculty has set their password (if required by the setup flow)
        if (in_array($user->role, ['student', 'faculty']) && is_null($user->password_set_at) && $user->password_setup_token) {
            return response()->json(['message' => 'Account setup required'], 403);
        }

        return response()->json([
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user->load($user->role === 'student' ? 'student' : ($user->isFacultyMember() ? 'faculty' : [])),
        ]);
    }

    public function setupPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)
            ->where('password_setup_token', $request->token)
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid setup link'], 400);
        }

        DB::transaction(function () use ($request, $user) {
            $user->update([
                'password' => Hash::make($request->password),
                'password_set_at' => now(),
                'password_setup_token' => null,
                'status' => 'active',
            ]);
        });

        return response()->json(['message' => 'Account setup successful']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
