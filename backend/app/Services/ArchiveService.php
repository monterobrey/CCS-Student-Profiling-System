<?php

namespace App\Services;

use App\Models\User;
use App\Models\Student;
use App\Models\Faculty;
use Illuminate\Support\Facades\DB;

/**
 * Service for archive management.
 */
class ArchiveService
{
    /**
     * Get all archived accounts.
     */
    public function getArchivedAccounts()
    {
        $archivedStudents = Student::onlyTrashed()->with(['user' => function($query) {
            $query->withTrashed();
        }, 'program', 'archiver'])->get()->map(function($s) {
            $s->type = 'student';
            return $s;
        });

        $archivedFaculty = Faculty::onlyTrashed()->with(['user' => function($query) {
            $query->withTrashed();
        }, 'department', 'archiver'])->get()->map(function($f) {
            $f->type = 'faculty';
            return $f;
        });

        return [
            'students' => $archivedStudents,
            'faculty' => $archivedFaculty
        ];
    }

    /**
     * Restore an archived account.
     */
    public function restoreAccount($id, $type)
    {
        return DB::transaction(function () use ($id, $type) {
            if ($type === 'student') {
                $student = Student::onlyTrashed()->findOrFail($id);
                $user = User::onlyTrashed()->find($student->user_id);
                
                $student->restore();
                if ($user) {
                    $user->restore();
                }

                return $student->load('user', 'program');
            } elseif ($type === 'faculty') {
                $faculty = Faculty::onlyTrashed()->findOrFail($id);
                $user = User::onlyTrashed()->find($faculty->user_id);
                
                $faculty->restore();
                if ($user) {
                    $user->restore();
                }

                return $faculty->load('user', 'department');
            }

            throw new \Exception('Invalid account type.');
        });
    }
}
