<?php

namespace App\Services;

use App\Models\User;
use App\Models\Student;
use App\Models\Faculty;
use App\Models\StudentViolation;
use App\Models\AcademicAward;
use App\Models\AcademicActivity;
use App\Models\NonAcademicActivity;
use App\Models\Schedule;
use App\Models\StudentOrganization;
use App\Models\StudentSkill;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

/**
 * Service for analytics and dashboard data.
 */
class AnalyticsService
{
    /**
     * Get dashboard summary for Dean, Chair, and Secretary.
     */
    public function getDeanSummary($user = null)
    {
        $departmentId = null;
        if ($user && method_exists($user, 'isDepartmentChair') && $user->isDepartmentChair()) {
            $departmentId = $user->faculty?->department_id ?? null;
        }

        $studentsQuery = Student::query();
        $facultyQuery  = Faculty::query();
        $awardsQuery   = AcademicAward::query();
        $violationsQuery = StudentViolation::query();

        if ($departmentId) {
            $studentsQuery->whereHas('program', fn($q) => $q->where('department_id', $departmentId));
            $facultyQuery->where('department_id', $departmentId);
            $awardsQuery->whereHas('student.program', fn($q) => $q->where('department_id', $departmentId));
            $violationsQuery->whereHas('student.program', fn($q) => $q->where('department_id', $departmentId));
        }

        $totalStudents   = $studentsQuery->count();
        $totalFaculty    = $facultyQuery->count();
        $totalViolations = (clone $violationsQuery)->where('status', 'active')->count();
        $totalAwards     = $awardsQuery->count();
        $pendingAwardsCount = (clone $awardsQuery)->where('status', 'pending')->count();

        $avgGwa = (clone $studentsQuery)->whereNotNull('gwa')->avg('gwa') ?: 1.87;

        $dayOfWeek = date('l');
        $facultyPresentToday = (int) Schedule::where('dayOfWeek', $dayOfWeek)
            ->distinct('faculty_id')
            ->count('faculty_id');

        $topStudents = (clone $studentsQuery)->with(['program'])
            ->whereNotNull('gwa')
            ->orderBy('gwa', 'asc')
            ->limit(3)
            ->get()
            ->map(function($s) {
                return [
                    'name' => $s->first_name . ' ' . $s->last_name,
                    'course' => $s->program->program_code ?? 'N/A',
                    'tag' => $s->gwa <= 1.5 ? "Dean's List" : "Honor Roll",
                    'gwa' => number_format($s->gwa, 2),
                    'color' => '#' . substr(md5($s->id), 0, 6),
                    'tagClass' => 'tag-green'
                ];
            });

        $accountRequests = User::where('status', 'pending')
            ->latest()
            ->limit(4)
            ->get()
            ->map(function($u) {
                return [
                    'name' => $u->name,
                    'type' => ucfirst($u->role),
                    'course' => $u->isStudent() ? ($u->student->program->program_code ?? 'N/A') : 'Faculty',
                    'status' => 'Pending',
                    'color' => '#' . substr(md5($u->id), 0, 6)
                ];
            });

        $facultyWorkload = Faculty::with(['department'])
            ->withCount(['schedules as subjects'])
            ->orderByDesc('subjects')
            ->limit(4)
            ->get()
            ->map(function($f) {
                $studentCount = DB::table('student_subjects')
                    ->join('schedules', 'student_subjects.course_id', '=', 'schedules.course_id')
                    ->where('schedules.faculty_id', $f->id)
                    ->distinct('student_subjects.student_id')
                    ->count();

                return [
                    'name' => $f->first_name . ' ' . $f->last_name,
                    'department' => $f->department->department_name ?? 'CCS Department',
                    'subjects' => $f->subjects,
                    'students' => $studentCount,
                    'color' => '#' . substr(md5($f->id), 0, 6)
                ];
            });

        $pendingAchievements = (clone $awardsQuery)->with('student')
            ->where('status', 'pending')
            ->latest()
            ->limit(4)
            ->get()
            ->map(function($a) {
                return [
                    'student' => $a->student->first_name . ' ' . $a->student->last_name,
                    'achievement' => $a->awardName,
                    'color' => '#' . substr(md5($a->id), 0, 6)
                ];
            });

        $recentAwards = (clone $awardsQuery)->with('student')
            ->where('status', 'approved')
            ->latest('approved_at')
            ->limit(4)
            ->get()
            ->map(function ($a) {
                return [
                    'student' => $a->student ? ($a->student->first_name . ' ' . $a->student->last_name) : 'Unknown',
                    'award' => $a->awardName,
                    'date' => $a->approved_at ? Carbon::parse($a->approved_at)->toDateString() : null,
                    'color' => '#' . substr(md5($a->id), 0, 6),
                ];
            });

        $recentViolations = (clone $violationsQuery)->with('student')
            ->where('status', 'active')
            ->latest()
            ->limit(2)
            ->get()
            ->map(function($v) {
                return [
                    'name' => $v->student ? ($v->student->first_name . ' ' . $v->student->last_name) : 'Unknown',
                    'type' => $v->violationType,
                    'severity' => $v->severity,
                    'color' => $v->severity === 'Major' ? '#b91c1c' : ($v->severity === 'Moderate' ? '#c2410c' : '#f59e0b'),
                    'severityClass' => 'sev-' . strtolower($v->severity)
                ];
            });

        $chartData = [
            ['sem' => "1st '23", 'gwa' => 2.01, 'pct' => 60],
            ['sem' => "2nd '23", 'gwa' => 1.96, 'pct' => 68],
            ['sem' => "1st '24", 'gwa' => 1.91, 'pct' => 75],
            ['sem' => "2nd '24", 'gwa' => 1.87, 'pct' => 85],
            ['sem' => "Current", 'gwa' => round($avgGwa, 2), 'pct' => 90],
        ];

        return [
            'total_students' => $totalStudents,
            'total_faculty' => $totalFaculty,
            'active_violations' => $totalViolations,
            'total_awards' => $totalAwards,
            'pending_awards' => $pendingAwardsCount,
            'faculty_present_today' => $facultyPresentToday,
            'dept_avg_gwa' => round($avgGwa, 2),
            'top_students' => $topStudents,
            'recent_violations' => $recentViolations,
            'chart_data' => $chartData,
            'pending_accounts' => User::where('status', 'pending')->count(),
            'pending_verifications' => AcademicAward::where('status', 'pending')->count() + 
                                      AcademicActivity::where('status', 'pending')->count() +
                                      NonAcademicActivity::where('status', 'pending')->count(),
            'account_requests' => $accountRequests,
            'faculty_workload' => $facultyWorkload,
            'pending_achievements' => $pendingAchievements,
            'recent_awards' => $recentAwards
        ];
    }

    /**
     * Get dashboard summary for Faculty.
     */
    public function getFacultySummary($facultyId)
    {
        $totalSubjects = Schedule::where('faculty_id', $facultyId)->count();
        
        $sectionIds = Schedule::where('faculty_id', $facultyId)->pluck('section_id')->unique();
        $totalStudents = Student::whereIn('section_id', $sectionIds)->count();

        $dayOfWeek = date('l');
        $todaySchedule = Schedule::with(['course', 'section'])
            ->where('faculty_id', $facultyId)
            ->where('dayOfWeek', $dayOfWeek)
            ->orderBy('startTime')
            ->get()
            ->map(function($s) {
                $startTime = date('g:i A', strtotime($s->startTime));
                $endTime = date('g:i A', strtotime($s->endTime));
                $duration = round((strtotime($s->endTime) - strtotime($s->startTime)) / 3600, 1) . ' hrs';
                
                return [
                    'time' => $startTime,
                    'duration' => $duration,
                    'subject' => $s->course->course_name,
                    'section' => $s->section->section_name,
                    'room' => $s->room ?: 'TBA',
                    'enrolled' => Student::where('section_id', $s->section_id)->count(),
                    'color' => '#' . substr(md5($s->id), 0, 6)
                ];
            });

        $topStudents = Student::whereIn('section_id', $sectionIds)
            ->whereNotNull('gwa')
            ->orderBy('gwa', 'asc')
            ->limit(4)
            ->get()
            ->map(function($s) {
                return [
                    'name' => $s->first_name . ' ' . $s->last_name,
                    'subject' => $s->section->section_name ?? 'Multiple Courses',
                    'grade' => number_format($s->gwa, 2),
                    'color' => '#' . substr(md5($s->id), 0, 6)
                ];
            });

        $subjects = Schedule::with(['course', 'section'])
            ->where('faculty_id', $facultyId)
            ->get()
            ->map(function($s) {
                return [
                    'code' => $s->course->course_code,
                    'name' => $s->course->course_name,
                    'section' => $s->section->section_name,
                    'enrolled' => Student::where('section_id', $s->section_id)->count(),
                    'color' => '#' . substr(md5($s->id), 0, 6)
                ];
            });

        $avgGwa = null;
        if ($sectionIds->isNotEmpty()) {
            $gwaQuery = Student::whereIn('section_id', $sectionIds)->whereNotNull('gwa');
            if ($gwaQuery->exists()) {
                $avgGwa = round((float) $gwaQuery->avg('gwa'), 2);
            }
        }

        return [
            'total_subjects' => $totalSubjects,
            'total_students' => $totalStudents,
            'avg_gwa' => $avgGwa,
            'today_schedule' => $todaySchedule,
            'top_students' => $topStudents,
            'subjects' => $subjects,
            'pending_actions' => [
                ['label' => 'Grades to submit', 'count' => 0, 'color' => '#FF6B1A'],
                ['label' => 'Award recommendations', 'count' => AcademicAward::where('status', 'pending')->count(), 'color' => '#f59e0b'],
                ['label' => 'Violation reports', 'count' => StudentViolation::where('faculty_id', $facultyId)
                    ->whereNotIn('status', ['Resolved', 'Dismissed'])
                    ->count(), 'color' => '#ef4444'],
            ]
        ];
    }

    /**
     * Get department-level report data, scoped to the chair's department/program.
     */
    public function getAcademicPerformance(?int $departmentId = null, ?int $programId = null)
    {
        // ── Base student query scoped to department/program ──
        $baseQuery = fn() => Student::query()
            ->when($programId, fn($q) => $q->where('program_id', $programId))
            ->when(!$programId && $departmentId, function ($q) use ($departmentId) {
                $ids = \App\Models\Program::where('department_id', $departmentId)->pluck('id');
                $q->whereIn('program_id', $ids);
            });

        $allStudents  = $baseQuery()->with(['program', 'violations'])->get();
        $gwaStudents  = $baseQuery()->whereNotNull('gwa')->with('program')->get();

        $total    = $allStudents->count();
        $gwaTotal = $gwaStudents->count();
        $avgGwa   = $gwaTotal > 0 ? round($gwaStudents->avg('gwa'), 2) : null;

        // ── GWA buckets ──
        $deansListCount    = $gwaStudents->where('gwa', '<=', 1.50)->count();
        $veryGoodCount     = $gwaStudents->whereBetween('gwa', [1.51, 2.00])->count();
        $goodCount         = $gwaStudents->whereBetween('gwa', [2.01, 2.50])->count();
        $satisfactoryCount = $gwaStudents->whereBetween('gwa', [2.51, 3.00])->count();
        $atRiskCount       = $gwaStudents->where('gwa', '>', 3.00)->count();

        // ── Summary cards ──
        $summary = [
            ['label' => 'Total Students', 'value' => $total,           'sub' => 'Enrolled',        'color' => '#3b82f6'],
            ['label' => "Dean's List",    'value' => $deansListCount,   'sub' => 'GWA ≤ 1.50',      'color' => '#065f46'],
            ['label' => 'At Risk',        'value' => $atRiskCount,      'sub' => 'GWA > 3.00',      'color' => '#b91c1c'],
            ['label' => 'Dept Avg GWA',   'value' => $avgGwa ?? 'N/A',  'sub' => 'With GWA recorded','color' => '#FF6B1A'],
        ];

        // ── GWA Distribution ──
        $pct = fn($n) => $gwaTotal > 0 ? round($n / $gwaTotal * 100) : 0;
        $distribution = [
            ['range' => '1.00–1.50', 'desc' => "Dean's List",  'count' => $deansListCount,    'pct' => $pct($deansListCount),    'color' => '#065f46'],
            ['range' => '1.51–2.00', 'desc' => 'Very Good',    'count' => $veryGoodCount,     'pct' => $pct($veryGoodCount),     'color' => '#1e40af'],
            ['range' => '2.01–2.50', 'desc' => 'Good',         'count' => $goodCount,         'pct' => $pct($goodCount),         'color' => '#d97706'],
            ['range' => '2.51–3.00', 'desc' => 'Satisfactory', 'count' => $satisfactoryCount, 'pct' => $pct($satisfactoryCount), 'color' => '#ea580c'],
            ['range' => 'Above 3.00','desc' => 'At Risk',       'count' => $atRiskCount,       'pct' => $pct($atRiskCount),       'color' => '#b91c1c'],
        ];

        // ── GWA by Program ──
        $byProgram = $gwaStudents
            ->groupBy(fn($s) => $s->program?->program_code ?? 'Unknown')
            ->map(fn($group, $code) => [
                'name'     => $code,
                'students' => $group->count(),
                'gwa'      => round($group->avg('gwa'), 2),
                'pct'      => $gwaTotal > 0 ? round($group->count() / $gwaTotal * 100) : 0,
                'color'    => '#' . substr(md5($code), 0, 6),
            ])->values();

        // ── Students by Year Level ──
        $byYearLevel = $allStudents
            ->groupBy('year_level')
            ->map(fn($group, $year) => [
                'year'     => $year ? "{$year}" . ['','st','nd','rd','th'][(int)$year] ?? 'th' . ' Year' : 'Unknown',
                'label'    => "Year {$year}",
                'students' => $group->count(),
                'avg_gwa'  => $group->whereNotNull('gwa')->count() > 0
                    ? round($group->whereNotNull('gwa')->avg('gwa'), 2)
                    : null,
            ])
            ->sortKeys()
            ->values();

        // ── Violations by Severity (scoped to department students) ──
        $studentIds = $allStudents->pluck('id');
        $violations = StudentViolation::whereIn('student_id', $studentIds)->get();
        $violationsBySeverity = [
            ['severity' => 'Minor',    'count' => $violations->where('severity', 'Minor')->count(),    'color' => '#f59e0b'],
            ['severity' => 'Moderate', 'count' => $violations->where('severity', 'Moderate')->count(), 'color' => '#ea580c'],
            ['severity' => 'Major',    'count' => $violations->where('severity', 'Major')->count(),    'color' => '#b91c1c'],
        ];

        // ── Top 5 Students by GWA ──
        $topStudents = $gwaStudents
            ->sortBy('gwa')
            ->take(5)
            ->map(fn($s) => [
                'name'    => "{$s->last_name}, {$s->first_name}",
                'program' => $s->program?->program_code ?? 'N/A',
                'gwa'     => number_format($s->gwa, 2),
                'color'   => '#' . substr(md5($s->id), 0, 6),
            ])->values();

        // ── At-Risk vs Dean's List by Year Level ──
        $riskVsHonors = $allStudents
            ->whereNotNull('gwa')
            ->groupBy('year_level')
            ->map(fn($group, $year) => [
                'label'      => "Year {$year}",
                'deans_list' => $group->where('gwa', '<=', 1.50)->count(),
                'at_risk'    => $group->where('gwa', '>', 3.00)->count(),
            ])
            ->sortKeys()
            ->values();

        // ── Semester GWA Trend (dummy history + real current) ──
        $semesterTrend = collect([
            ['sem' => "1st '23", 'gwa' => 2.10],
            ['sem' => "2nd '23", 'gwa' => 2.05],
            ['sem' => "1st '24", 'gwa' => 1.98],
            ['sem' => "2nd '24", 'gwa' => 1.91],
            ['sem' => "1st '26", 'gwa' => $avgGwa ?? 1.87],
        ]);

        // ── Scope label (for frontend display) ──
        $scopeLabel = null;
        if ($programId) {
            $scopeLabel = \App\Models\Program::find($programId)?->program_code;
        } elseif ($departmentId) {
            $scopeLabel = \App\Models\Department::find($departmentId)?->department_name;
        }

        return [
            'summary'              => $summary,
            'distribution'         => $distribution,
            'by_program'           => $byProgram,
            'by_year_level'        => $byYearLevel,
            'violations_severity'  => $violationsBySeverity,
            'top_students'         => $topStudents,
            'risk_vs_honors'       => $riskVsHonors,
            'chart_data'           => $semesterTrend,
            'total_students'       => $total,
            'total_with_gwa'       => $gwaTotal,
            'scope_label'          => $scopeLabel,
        ];
    }

    /**
     * Get overall department-wide report for the Dean.
     */
    public function getDeanReport()
    {
        $students    = Student::with(['program', 'violations'])->get();
        $gwaStudents = Student::whereNotNull('gwa')->with('program')->get();

        $total    = $students->count();
        $gwaTotal = $gwaStudents->count();
        $avgGwa   = $gwaTotal > 0 ? round($gwaStudents->avg('gwa'), 2) : null;

        $deansListCount    = $gwaStudents->where('gwa', '<=', 1.50)->count();
        $veryGoodCount     = $gwaStudents->whereBetween('gwa', [1.51, 2.00])->count();
        $goodCount         = $gwaStudents->whereBetween('gwa', [2.01, 2.50])->count();
        $satisfactoryCount = $gwaStudents->whereBetween('gwa', [2.51, 3.00])->count();
        $atRiskCount       = $gwaStudents->where('gwa', '>', 3.00)->count();

        // ── Summary cards ──
        $summary = [
            ['label' => 'Total Students', 'value' => $total,           'sub' => 'All programs',      'color' => '#3b82f6'],
            ['label' => "Dean's List",    'value' => $deansListCount,   'sub' => 'GWA ≤ 1.50',        'color' => '#065f46'],
            ['label' => 'At Risk',        'value' => $atRiskCount,      'sub' => 'GWA > 3.00',        'color' => '#b91c1c'],
            ['label' => 'Dept Avg GWA',   'value' => $avgGwa ?? 'N/A',  'sub' => 'With GWA recorded', 'color' => '#FF6B1A'],
        ];

        // ── GWA Distribution ──
        $pct = fn($n) => $gwaTotal > 0 ? round($n / $gwaTotal * 100) : 0;
        $distribution = [
            ['range' => '1.00–1.50', 'desc' => "Dean's List",  'count' => $deansListCount,    'pct' => $pct($deansListCount),    'color' => '#065f46'],
            ['range' => '1.51–2.00', 'desc' => 'Very Good',    'count' => $veryGoodCount,     'pct' => $pct($veryGoodCount),     'color' => '#1e40af'],
            ['range' => '2.01–2.50', 'desc' => 'Good',         'count' => $goodCount,         'pct' => $pct($goodCount),         'color' => '#d97706'],
            ['range' => '2.51–3.00', 'desc' => 'Satisfactory', 'count' => $satisfactoryCount, 'pct' => $pct($satisfactoryCount), 'color' => '#ea580c'],
            ['range' => 'Above 3.00','desc' => 'At Risk',       'count' => $atRiskCount,       'pct' => $pct($atRiskCount),       'color' => '#b91c1c'],
        ];

        // ── GWA by Program ──
        $byProgram = $gwaStudents
            ->groupBy(fn($s) => $s->program?->program_code ?? 'Unknown')
            ->map(fn($group, $code) => [
                'name'     => $code,
                'students' => $group->count(),
                'gwa'      => round($group->avg('gwa'), 2),
                'color'    => '#' . substr(md5($code), 0, 6),
            ])->values();

        // ── Students by Year Level ──
        $byYearLevel = $students
            ->groupBy('year_level')
            ->map(fn($group, $year) => [
                'label'    => "Year {$year}",
                'students' => $group->count(),
            ])
            ->sortKeys()->values();

        // ── Violations by Severity ──
        $allViolations = StudentViolation::all();
        $violationsBySeverity = [
            ['severity' => 'Minor',    'count' => $allViolations->where('severity', 'Minor')->count(),    'color' => '#f59e0b'],
            ['severity' => 'Moderate', 'count' => $allViolations->where('severity', 'Moderate')->count(), 'color' => '#ea580c'],
            ['severity' => 'Major',    'count' => $allViolations->where('severity', 'Major')->count(),    'color' => '#b91c1c'],
        ];

        // ── Top 5 Organizations by student membership ──
        $topOrgs = DB::table('student_organizations')
            ->join('university_organizations', 'student_organizations.org_id', '=', 'university_organizations.id')
            ->select('university_organizations.organization_name as name', DB::raw('COUNT(*) as members'))
            ->groupBy('university_organizations.id', 'university_organizations.organization_name')
            ->orderByDesc('members')
            ->limit(5)
            ->get()
            ->map(fn($row) => [
                'name'    => $row->name,
                'members' => (int) $row->members,
                'color'   => '#' . substr(md5($row->name), 0, 6),
            ])->values();

        // ── Top 5 Skill Categories ──
        $topSkillCategories = DB::table('student_skills')
            ->select('skill_category', DB::raw('COUNT(*) as count'))
            ->groupBy('skill_category')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($row) => [
                'category' => $row->skill_category,
                'count'    => (int) $row->count,
                'color'    => '#' . substr(md5($row->skill_category), 0, 6),
            ])->values();

        // ── Top 5 Individual Skills ──
        $topSkills = DB::table('student_skills')
            ->select('skillName', DB::raw('COUNT(*) as count'))
            ->groupBy('skillName')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($row) => [
                'skill' => $row->skillName,
                'count' => (int) $row->count,
                'color' => '#' . substr(md5($row->skillName), 0, 6),
            ])->values();

        // ── At-Risk vs Dean's List by Year Level ──
        $riskVsHonors = $gwaStudents
            ->groupBy('year_level')
            ->map(fn($group, $year) => [
                'label'      => "Year {$year}",
                'deans_list' => $group->where('gwa', '<=', 1.50)->count(),
                'at_risk'    => $group->where('gwa', '>', 3.00)->count(),
            ])
            ->sortKeys()->values();

        // ── Semester GWA Trend ──
        $semesterTrend = collect([
            ['sem' => "1st '23", 'gwa' => 2.10],
            ['sem' => "2nd '23", 'gwa' => 2.05],
            ['sem' => "1st '24", 'gwa' => 1.98],
            ['sem' => "2nd '24", 'gwa' => 1.91],
            ['sem' => "1st '26", 'gwa' => $avgGwa ?? 1.87],
        ]);

        // ── Top 5 Students ──
        $topStudents = $gwaStudents->sortBy('gwa')->take(5)
            ->map(fn($s) => [
                'name'    => "{$s->last_name}, {$s->first_name}",
                'program' => $s->program?->program_code ?? 'N/A',
                'gwa'     => number_format($s->gwa, 2),
                'color'   => '#' . substr(md5($s->id), 0, 6),
            ])->values();

        return [
            'summary'             => $summary,
            'distribution'        => $distribution,
            'by_program'          => $byProgram,
            'by_year_level'       => $byYearLevel,
            'violations_severity' => $violationsBySeverity,
            'top_orgs'            => $topOrgs,
            'top_skill_categories'=> $topSkillCategories,
            'top_skills'          => $topSkills,
            'risk_vs_honors'      => $riskVsHonors,
            'chart_data'          => $semesterTrend,
            'top_students'        => $topStudents,
            'total_students'      => $total,
            'total_with_gwa'      => $gwaTotal,
        ];
    }
}
