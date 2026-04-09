<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\Faculty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArchiveController extends Controller
{
    /**
     * Get all archived accounts (Students and Faculty).
     */
    public function index(Request $request)
    {
        if (!$request->user()->isDean()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

        return response()->json([
            'students' => $archivedStudents,
            'faculty' => $archivedFaculty
        ]);
    }

    /**
     * Restore an archived account.
     */
    public function restore(Request $request, $id)
    {
        if (!$request->user()->isDean()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $type = $request->input('type');

        return DB::transaction(function () use ($id, $type) {
            if ($type === 'student') {
                $student = Student::onlyTrashed()->findOrFail($id);
                $user = User::onlyTrashed()->find($student->user_id);
                
                $student->restore();
                if ($user) {
                    $user->restore();
                }
            } elseif ($type === 'faculty') {
                $faculty = Faculty::onlyTrashed()->findOrFail($id);
                $user = User::onlyTrashed()->find($faculty->user_id);
                
                $faculty->restore();
                if ($user) {
                    $user->restore();
                }
            } else {
                return response()->json(['message' => 'Invalid account type.'], 400);
            }

            return response()->json(['message' => 'Account restored successfully.']);
        });
    }
}

