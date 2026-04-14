<?php

namespace App\Traits;

use App\Helpers\ApiResponse;

/**
 * Trait for authorization checks in controllers.
 * Provides reusable methods for common role-based authorization.
 */
trait AuthorizesRoles
{
    /**
     * Check if user is Dean.
     */
    protected function authorizeIsDean($user)
    {
        if (!$user->isDean()) {
            return ApiResponse::unauthorized('Only Deans can perform this action');
        }
        return null;
    }

    /**
     * Check if user is Secretary.
     */
    protected function authorizeIsSecretary($user)
    {
        if (!$user->isSecretary()) {
            return ApiResponse::unauthorized('Only Secretaries can perform this action');
        }
        return null;
    }

    /**
     * Check if user is Faculty.
     */
    protected function authorizeIsFaculty($user)
    {
        if (!$user->isFaculty()) {
            return ApiResponse::unauthorized('Only Faculty can perform this action');
        }
        return null;
    }

    /**
     * Check if user is Student.
     */
    protected function authorizeIsStudent($user)
    {
        if (!$user->isStudent()) {
            return ApiResponse::unauthorized('Only Students can perform this action');
        }
        return null;
    }

    /**
     * Check if user is Dean or Chair.
     */
    protected function authorizeIsDeanOrChair($user)
    {
        if (!$user->isDean() && !$user->isDepartmentChair()) {
            return ApiResponse::unauthorized('Only Deans or Department Chairs can perform this action');
        }
        return null;
    }

    /**
     * Check if user is Secretary or Dean.
     */
    protected function authorizeIsSecretaryOrDean($user)
    {
        if (!$user->isSecretary() && !$user->isDean()) {
            return ApiResponse::unauthorized('Only Secretaries or Deans can perform this action');
        }
        return null;
    }

    /**
     * Check if user is Dean, Chair, or Secretary (admin staff).
     */
    protected function authorizeIsAdminStaff($user)
    {
        if (!$user->isDean() && !$user->isDepartmentChair() && !$user->isSecretary()) {
            return ApiResponse::unauthorized('Only Admin Staff can perform this action');
        }
        return null;
    }

    /**
     * Generic authorization check with custom roles.
     */
    protected function authorizeRole($user, $roles)
    {
        $userRoles = is_array($roles) ? $roles : [$roles];
        $method = $user->role . 'Role';

        foreach ($userRoles as $role) {
            if ($user->role === $role) {
                return null;
            }
        }

        return ApiResponse::unauthorized('You do not have permission to perform this action');
    }
}
