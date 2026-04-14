<?php

namespace App\Services;

use App\Models\Student;
use Illuminate\Support\Facades\DB;

/**
 * Service for student profiling and reporting.
 */
class ProfilingService
{
    /**
     * Generate profiling report with filters.
     */
    public function generateReport($filters)
    {
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

        $students = $query->get();

        return $students->map(function($student) {
            $completedSubjects = $student->subjects->whereNotNull('finalRating');
            $gwa = $completedSubjects->count() > 0 
                ? $completedSubjects->avg('finalRating')
                : null;

            return [
                'id' => $student->id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'student_number' => $student->user->student_number,
                'year_level' => $student->year_level,
                'program' => $student->program->program_code ?? 'N/A',
                'section' => $student->section->section_name ?? 'N/A',
                'gwa' => $gwa ? number_format($gwa, 2) : 'N/A',
                'skills' => $student->skills->map(fn($s) => $s->skillName)->toArray(),
                'organizations' => $student->organizations->map(fn($o) => $o->organization->organization_name ?? 'N/A')->toArray(),
                'academic_activities' => $student->academicActivities->count(),
                'non_academic_activities' => $student->nonAcademicActivities->count(),
                'awards' => $student->awards->count(),
            ];
        });
    }
}
