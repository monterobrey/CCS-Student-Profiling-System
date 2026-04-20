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
     * Also auto-assigns the default program organization (SITES/ACSS) if not yet linked.
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

        // ── Auto-assign default program organization if not yet linked ──
        $this->ensureDefaultOrgAffiliation($student);

        // Reload organizations after potential auto-assign
        $student->load('organizations.organization');

        return ApiResponse::success($student);
    }

    /**
     * Ensure the student has their program's default organization affiliation.
     * BSIT → SITES (Society of Information Technology Students)
     * BSCS → ACSS  (Association of Computer Science Students)
     */
    private function ensureDefaultOrgAffiliation(Student $student): void
    {
        $programCode = $student->program?->program_code;

        $defaultOrgName = match ($programCode) {
            'BSIT' => 'Society of Information Technology Students',
            'BSCS' => 'Association of Computer Science Students',
            default => null,
        };

        if (!$defaultOrgName) return;

        $org = UniversityOrganization::where('organization_name', $defaultOrgName)->first();
        if (!$org) return;

        // Only create if not already affiliated
        $alreadyLinked = StudentOrganization::where('student_id', $student->id)
            ->where('org_id', $org->id)
            ->exists();

        if (!$alreadyLinked) {
            StudentOrganization::create([
                'student_id' => $student->id,
                'org_id'     => $org->id,
                'role'       => 'Member',
                'dateJoined' => $student->created_at->toDateString(),
                'dateLeft'   => null,
            ]);
        }
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
     * Accepts a free-text organization_name — finds or creates the org automatically.
     * The default program org (SITES/ACSS) is auto-assigned on profile load, not here.
     */
    public function addAffiliation(Request $request)
    {
        $validated = $request->validate([
            'organization_name' => 'required|string|max:255',
            'organization_type' => 'nullable|string|max:100',
            'role'              => 'required|string|max:100',
            'dateJoined'        => 'required|date',
            'dateLeft'          => 'nullable|date|after_or_equal:dateJoined',
        ]);

        // Find or create the university organization by name
        $org = \App\Models\UniversityOrganization::firstOrCreate(
            ['organization_name' => $validated['organization_name']],
            [
                'organization_type' => $validated['organization_type'] ?? 'Other',
                'description'       => null,
            ]
        );

        $affiliation = StudentOrganization::create([
            'student_id' => $request->user()->student->id,
            'org_id'     => $org->id,
            'role'        => $validated['role'],
            'dateJoined'  => $validated['dateJoined'],
            'dateLeft'    => $validated['dateLeft'] ?? null,
        ]);

        return ApiResponse::success($affiliation->load('organization'), 'Affiliation added.', 201);
    }

    /**
     * Update an existing affiliation — only role and dateLeft are editable.
     */
    public function updateAffiliation(Request $request, $id)
    {
        $affiliation = StudentOrganization::where('id', $id)
            ->where('student_id', $request->user()->student->id)
            ->firstOrFail();

        $validated = $request->validate([
            'role'     => 'required|string|max:100',
            'dateLeft' => 'nullable|date|after_or_equal:' . $affiliation->dateJoined,
        ]);

        $affiliation->update([
            'role'     => $validated['role'],
            'dateLeft' => $validated['dateLeft'] ?? null,
        ]);

        return ApiResponse::success($affiliation->load('organization'), 'Affiliation updated.');
    }

    /**
     * Archive an affiliation — sets dateLeft to today instead of deleting.
     */
    public function archiveAffiliation(Request $request, $id)
    {
        $affiliation = StudentOrganization::where('id', $id)
            ->where('student_id', $request->user()->student->id)
            ->firstOrFail();

        $affiliation->update([
            'dateLeft' => now()->toDateString(),
        ]);

        return ApiResponse::success($affiliation->load('organization'), 'Affiliation archived.');
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
            ->with(['faculty', 'course', 'actionByUser'])
            ->get();

        return ApiResponse::success($violations);
    }

    /**
     * Get dashboard summary for the authenticated student.
     * Returns profile info, today's schedule, recent awards, violations, and activity counts.
     */
    public function dashboard(Request $request)
    {
        $user    = $request->user();
        $student = Student::with([
            'user',
            'section',
            'program',
            'awards',
            'violations',
            'nonAcademicActivities',
        ])
        ->where('user_id', $user->id)
        ->firstOrFail();

        // Today's schedule — based on the student's section
        $todaySchedules = [];
        if ($student->section_id) {
            $dayName = now()->format('l'); // e.g. "Monday"
            $schedules = \App\Models\Schedule::where('section_id', $student->section_id)
                ->where('dayOfWeek', $dayName)
                ->with(['course', 'faculty.user'])
                ->orderBy('startTime')
                ->get()
                ->unique('course_id') // one entry per subject, not per lec/lab slot
                ->values();

            $colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#ff6b1a','#06b6d4'];
            $todaySchedules = $schedules->values()->map(function ($s, $i) use ($colors) {
                $start = $s->startTime ? substr($s->startTime, 0, 5) : '';
                $end   = $s->endTime   ? substr($s->endTime,   0, 5) : '';
                $fmt   = fn($t) => $t ? date('g:i A', strtotime($t)) : '';
                $faculty = $s->faculty;
                $facultyName = $faculty
                    ? trim(($faculty->first_name ?? '') . ' ' . ($faculty->last_name ?? ''))
                    : 'TBA';

                // Duration in minutes
                $startMins = $start ? (intval(substr($start,0,2))*60 + intval(substr($start,3,2))) : 0;
                $endMins   = $end   ? (intval(substr($end,0,2))*60   + intval(substr($end,3,2)))   : 0;
                $dur = $endMins - $startMins;
                $durLabel = $dur > 0 ? floor($dur/60).'h '.($dur%60 ? ($dur%60).'m' : '') : '';

                return [
                    'subject'   => $s->course->course_name ?? 'Unknown',
                    'code'      => $s->course->course_code ?? '',
                    'time'      => $fmt($s->startTime),
                    'end_time'  => $fmt($s->endTime),
                    'duration'  => trim($durLabel),
                    'room'      => $s->room ?? 'TBA',
                    'professor' => $facultyName,
                    'type'      => ucfirst($s->class_type ?? 'Lecture'),
                    'color'     => $colors[$i % count($colors)],
                ];
            })->toArray();
        }

        // Recent awards (approved only, latest 3)
        $statusColors = ['approved' => '#10b981', 'pending' => '#f59e0b', 'rejected' => '#ef4444'];
        $recentAwards = $student->awards
            ->sortByDesc('created_at')
            ->take(3)
            ->values()
            ->map(fn($a) => [
                'id'     => $a->id,
                'title'  => $a->awardName,
                'status' => $a->status,
                'date'   => $a->date_received?->format('M d, Y'),
                'color'  => $statusColors[$a->status] ?? '#9ca3af',
                'badge'  => ucfirst($a->status),
            ])->toArray();

        // Violations summary
        $violations = $student->violations;
        $activeViolations = $violations->whereIn('status', ['pending', 'under_review'])->values();

        return ApiResponse::success([
            'gwa'                    => $student->gwa ?? '0.00',
            'profile_incomplete'     => !$student->gender || !$student->contact_number || !$student->address,
            'section_name'           => $student->section?->section_name ?? 'Unassigned',
            'program_code'           => $student->program?->program_code ?? '',
            'year_level'             => $student->year_level ?? '',
            'enrolled_subjects_count'=> $student->section_id
                ? \App\Models\Schedule::where('section_id', $student->section_id)->distinct('course_id')->count('course_id')
                : 0,
            'awards_count'           => $student->awards->count(),
            'violations_count'       => $violations->count(),
            'active_violations_count'=> $activeViolations->count(),
            'activities_count'       => $student->nonAcademicActivities->count(),
            'today_schedule'         => $todaySchedules,
            'recent_awards'          => $recentAwards,
            'has_active_violations'  => $activeViolations->isNotEmpty(),
        ]);
    }
}

