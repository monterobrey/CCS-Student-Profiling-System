<?php

namespace App\Services;

use App\Models\Student;
use App\Models\UniversityOrganization;
use App\Models\StudentOrganization;
use Illuminate\Support\Facades\DB;

/**
 * Service for student profiling and reporting.
 */
class ProfilingService
{
    /**
     * Bulk-ensure every student has their program's default org affiliation.
     * This runs before filtering so students who have never logged in are still included.
     */
    private function ensureDefaultOrgAffiliations(): void
    {
        $defaultMap = [
            'BSIT' => 'Society of Information Technology Students',
            'BSCS' => 'Association of Computer Science Students',
        ];

        // Load the org IDs once
        $orgs = UniversityOrganization::whereIn('organization_name', array_values($defaultMap))
            ->pluck('id', 'organization_name');

        // Load all active students with their program code
        $students = Student::with('program')->whereNull('deleted_at')->get();

        $inserts = [];
        $now = now();

        foreach ($students as $student) {
            $programCode = $student->program?->program_code;
            if (!isset($defaultMap[$programCode])) continue;

            $orgName = $defaultMap[$programCode];
            if (!isset($orgs[$orgName])) continue;

            $orgId = $orgs[$orgName];

            $alreadyLinked = StudentOrganization::where('student_id', $student->id)
                ->where('org_id', $orgId)
                ->exists();

            if (!$alreadyLinked) {
                $inserts[] = [
                    'student_id' => $student->id,
                    'org_id'     => $orgId,
                    'role'       => 'Member',
                    'dateJoined' => $student->created_at->toDateString(),
                    'dateLeft'   => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (!empty($inserts)) {
            StudentOrganization::insert($inserts);
        }
    }

    /**
     * Generate profiling report with filters.
     */
    public function generateReport($filters)
    {
        // Ensure all students have their default program org before filtering
        $this->ensureDefaultOrgAffiliations();

        $query = Student::query()
            ->with([
                'user',
                'section',
                'program',
                'skills',
                'academicActivities' => fn($q) => $q->where('status', 'verified'),
                'nonAcademicActivities' => fn($q) => $q->where('status', 'verified'),
                'organizations.organization',
                'awards' => fn($q) => $q->where('status', 'approved'),
                'subjects'
            ]);

        // Filter by Year Level
        if (!empty($filters['year_level'])) {
            $query->where('year_level', $filters['year_level']);
        }

        // Filter by Section
        if (!empty($filters['section_id'])) {
            $query->where('section_id', $filters['section_id']);
        }

        // Filter by Program
        if (!empty($filters['program_id'])) {
            $query->where('program_id', $filters['program_id']);
        }

        // Filter by Skills
        if (!empty($filters['skill_name']) || !empty($filters['skill_category'])) {
            $query->whereHas('skills', function ($q) use ($filters) {
                if (!empty($filters['skill_name'])) {
                    $q->where('skillName', $filters['skill_name']);
                }
                if (!empty($filters['skill_category'])) {
                    $q->where('skill_category', $filters['skill_category']);
                }
            });
        }

        // Filter by Academic Activities
        if (!empty($filters['academic_activity'])) {
            $query->whereHas('academicActivities', function($q) use ($filters) {
                $q->where('status', 'verified')
                  ->where('activity_name', $filters['academic_activity']);
            });
        }

        // Filter by Organizations
        if (!empty($filters['org_id'])) {
            $query->whereHas('organizations', function($q) use ($filters) {
                $q->where('org_id', $filters['org_id']);
            });
        }
        if (!empty($filters['organization'])) {
            $query->whereHas('organizations.organization', function($q) use ($filters) {
                $q->where('organization_name', $filters['organization']);
            });
        }

        // Filter by Awards
        if (!empty($filters['award_name'])) {
            $query->whereHas('awards', function($q) use ($filters) {
                $q->where('status', 'approved')
                  ->where('awardName', $filters['award_name']);
            });
        }

        // Filter by GWA range (uses stored gwa column on students table)
        if (!empty($filters['gwa_min'])) {
            $query->where('gwa', '>=', (float) $filters['gwa_min']);
        }
        if (!empty($filters['gwa_max'])) {
            $query->where('gwa', '<=', (float) $filters['gwa_max']);
        }

        $students = $query->get();

        return $students->map(function($student) {
            // Prefer the stored GWA column; fall back to computing from subject grades
            if (!is_null($student->gwa) && $student->gwa > 0) {
                $gwa = number_format((float) $student->gwa, 2);
            } else {
                $completedSubjects = $student->subjects->whereNotNull('finalRating');
                $gwa = $completedSubjects->count() > 0
                    ? number_format($completedSubjects->avg('finalRating'), 2)
                    : null;
            }

            return [
                'id' => $student->id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'student_number' => $student->user->student_number,
                'year_level' => $student->year_level,
                'program' => $student->program->program_code ?? 'N/A',
                'section' => $student->section->section_name ?? 'N/A',
                'gwa' => $gwa ?? 'N/A',
                'skills' => $student->skills->map(fn($s) => $s->skillName)->toArray(),
                'organizations' => $student->organizations->map(fn($o) => $o->organization->organization_name ?? 'N/A')->toArray(),
                'academic_activities' => $student->academicActivities->count(),
                'non_academic_activities' => $student->nonAcademicActivities->count(),
                'awards' => $student->awards->count(),
            ];
        });
    }
}
