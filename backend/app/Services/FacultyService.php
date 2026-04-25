<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\User;
use App\Models\Department;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentViolation;
use App\Notifications\SetupPasswordNotification;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Service for faculty management operations.
 */
class FacultyService
{
    protected NotificationService $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }
    /**
     * Create a new faculty member.
     */
    public function createFaculty($data)
    {
        $setupToken = Str::random(60);

        $result = DB::transaction(function () use ($data, $setupToken) {
            // Generate initial password: LastNameCCS
            $initialPassword = $data['last_name'] . 'CCS';

            // Create user account
            $user = User::create([
                'email' => $data['email'],
                'password' => Hash::make($initialPassword),
                'role' => 'faculty',
                'password_setup_token' => $setupToken,
                'status' => 'pending',
            ]);

            // Create faculty record
            $faculty = Faculty::create([
                'user_id' => $user->id,
                'title' => $data['title'] ?? null,
                'department_id' => $data['department_id'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'position' => $data['position'],
            ]);

            return $faculty->load('user', 'department');
        });

        // Send setup password notification AFTER transaction
        // Done outside so a mail failure doesn't roll back the faculty record
        try {
            $result->user->load('faculty');
            $result->user->notify(new SetupPasswordNotification($setupToken));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send setup email for faculty: ' . $e->getMessage(), [
                'faculty_id' => $result->id,
                'email' => $result->user->email ?? null,
            ]);
        }

        return $result;
    }

    /**
     * Get all students assigned to a faculty member.
     */
    public function getMyStudents($facultyId, array $filters = [])
    {
        $subjectFilter = trim((string) ($filters['subject'] ?? ''));
        $searchFilter = trim((string) ($filters['search'] ?? ''));
        $programFilter = trim((string) ($filters['program'] ?? ''));
        $sectionFilter = trim((string) ($filters['section'] ?? ''));

        $scheduleQuery = Schedule::where('faculty_id', $facultyId)
            ->with(['course', 'section'])
            ->whereHas('course', function ($query) use ($subjectFilter) {
                if ($subjectFilter !== '') {
                    $query->where('course_code', $subjectFilter);
                }
            });

        $schedules = $scheduleQuery->get();

        $sectionIds = $schedules->pluck('section_id')->unique();

        $subjects = $schedules->map(function ($s) {
            return [
                'id' => $s->course->id,
                'name' => $s->course->course_name,
                'code' => $s->course->course_code,
                'section_id' => $s->section_id,
                'section_name' => $s->section->section_name
            ];
        })->unique(function ($subject) {
            return $subject['code'] . '-' . $subject['section_id'];
        })->values();

        $studentsQuery = Student::whereIn('section_id', $sectionIds)
            ->with(['user', 'section', 'program', 'guardian', 'skills', 'organizations.organization'])
            ->whereHas('program', function ($query) use ($programFilter) {
                if ($programFilter !== '') {
                    $query->where('program_code', $programFilter);
                }
            })
            ->whereHas('section', function ($query) use ($sectionFilter) {
                if ($sectionFilter !== '') {
                    $query->where('section_name', $sectionFilter);
                }
            })
            ->when($searchFilter !== '', function ($query) use ($searchFilter) {
                $query->where(function ($inner) use ($searchFilter) {
                    $inner->where('first_name', 'like', "%{$searchFilter}%")
                        ->orWhere('last_name', 'like', "%{$searchFilter}%")
                        ->orWhere('middle_name', 'like', "%{$searchFilter}%")
                        ->orWhereHas('user', function ($userQuery) use ($searchFilter) {
                            $userQuery->where('email', 'like', "%{$searchFilter}%")
                                ->orWhere('student_number', 'like', "%{$searchFilter}%");
                        });
                });
            });

        $students = $studentsQuery->get();

        return [
            'students' => $students,
            'subjects' => $subjects,
        ];
    }

    /**
     * Get all violations reported by a faculty member.
     */
    public function getMyViolations($facultyId)
    {
        return StudentViolation::where('faculty_id', $facultyId)
            ->with(['student.user', 'student.section', 'student.program', 'course', 'actionByUser'])
            ->latest()
            ->get();
    }

    /**
     * Record violations for multiple students.
     */
    public function recordViolations($facultyId, $data)
    {
        $violations = [];
        $handledSchedules = Schedule::where('faculty_id', $facultyId)->get(['section_id', 'course_id']);
        $handledSectionIds = $handledSchedules->pluck('section_id')->filter()->unique();
        $handledCourseIds = $handledSchedules->pluck('course_id')->filter()->unique();

        $allowedStudentIds = Student::whereIn('section_id', $handledSectionIds)->pluck('id');
        $submittedStudentIds = collect($data['student_ids'])->map(fn($id) => (int) $id)->unique();

        $unauthorizedStudentIds = $submittedStudentIds->diff($allowedStudentIds);
        if ($unauthorizedStudentIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'student_ids' => ['One or more selected students are not in your handled sections.'],
            ]);
        }

        if (!empty($data['course_id']) && !$handledCourseIds->contains((int) $data['course_id'])) {
            throw ValidationException::withMessages([
                'course_id' => ['Selected subject is not in your assigned schedule.'],
            ]);
        }

        DB::transaction(function () use ($facultyId, $data, &$violations) {
            foreach ($data['student_ids'] as $studentId) {
                $violation = StudentViolation::create([
                    'student_id'    => $studentId,
                    'faculty_id'    => $facultyId,
                    'course_id'     => $data['course_id'] ?? null,
                    'violationType' => $data['violationType'],
                    'severity'      => $data['severity'],
                    'description'   => $data['description'],
                    'dateReported'  => $data['dateReported'] ?? now()->toDateString(),
                    'incident_time' => $data['incident_time'] ?? null,
                    'location'      => $data['location'] ?? null,
                    'status'        => 'Pending',
                ]);

                $violation->load('student.user');
                $this->notifications->violationReported($violation);

                $violations[] = $violation;
            }
        });

        return $violations;
    }

    /**
     * Resend password setup email to a pending faculty member.
     */
    public function resendSetupEmail($facultyId)
    {
        $faculty = Faculty::findOrFail($facultyId);
        $user = $faculty->user;

        if (!$user || $user->status !== 'pending') {
            throw new \Exception('Faculty account is already active or not found.');
        }

        $setupToken = Str::random(60);
        $user->update(['password_setup_token' => $setupToken]);

        try {
            $user->load('faculty');
            $user->notify(new SetupPasswordNotification($setupToken));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to resend setup email for faculty: ' . $e->getMessage(), [
                'faculty_id' => $faculty->id,
                'email' => $user->email ?? null,
            ]);
            // Token is already saved — user can still receive email via another resend attempt
        }

        return true;
    }

    /**
     * Update faculty information.
     * If position is set to 'Department Chair', also promote the user role.
     * If changed away from 'Department Chair', demote back to 'faculty'.
     */
    public function updateFaculty($facultyId, $data)
    {
        $faculty = Faculty::findOrFail($facultyId);

        $faculty->update([
            'title'        => $data['title'] ?? $faculty->title,
            'department_id'=> $data['department_id'],
            'position'     => $data['position'],
            'program_id'   => array_key_exists('program_id', $data) ? $data['program_id'] : $faculty->program_id,
        ]);

        // Sync user role with position
        if ($faculty->user) {
            if ($data['position'] === 'Department Chair') {
                $faculty->user->update(['role' => 'department_chair']);
            } elseif ($faculty->user->role === 'department_chair') {
                // Demote back to faculty if position is no longer Department Chair
                $faculty->user->update(['role' => 'faculty']);
            }
        }

        return $faculty->load('user', 'department', 'program');
    }

    /**
     * Archive a faculty member and revoke their access.
     */
    public function archiveFaculty($facultyId, $archivedByUserId)
    {
        return DB::transaction(function () use ($facultyId, $archivedByUserId) {
            $faculty = Faculty::findOrFail($facultyId);
            $user = $faculty->user;

            // Mark who archived this faculty
            $faculty->update(['archived_by' => $archivedByUserId]);

            // Soft delete faculty
            $faculty->delete();

            // Soft delete user and revoke all tokens
            if ($user) {
                $user->tokens()->delete();
                $user->delete();
            }

            return true;
        });
    }
}
