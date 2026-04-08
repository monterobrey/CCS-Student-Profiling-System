<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\StudentSkill;
use App\Models\StudentOrganization;
use App\Models\AcademicActivity;
use App\Models\NonAcademicActivity;
use App\Models\UniversityOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentProfileController extends Controller
{
    /**
     * Get the authenticated student's full profile including guardian, skills, etc.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        
        // Ensure we're dealing with a student
        if (!$user->role === 'student') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get the student record for the current user with all required relationships
        $student = Student::with([
            'user', 
            'guardian', 
            'skills', 
            'organizations.organization', 
            'academicActivities', 
            'nonAcademicActivities', 
            'section', 
            'program'
        ])
        ->where('user_id', $user->id)
        ->first();

        if (!$student) {
            return response()->json(['message' => 'Student profile not found'], 404);
        }

        return response()->json($student);
    }

    /**
     * Get a specific student's profile (for Dean/Chair/Faculty).
     */
    public function getById(Request $request, $id)
    {
        $user = $request->user();
        
        // Ensure the user is not a student (unless they are viewing their own, but that's handled by show())
        if ($user->role === 'student' && $user->student->id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = Student::with([
            'user', 
            'guardian', 
            'skills', 
            'organizations.organization', 
            'academicActivities', 
            'nonAcademicActivities', 
            'section', 
            'program'
        ])
        ->find($id);

        if (!$student) {
            return response()->json(['message' => 'Student profile not found'], 404);
        }

        return response()->json($student);
    }

    /**
     * Update or create guardian information.
     */
    public function updateGuardian(Request $request)
    {
        $user = $request->user();
        if (!$user->isStudent()) return response()->json(['message' => 'Unauthorized'], 403);

        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'contact_number' => 'required|string',
            'relationship' => 'required|string',
        ]);

        $guardian = Guardian::updateOrCreate(
            ['student_id' => $user->student->id],
            $validated
        );

        return response()->json(['message' => 'Guardian information updated', 'guardian' => $guardian]);
    }

    /**
     * Add a skill.
     */
    public function addSkill(Request $request)
    {
        $user = $request->user();
        if (!$user->isStudent()) return response()->json(['message' => 'Unauthorized'], 403);

        $validated = $request->validate([
            'skillName' => 'required|string',
            'skill_category' => 'required|string',
        ]);

        $skill = StudentSkill::create([
            'student_id' => $user->student->id,
            'skillName' => $validated['skillName'],
            'skill_category' => $validated['skill_category'],
        ]);

        return response()->json(['message' => 'Skill added', 'skill' => $skill]);
    }

    /**
     * Remove a skill.
     */
    public function removeSkill(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isStudent()) return response()->json(['message' => 'Unauthorized'], 403);

        $skill = StudentSkill::where('id', $id)->where('student_id', $user->student->id)->firstOrFail();
        $skill->delete();

        return response()->json(['message' => 'Skill removed']);
    }

    /**
     * Add an organization affiliation.
     */
    public function addAffiliation(Request $request)
    {
        $user = $request->user();
        if (!$user->isStudent()) return response()->json(['message' => 'Unauthorized'], 403);

        $validated = $request->validate([
            'org_id' => 'required|exists:university_organizations,id',
            'role' => 'required|string',
            'dateJoined' => 'required|date',
        ]);

        $affiliation = StudentOrganization::create([
            'student_id' => $user->student->id,
            'org_id' => $validated['org_id'],
            'role' => $validated['role'],
            'dateJoined' => $validated['dateJoined'],
        ]);

        return response()->json(['message' => 'Affiliation added', 'affiliation' => $affiliation->load('organization')]);
    }

    /**
     * Remove an organization affiliation.
     */
    public function removeAffiliation(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isStudent()) return response()->json(['message' => 'Unauthorized'], 403);

        $affiliation = StudentOrganization::where('id', $id)->where('student_id', $user->student->id)->firstOrFail();
        $affiliation->delete();

        return response()->json(['message' => 'Affiliation removed']);
    }

    /**
     * Add an activity (Academic or Non-Academic).
     */
    public function addActivity(Request $request)
    {
        $user = $request->user();
        if (!$user->isStudent()) return response()->json(['message' => 'Unauthorized'], 403);

        $validated = $request->validate([
            'type' => 'required|in:academic,non-academic',
            'activity_name' => 'required|string',
            'description' => 'required|string',
            'date' => 'required|date',
            'org_id' => 'nullable|exists:university_organizations,id',
        ]);

        if ($validated['type'] === 'academic') {
            $activity = AcademicActivity::create([
                'student_id' => $user->student->id,
                'activity_name' => $validated['activity_name'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'org_id' => $validated['org_id'],
                'status' => 'pending',
            ]);
        } else {
            $activity = NonAcademicActivity::create([
                'student_id' => $user->student->id,
                'activity_name' => $validated['activity_name'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'org_id' => $validated['org_id'],
                'status' => 'pending',
            ]);
        }

        return response()->json(['message' => 'Activity added and pending verification', 'activity' => $activity]);
    }

    /**
     * Get list of organizations for selection.
     */
    public function getOrganizations()
    {
        return UniversityOrganization::all();
    }

    /**
     * Get the authenticated student's violations.
     */
    public function getViolations(Request $request)
    {
        $user = $request->user();
        if (!$user->isStudent()) return response()->json(['message' => 'Unauthorized'], 403);

        $violations = \App\Models\StudentViolation::where('student_id', $user->student->id)
            ->with(['faculty', 'course'])
            ->latest()
            ->get();

        return response()->json($violations);
    }
}
