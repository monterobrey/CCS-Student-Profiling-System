<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Student\StudentController;
use App\Http\Controllers\Student\StudentProfileController;
use App\Http\Controllers\Faculty\FacultyController;
use App\Http\Controllers\Faculty\FacultyScheduleController;
use App\Http\Controllers\Functions\AnalyticsController;
use App\Http\Controllers\Functions\ViolationController;
use App\Http\Controllers\Functions\CourseController;
use App\Http\Controllers\Functions\SectionController;
use App\Http\Controllers\Functions\ProfilingController;
use App\Http\Controllers\Functions\CurriculumController;
use App\Http\Controllers\Functions\ScheduleController;
use App\Http\Controllers\Functions\ArchiveController;
use App\Http\Controllers\Functions\AwardController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/setup-password', [AuthController::class, 'setupPassword']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load($request->user()->role === 'student' ? 'student' : ($request->user()->isFacultyMember() ? 'faculty' : []));
    });

    // Profiling Query Engine (Dean, Chair, Secretary)
    Route::get('/profiling/report', [ProfilingController::class, 'report'])->middleware('role:dean,department_chair,secretary');

    // Faculty Routes
    Route::middleware('role:faculty')->group(function () {
        Route::get('/faculty/schedule', [FacultyScheduleController::class, 'index']);
        Route::get('/faculty/sections/{section_id}/students', [FacultyScheduleController::class, 'getSectionStudents']);
        Route::get('/faculty/students', [FacultyController::class, 'myStudents']);
        Route::get('/faculty/violations', [FacultyController::class, 'myViolations']);
        Route::post('/faculty/violations', [FacultyController::class, 'storeViolation']);
        Route::get('/analytics/faculty', [AnalyticsController::class, 'facultySummary']);

        // Faculty profile (self)
        Route::get('/faculty/profile', [FacultyController::class, 'myProfile']);
        Route::put('/faculty/profile', [FacultyController::class, 'updateMyProfile']);
        Route::post('/faculty/expertise', [FacultyController::class, 'addExpertise']);
        Route::delete('/faculty/expertise/{id}', [FacultyController::class, 'removeExpertise']);

        // Faculty can view awards for their classes and give awards (pending approval)
        Route::get('/faculty/awards',  [AwardController::class, 'index']);
        Route::post('/faculty/awards', [AwardController::class, 'give']);
    });

    // Student Routes
    Route::middleware('role:student')->group(function () {
        Route::get('/student/profile', [StudentProfileController::class, 'show']);
        Route::get('/student/curriculum', [CurriculumController::class, 'index']);
        Route::get('/student/schedule', [FacultyScheduleController::class, 'studentSchedule']);
        Route::post('/student/profile', [StudentController::class, 'updateProfile']);
        Route::post('/student/guardian', [StudentProfileController::class, 'updateGuardian']);
        Route::post('/student/skills', [StudentProfileController::class, 'addSkill']);
        Route::delete('/student/skills/{id}', [StudentProfileController::class, 'removeSkill']);
        Route::get('/student/organizations', [StudentProfileController::class, 'getOrganizations']);
        Route::post('/student/affiliations', [StudentProfileController::class, 'addAffiliation']);
        Route::put('/student/affiliations/{id}', [StudentProfileController::class, 'updateAffiliation']);
        Route::patch('/student/affiliations/{id}/archive', [StudentProfileController::class, 'archiveAffiliation']);
        Route::post('/student/activities', [StudentProfileController::class, 'addActivity']);
        Route::get('/student/violations', [StudentProfileController::class, 'getViolations']);

        // Student can view their own awards and apply
        Route::get('/student/awards',  [AwardController::class, 'index']);
        Route::post('/student/awards', [AwardController::class, 'apply']);
    });

    // Curriculum Shared Routes (Dean and Secretary)
    Route::middleware('role:dean,secretary')->group(function () {
        Route::get('/dean/curriculum', [CurriculumController::class, 'index']);
        Route::post('/dean/curriculum', [CurriculumController::class, 'store']);
        Route::post('/dean/curriculum/bulk', [CurriculumController::class, 'bulkStore']);
        Route::post('/dean/curriculum/import', [CurriculumController::class, 'import']);
        Route::delete('/dean/curriculum/{id}', [CurriculumController::class, 'destroy']);
    });

    // Dean Specific
    Route::middleware('role:dean')->group(function () {
        Route::get('/archive', [ArchiveController::class, 'index']);
        Route::post('/archive/{id}/restore', [ArchiveController::class, 'restore']);
        Route::get('/analytics/dean-report', [AnalyticsController::class, 'deanReport']);
    });

    // Chair Specific — give awards
    Route::middleware('role:department_chair')->group(function () {
        Route::post('/awards',              [AwardController::class, 'give']);
    });

    // Secretary Specific
    Route::middleware('role:secretary')->group(function () {
        Route::post('/secretary/students', [StudentController::class, 'store']);
        Route::post('/secretary/students/import', [StudentController::class, 'import']);
        Route::post('/secretary/students/{id}/resend-setup', [StudentController::class, 'resendSetup']);
        Route::post('/secretary/faculty', [FacultyController::class, 'store']);
        Route::post('/secretary/faculty/import', [FacultyController::class, 'import']);
        Route::post('/secretary/faculty/{id}/resend-setup', [FacultyController::class, 'resendSetup']);
    });

    // Dean can update faculty position/program assignment
    Route::middleware('role:dean,secretary')->group(function () {
        Route::put('/secretary/faculty/{id}', [FacultyController::class, 'update']);
    });

    // Student edit (Secretary + Department Chair)
    Route::middleware('role:secretary,department_chair')->group(function () {
        Route::put('/secretary/students/{id}', [StudentController::class, 'update']);
    });

    // Shared routes for Dean, Chair, Secretary
    Route::middleware('role:dean,department_chair,secretary')->group(function () {
        Route::get('/programs', [ProfilingController::class, 'getPrograms']);
        Route::get('/departments', [ProfilingController::class, 'getDepartments']);
        Route::get('/students', [StudentController::class, 'index']);
        Route::get('/students/{id}', [StudentProfileController::class, 'getById']);
        Route::get('/faculty', [FacultyController::class, 'index']);

        // Awards — Dean/Secretary view all, Chair views dept (scoped in service)
        Route::get('/awards', [AwardController::class, 'index']);
        // Approve/reject pending awards
        Route::post('/awards/{id}/approve', [AwardController::class, 'approve']);
        Route::post('/awards/{id}/reject',  [AwardController::class, 'reject']);
        
        // Archiving (Shared)
        Route::delete('/secretary/students/{id}', [StudentController::class, 'destroy']);
        Route::delete('/secretary/faculty/{id}', [FacultyController::class, 'destroy']);
        
        // Courses
        Route::get('/courses', [CourseController::class, 'index']);
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{id}', [CourseController::class, 'update']);
        Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

        // Schedules
        Route::get('/schedules', [ScheduleController::class, 'index']);
        Route::post('/schedules', [ScheduleController::class, 'store']);
        Route::post('/schedules/import', [ScheduleController::class, 'import']);
        Route::post('/schedules/auto-generate', [ScheduleController::class, 'autoGenerate']);
        Route::post('/schedules/{id}/assign-faculty', [ScheduleController::class, 'assignFaculty']);
        Route::get('/curriculum-courses', [ScheduleController::class, 'getCurriculumCourses']);
        Route::delete('/schedules/bulk-delete', [ScheduleController::class, 'bulkDelete']);
        Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);

        Route::get('/analytics/summary', [AnalyticsController::class, 'deanSummary']);
        Route::get('/analytics/performance', [AnalyticsController::class, 'academicPerformance']);
        Route::get('/violations', [ViolationController::class, 'index']);
        Route::put('/violations/{id}', [ViolationController::class, 'update']);
        Route::get('/sections', [SectionController::class, 'index']);
    });
});
