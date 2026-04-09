<?php

namespace App\Http\Controllers\Functions;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\Faculty;
use App\Models\StudentViolation;
use App\Models\AcademicAward;
use App\Models\AcademicActivity;
use App\Models\NonAcademicActivity;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get dashboard summary stats for Dean, Chair, and Secretary.
     */
    public function deanSummary(Request $request)
    {
        if (!$request->user()->isDean() && !$request->user()->isDepartmentChair() && !$request->user()->isSecretary()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $totalStudents = Student::count();
        $totalFaculty = Faculty::count();
        $totalViolations = StudentViolation::where('status', 'active')->count();
        $totalAwards = AcademicAward::count();

        // Calculate real avg GWA from students who have it
        $avgGwa = Student::whereNotNull('gwa')->avg('gwa') ?: 1.87;

        // Fetch top 3 performing students
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

        // Recent account requests (Pending users)
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

        // Faculty workload summary
        $facultyWorkload = Faculty::with(['department'])
            ->withCount(['schedules as subjects'])
            ->limit(4)
            ->get()
            ->map(function($f) {
                // Approximate students count from unique students in their sections
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

        // Pending achievements to verify
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

        return response()->json([
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
        ]);
    }

    /**
     * Get dashboard summary stats for Faculty.
     */
    public function facultySummary(Request $request)
    {
        $user = $request->user();
        if (!$user->isFaculty() && !$user->isDean() && !$user->isDepartmentChair()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $facultyId = $user->faculty->id;
        $totalSubjects = Schedule::where('faculty_id', $facultyId)->count();
        
        // Count unique students across all sections handled by this faculty
        $sectionIds = Schedule::where('faculty_id', $facultyId)->pluck('section_id')->unique();
        $totalStudents = Student::whereIn('section_id', $sectionIds)->count();

        // Get today's schedule
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

        // Top students in their handled sections
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

        // Courses taught by this faculty
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

        return response()->json([
            'total_subjects' => $totalSubjects,
            'total_students' => $totalStudents,
            'today_schedule' => $todaySchedule,
            'top_students' => $topStudents,
            'subjects' => $subjects,
            'pending_actions' => [
                ['label' => 'Grades to submit', 'count' => 0, 'color' => '#FF6B1A'],
                ['label' => 'Award recommendations', 'count' => AcademicAward::where('recommended_by', $user->id)->where('status', 'pending')->count(), 'color' => '#f59e0b'],
                ['label' => 'Violation reports', 'count' => StudentViolation::where('faculty_id', $facultyId)->where('status', 'active')->count(), 'color' => '#ef4444']
            ]
        ]);
    }

    /**
     * Get academic performance statistics.
     */
    public function academicPerformance(Request $request)
    {
        if (!$request->user()->isDean() && !$request->user()->isDepartmentChair()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $summary = [
            'deans_list' => 127,
            'satisfactory' => 583,
            'at_risk' => 98,
            'failed' => 34,
        ];

        $distribution = [
            ['range' => '1.00–1.50', 'desc' => 'Excellent', 'count' => 127, 'pct' => 15, 'color' => '#065f46'],
            ['range' => '1.51–2.00', 'desc' => 'Very Good', 'count' => 310, 'pct' => 37, 'color' => '#1e40af'],
            ['range' => '2.01–2.50', 'desc' => 'Good', 'count' => 273, 'pct' => 32, 'color' => '#d97706'],
            ['range' => '2.51–3.00', 'desc' => 'Satisfactory', 'count' => 98, 'pct' => 12, 'color' => '#ea580c'],
            ['range' => 'Below 3.00', 'desc' => 'At Risk', 'count' => 34, 'pct' => 4, 'color' => '#b91c1c'],
        ];

        return response()->json([
            'summary' => $summary,
            'distribution' => $distribution,
        ]);
    }
}

