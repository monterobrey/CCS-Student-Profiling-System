<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Helpers\ApiResponse;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    /**
     * Send a password reset link to the user's email.
     * Determines user type (student/faculty) by checking student_number.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Always return success to prevent email enumeration
        if (!$user) {
            return ApiResponse::success(null, 'If that email exists, a reset link has been sent.');
        }

        // Determine type: students have a student_number, faculty do not
        $type = $user->student_number ? 'student' : 'faculty';

        // Delete any existing reset tokens for this email
        DB::table('password_resets_custom')->where('email', $user->email)->delete();

        // Generate token and store it
        $token = Str::random(64);
        DB::table('password_resets_custom')->insert([
            'email'      => $user->email,
            'token'      => Hash::make($token),
            'created_at' => now(),
            'expires_at' => now()->addMinutes(60),
        ]);

        // Send notification
        $user->notify(new ResetPasswordNotification($token, $type));

        return ApiResponse::success(null, 'If that email exists, a reset link has been sent.');
    }

    /**
     * Reset the user's password using the token from the email link.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'token'                 => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_resets_custom')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return ApiResponse::error('Invalid or expired reset link.', 422);
        }

        // Check expiry
        if (now()->isAfter($record->expires_at)) {
            DB::table('password_resets_custom')->where('email', $request->email)->delete();
            return ApiResponse::error('This reset link has expired. Please request a new one.', 422);
        }

        // Verify token
        if (!Hash::check($request->token, $record->token)) {
            return ApiResponse::error('Invalid or expired reset link.', 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return ApiResponse::error('User not found.', 404);
        }

        // Update password
        $user->update([
            'password'       => Hash::make($request->password),
            'password_set_at' => now(),
        ]);

        // Consume the token
        DB::table('password_resets_custom')->where('email', $request->email)->delete();

        // Determine redirect type for frontend
        $type = $user->student_number ? 'student' : 'faculty';

        return ApiResponse::success(['type' => $type], 'Password reset successfully.');
    }
}
