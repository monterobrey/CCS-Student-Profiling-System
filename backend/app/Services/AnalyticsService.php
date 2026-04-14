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
use Illuminate\Support\Facades\DB;

/**
 * Service for analytics and dashboard data.
 */
class AnalyticsService
{
    /**
     * Get dashboard summary for Dean, Chair, and Secretary.
     */
    public function getDeanSummary()
    {
        $totalStudents = Student::count();
        $totalFaculty = Faculty::count();
        $totalViolations = StudentViolation::where('status', 'active')->count();
        $totalAwards = AcademicAward::count();
        $avgGwa = Student::whereNotNull('gwa')->avg('gwa') ?: 1.87;

        $topStudents = Student::with(['program'])
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

        $pendingAchievements = AcademicAward::with('student')
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

        $recentViolations = StudentViolation::with('student')
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
            'pending_achievements' => $pendingAchievements
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

        return [
            'total_subjects' => $totalSubjects,
            'total_students' => $totalStudents,
            'today_schedule' => $todaySchedule,
            'top_students' => $topStudents,
            'subjects' => $subjects,
            'pending_actions' => [
                ['label' => 'Grades to submit', 'count' => 0, 'color' => '#FF6B1A'],
                ['label' => 'Award recommendations', 'count' => AcademicAward::where('status', 'pending')->count(), 'color' => '#f59e0b'],
                ['label' => 'Violation reports', 'count' => StudentViolation::where('faculty_id', $facultyId)->where('status', 'active')->count(), 'color' => '#ef4444']
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
        ];
    }
}
