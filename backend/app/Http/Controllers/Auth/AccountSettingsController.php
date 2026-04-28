<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AccountSettingsController extends Controller
{
    /**
     * Update the authenticated user's email address.
     */
    public function updateEmail(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'email'    => 'required|email|unique:users,email,' . $user->id,
            'password' => 'required|string',
        ]);

        if (!Hash::check($validated['password'], $user->password)) {
            return ApiResponse::error('Current password is incorrect.', 422);
        }

        $user->update(['email' => $validated['email']]);

        return ApiResponse::success(
            ['email' => $user->email],
            'Email address updated successfully.'
        );
    }

    /**
     * Change the authenticated user's password.
     * Requires current password for verification.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return ApiResponse::error('Current password is incorrect.', 422);
        }

        $user->update([
            'password'       => Hash::make($validated['password']),
            'password_set_at' => now(),
        ]);

        return ApiResponse::success(null, 'Password changed successfully.');
    }

    /**
     * Update notification and sidebar preferences.
     */
    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'notifications_enabled' => 'sometimes|boolean',
            'sidebar_collapsed'     => 'sometimes|boolean',
        ]);

        $request->user()->update($validated);

        return ApiResponse::success(
            $request->user()->only(['notifications_enabled', 'sidebar_collapsed']),
            'Preferences updated.'
        );
    }
}
