<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AuthService;

class AuthController extends Controller
{
    // Service instance (injected by Laravel)
    protected $authService;

    // Laravel automatically injects AuthService here
    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    // =========================
    // LOGIN ENDPOINT
    // =========================
    public function login(Request $request)
    {
        // Validate incoming request data
        $request->validate([
            'email' => 'required|string',
            'password' => 'required',
            'role' => 'nullable|string|in:student,faculty,dean,department_chair,secretary,faculty_portal',
        ]);

        // Pass request to service layer (business logic)
        return response()->json(
            $this->authService->login($request)
        );
    }

    // =========================
    // SETUP PASSWORD (first-time login)
    // =========================
    public function setupPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        return response()->json(
            $this->authService->setupPassword($request)
        );
    }

    // =========================
    // LOGOUT USER
    // =========================
    public function logout(Request $request)
    {
        return response()->json(
            $this->authService->logout($request)
        );
    }
}