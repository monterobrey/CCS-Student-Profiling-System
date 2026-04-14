<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\StudentSkill;
use App\Models\StudentOrganization;
use App\Models\AcademicActivity;
use App\Models\NonAcademicActivity;
use App\Models\StudentViolation;
use App\Models\UniversityOrganization;
use App\Helpers\ApiResponse;
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
        ->firstOrFail();

        return ApiResponse::success($student);
    }

    /**
     * Get a specific student's profile (for Dean/Chair/Faculty).
     */
    public function getById(Request $request, $id)
    {
        $user = $request->user();
        
        if ($user->role === 'student' && $user->student->id != $id) {
            return ApiResponse::unauthorized('Cannot view another student\'s profile.');
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
        ->findOrFail($id);

        return ApiResponse::success($student);
    }

    /**
     * Update or create guardian information.
     */
    public function updateGuardian(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'contact_number' => 'required|string',
            'relationship' => 'required|string',
        ]);

        $guardian = Guardian::updateOrCreate(
            ['student_id' => $request->user()->student->id],
            $validated
        );

        return ApiResponse::success($guardian, 'Guardian information updated.');
    }

    /**
     * Add a skill.
     */
    public function addSkill(Request $request)
    {
        $validated = $request->validate([
            'skillName' => 'required|string',
            'skill_category' => 'required|string',
        ]);

        $skill = StudentSkill::create([
            'student_id' => $request->user()->student->id,
            'skillName' => $validated['skillName'],
            'skill_category' => $validated['skill_category'],
        ]);

        return ApiResponse::success($skill, 'Skill added.', 201);
    }

    /**
     * Remove a skill.
     */
    public function removeSkill(Request $request, $id)
    {
        $skill = StudentSkill::where('id', $id)->where('student_id', $request->user()->student->id)->firstOrFail();
        $skill->delete();

        return ApiResponse::success(null, 'Skill removed.');
    }

    /**
     * Add an organization affiliation.
     */
    public function addAffiliation(Request $request)
    {
        $validated = $request->validate([
            'org_id' => 'required|exists:university_organizations,id',
            'role' => 'required|string',
            'dateJoined' => 'required|date',
        ]);

        $affiliation = StudentOrganization::create([
            'student_id' => $request->user()->student->id,
            'org_id' => $validated['org_id'],
            'role' => $validated['role'],
            'dateJoined' => $validated['dateJoined'],
        ]);

        return ApiResponse::success($affiliation->load('organization'), 'Affiliation added.', 201);
    }

    /**
     * Remove an organization affiliation.
     */
    public function removeAffiliation(Request $request, $id)
    {
        $affiliation = StudentOrganization::where('id', $id)->where('student_id', $request->user()->student->id)->firstOrFail();
        $affiliation->delete();

        return ApiResponse::success(null, 'Affiliation removed.');
    }

    /**
     * Add an activity (Academic or Non-Academic).
     */
    public function addActivity(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:academic,non-academic',
            'activity_name' => 'required|string',
            'description' => 'required|string',
            'date' => 'required|date',
            'org_id' => 'nullable|exists:university_organizations,id',
        ]);

        if ($validated['type'] === 'academic') {
            $activity = AcademicActivity::create([
                'student_id' => $request->user()->student->id,
                'activity_name' => $validated['activity_name'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'org_id' => $validated['org_id'],
                'status' => 'pending',
            ]);
        } else {
            $activity = NonAcademicActivity::create([
                'student_id' => $request->user()->student->id,
                'activity_name' => $validated['activity_name'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'org_id' => $validated['org_id'],
                'status' => 'pending',
            ]);
        }

        return ApiResponse::success($activity, 'Activity added and pending verification.', 201);
    }

    /**
     * Get list of organizations for selection.
     */
    public function getOrganizations()
    {
        return ApiResponse::success(UniversityOrganization::all());
    }

    /**
     * Get the authenticated student's violations.
     */
    public function getViolations(Request $request)
    {
        $violations = StudentViolation::where('student_id', $request->user()->student->id)
            ->with(['faculty', 'course'])
            ->get();

        return ApiResponse::success($violations);
    }
}

