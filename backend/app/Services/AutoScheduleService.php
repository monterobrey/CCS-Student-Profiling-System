<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Curriculum;
use App\Models\Section;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Program;
use App\Models\Faculty;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AutoScheduleService
{
    private $operatingStart    = '07:30';
    private $operatingEnd      = '18:30';
    private $slotIncrement     = 30; // minutes
    private $studentsPerSection = 50;

    /**
     * Maps skill_category values (from faculty_expertise) to course code prefixes
     * and keywords found in course names. Used to score faculty–course matches.
     *
     * Priority: exact course_code prefix match > keyword in course name > category fallback
     */
    private array $categoryMap = [
        'Programming' => [
            'codes'    => ['CCS102','CCS103','CCS107','CCS108','ITP102','ITP107'],
            'keywords' => [
                'programming','algorithm','data structure','object','integrative','computing',
                'java','python','c++','c#','javascript','typescript','kotlin','swift',
                'discrete','object-oriented',
            ],
        ],
        'Database' => [
            'codes'    => ['CCS110','ITP104'],
            'keywords' => [
                'database','information management','data','sql',
                'mysql','postgresql','mongodb','oracle','redis','analytics',
                'warehousing','normalization',
            ],
        ],
        'Networking' => [
            'codes'    => ['CCS111','ITP105'],
            'keywords' => [
                'network','communication','tcp','cisco',
                'wireless','vpn','firewall','cloud networking',
            ],
        ],
        'Web Development' => [
            'codes'    => ['ITEW1','ITEW2','ITEW3','ITEW4','ITEW5','ITEW6','ITP110'],
            'keywords' => [
                'web','electronic commerce','scripting','responsive','framework',
                'react','vue','angular','laravel','node','django','graphql',
                'html','css','rest api','server-side','client-side',
            ],
        ],
        'Mobile Development' => [
            'codes'    => ['ITP107'],
            'keywords' => [
                'mobile','android','flutter','ios','swift','kotlin',
                'react native','cross-platform','app development',
            ],
        ],
        'Systems' => [
            'codes'    => ['CCS109','ITP103','ITP106','ITP109','ITP111','CCS112'],
            'keywords' => [
                'system','analysis','design','integration','architecture',
                'platform','administration','emerging','hci','human computer',
                'infrastructure','operating system',
            ],
        ],
        'Security' => [
            'codes'    => ['CCS113'],
            'keywords' => [
                'security','assurance','information assurance',
                'ethical hacking','penetration','cryptography',
                'cybersecurity','forensics','secure software',
            ],
        ],
        'Mathematics' => [
            'codes'    => ['MAT101','CCS104','ITP101'],
            'keywords' => [
                'mathematics','discrete','quantitative','statistics',
                'linear algebra','calculus','numerical','probability',
            ],
        ],
        'Research' => [
            'codes'    => ['ITP108','ITP112'],
            'keywords' => [
                'capstone','research','thesis','practicum',
                'technical writing','project management','supervision',
            ],
        ],
        'Management' => [
            'codes'    => ['TEC101','ENT101'],
            'keywords' => [
                'technopreneurship','entrepreneurship','management','project',
                'agile','scrum','governance','business analysis',
            ],
        ],
        'General Education' => [
            'codes'    => ['ETH101','COM101','GAD101','PSY100','HIS101','SOC101','STS101','HMN101','ENV101','RIZ101','NSTP1','NSTP2','PED101','PED102','PED103','PED104','ACT101'],
            'keywords' => [
                'ethics','communication','gender','self','history','contemporary',
                'science technology','art','environment','rizal','nstp',
                'physical education','accounting','professional issues','professional ethics',
            ],
        ],
    ];

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate schedules for a specific program, year level, and semester.
     */
    public function generate(int $programId, string $yearLevel, string $semester)
    {
        $program = Program::findOrFail($programId);

        // 1. Ensure sections exist
        $sectionInfo = $this->ensureSectionsExist($program, $yearLevel);

        $sections = Section::where('program_id', $programId)
            ->where('year_level', $yearLevel)
            ->get();

        $curriculum = Curriculum::where('program_id', $programId)
            ->where('year_level', $yearLevel)
            ->where('semester', $semester)
            ->with('course')
            ->get();

        if ($curriculum->isEmpty()) {
            throw new \Exception("No curriculum found for this program, year, and semester.");
        }

        // 2. Load all active faculty with their expertise (eager-loaded once)
        $allFaculty = Faculty::with('expertise')
            ->whereNull('deleted_at')
            ->get();

        // 3. Assign unique vacant days to sections
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $sectionVacantDays = [];
        foreach ($sections as $index => $section) {
            $sectionVacantDays[$section->id] = $days[$index % 6];
        }

        // 4. Sort subjects: lab first (harder to place), then by total units
        $sortedCurriculum = $curriculum->sortByDesc(function ($item) {
            return ($item->course->lab_units * 10) + $item->course->units;
        });

        // 5. Track faculty load ONLY for the current semester being generated.
        //    Pre-seed with units already assigned in OTHER semesters so we don't
        //    double-count, but we DO want to know their existing cross-semester load
        //    for tiebreaking. Slots are only tracked within this generation run.
        $existingLoadBySemester = Schedule::whereIn('faculty_id', $allFaculty->pluck('id'))
            ->where('schedules.semester', '!=', $semester)
            ->whereNotNull('faculty_id')
            ->join('courses', 'schedules.course_id', '=', 'courses.id')
            ->selectRaw('faculty_id, SUM(courses.units) as total_units')
            ->groupBy('faculty_id')
            ->pluck('total_units', 'faculty_id')
            ->toArray();

        // facultyLoad starts with their OTHER-semester load as a baseline for tiebreaking
        $facultyLoad  = $allFaculty->pluck('id')->mapWithKeys(fn($id) => [
            $id => (int) ($existingLoadBySemester[$id] ?? 0)
        ])->toArray();

        // facultySlots only tracks THIS generation run (current semester)
        $facultySlots = $allFaculty->pluck('id')->mapWithKeys(fn($id) => [$id => []])->toArray();

        // Pre-load existing slots from OTHER semesters so faculty conflict check
        // prevents double-booking across semesters
        $existingSlots = Schedule::whereIn('faculty_id', $allFaculty->pluck('id'))
            ->whereNotNull('faculty_id')
            ->select('faculty_id', 'dayOfWeek', 'startTime', 'endTime')
            ->get();

        foreach ($existingSlots as $slot) {
            $fid = $slot->faculty_id;
            if (isset($facultySlots[$fid])) {
                $facultySlots[$fid][] = [
                    'day'   => $slot->dayOfWeek,
                    'start' => $slot->startTime,
                    'end'   => $slot->endTime,
                ];
            }
        }

        $generatedSchedules = [];
        $conflicts          = [];

        DB::beginTransaction();
        try {
            Schedule::whereIn('section_id', $sections->pluck('id'))
                ->where('semester', $semester)
                ->delete();

            foreach ($sections as $section) {
                $vacantDay = $sectionVacantDays[$section->id];

                foreach ($sortedCurriculum as $item) {
                    $course = $item->course;

                    // Determine the best faculty for this course
                    $matchedFaculty = $this->matchFaculty($course, $allFaculty, $facultyLoad);

                    if ($course->lab_units > 0) {
                        $placed = $this->placeSubject(
                            $section, $course, 'lab', $course->lab_units,
                            $vacantDay, $generatedSchedules,
                            $matchedFaculty, $facultyLoad, $facultySlots,
                            $semester
                        );
                        if (!$placed) {
                            $conflicts[] = "Could not place Lab for {$course->course_code} ({$course->lab_units} units) in {$section->section_name}";
                        }
                    }

                    if ($course->lec_units > 0) {
                        $placed = $this->placeSubject(
                            $section, $course, 'lec', $course->lec_units,
                            $vacantDay, $generatedSchedules,
                            $matchedFaculty, $facultyLoad, $facultySlots,
                            $semester
                        );
                        if (!$placed) {
                            $conflicts[] = "Could not place Lec for {$course->course_code} ({$course->lec_units} units) in {$section->section_name}";
                        }
                    }
                }
            }

            if (!empty($conflicts)) {
                DB::rollBack();
                return ['success' => false, 'conflicts' => $conflicts];
            }

            DB::commit();
            return [
                'success'       => true,
                'schedules'     => $generatedSchedules,
                'student_count' => $sectionInfo['student_count'],
                'section_count' => $sections->count(),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FACULTY MATCHING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Find the best faculty for a course based on expertise match.
     *
     * Scoring:
     *   3 pts — faculty has an expertise entry whose skill_category matches the course category
     *   2 pts — faculty has a skillName keyword that appears in the course name
     *   1 pt  — fallback (least loaded faculty)
     *
     * Among equally scored faculty, prefer the one with the lowest current load.
     */
    private function matchFaculty(Course $course, $allFaculty, array $facultyLoad): ?Faculty
    {
        if ($allFaculty->isEmpty()) return null;

        $courseCategory = $this->getCourseCategory($course);
        $courseNameLower = strtolower($course->course_name);

        $scored = $allFaculty->map(function (Faculty $f) use ($courseCategory, $courseNameLower, $facultyLoad) {
            $score = 0;

            foreach ($f->expertise as $exp) {
                // Category match (strongest signal)
                if ($courseCategory && strtolower($exp->skill_category) === strtolower($courseCategory)) {
                    $score = max($score, 3);
                }

                // Keyword match in course name
                $keywords = array_map('trim', explode(',', strtolower($exp->skillName)));
                foreach ($keywords as $kw) {
                    if ($kw !== '' && str_contains($courseNameLower, $kw)) {
                        $score = max($score, 2);
                    }
                }
            }

            return [
                'faculty' => $f,
                'score'   => $score,
                'load'    => $facultyLoad[$f->id] ?? 0,
            ];
        });

        // Sort: highest score first, then lowest load as tiebreaker
        $best = $scored->sortBy([
            ['score', 'desc'],
            ['load',  'asc'],
        ])->first();

        return $best ? $best['faculty'] : null;
    }

    /**
     * Determine the skill_category for a course using the categoryMap.
     * Returns null if no match found (will fall back to least-loaded faculty).
     */
    private function getCourseCategory(Course $course): ?string
    {
        $code        = strtoupper($course->course_code);
        $nameLower   = strtolower($course->course_name);

        foreach ($this->categoryMap as $category => $rules) {
            // Exact course code match
            if (in_array($code, $rules['codes'], true)) {
                return $category;
            }
            // Keyword in course name
            foreach ($rules['keywords'] as $kw) {
                if (str_contains($nameLower, $kw)) {
                    return $category;
                }
            }
        }

        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEDULING
    // ─────────────────────────────────────────────────────────────────────────

    private function placeSubject(
        $section, $course, $type, $units, $vacantDay,
        &$generatedSchedules,
        ?Faculty $preferredFaculty,
        array &$facultyLoad,
        array &$facultySlots,
        string $semester
    ) {
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        $patterns = [];
        if ($type === 'lab') {
            $patterns = [['days' => 1, 'hoursPerMeeting' => $units]];
        } else {
            if ($units == 3) {
                $patterns = [
                    ['days' => 2, 'hoursPerMeeting' => 1.5],
                    ['days' => 3, 'hoursPerMeeting' => 1],
                ];
            } elseif ($units == 2) {
                $patterns = [
                    ['days' => 1, 'hoursPerMeeting' => 2],
                    ['days' => 2, 'hoursPerMeeting' => 1],
                ];
            } else {
                $patterns = [['days' => 1, 'hoursPerMeeting' => $units]];
            }
        }

        foreach ($patterns as $pattern) {
            $validDays = array_filter($days, fn($d) => $d !== $vacantDay);

            $dayGroups = [];
            if ($pattern['days'] === 3) {
                $dayGroups = [['Monday', 'Wednesday', 'Friday']];
            } elseif ($pattern['days'] === 2) {
                $dayGroups = [['Tuesday', 'Thursday'], ['Monday', 'Wednesday'], ['Wednesday', 'Friday']];
            } else {
                foreach ($validDays as $d) $dayGroups[] = [$d];
            }

            foreach ($dayGroups as $group) {
                if (count(array_intersect($group, [$vacantDay])) > 0) continue;

                $time     = Carbon::createFromFormat('H:i', $this->operatingStart);
                $endLimit = Carbon::createFromFormat('H:i', $this->operatingEnd);

                while ($time->copy()->addMinutes($pattern['hoursPerMeeting'] * 60)->lte($endLimit)) {
                    $startTime = $time->format('H:i');
                    $endTime   = $time->copy()->addMinutes($pattern['hoursPerMeeting'] * 60)->format('H:i');

                    // Check section slot availability
                    if (!$this->isValidSlot($section, $group, $startTime, $endTime, $generatedSchedules)) {
                        $time->addMinutes($this->slotIncrement);
                        continue;
                    }

                    // Find a faculty that is free during this slot
                    $assignedFaculty = $this->findAvailableFaculty(
                        $preferredFaculty, $group, $startTime, $endTime, $facultySlots
                    );

                    // Place the schedule
                    foreach ($group as $day) {
                        $sched = Schedule::create([
                            'section_id' => $section->id,
                            'course_id'  => $course->id,
                            'semester'   => $semester,
                            'class_type' => $type,
                            'dayOfWeek'  => $day,
                            'startTime'  => $startTime,
                            'endTime'    => $endTime,
                            'room'       => $type === 'lab' ? 'Laboratory' : 'Lecture Room',
                            'faculty_id' => $assignedFaculty?->id,
                        ]);
                        $generatedSchedules[] = $sched;
                    }

                    // Update faculty tracking
                    if ($assignedFaculty) {
                        $facultyLoad[$assignedFaculty->id] = ($facultyLoad[$assignedFaculty->id] ?? 0) + $units;
                        foreach ($group as $day) {
                            $facultySlots[$assignedFaculty->id][] = [
                                'day'   => $day,
                                'start' => $startTime,
                                'end'   => $endTime,
                            ];
                        }
                    }

                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Find a faculty member who is free during the given days/time.
     * Prefers the preferred faculty; falls back to any available faculty.
     */
    private function findAvailableFaculty(
        ?Faculty $preferred,
        array $days,
        string $start,
        string $end,
        array &$facultySlots
    ): ?Faculty {
        // Try preferred first
        if ($preferred && $this->isFacultyFree($preferred->id, $days, $start, $end, $facultySlots)) {
            return $preferred;
        }

        // Preferred is busy — return null (slot still gets placed, just without faculty)
        // The chair can manually assign later via the Assign Faculty button
        return null;
    }

    /**
     * Check if a faculty member has no conflicting slot on any of the given days.
     */
    private function isFacultyFree(int $facultyId, array $days, string $start, string $end, array &$facultySlots): bool
    {
        $slots = $facultySlots[$facultyId] ?? [];
        foreach ($days as $day) {
            foreach ($slots as $slot) {
                if ($slot['day'] === $day && $this->overlaps($slot['start'], $slot['end'], $start, $end)) {
                    return false;
                }
            }
        }
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    private function ensureSectionsExist(Program $program, string $yearLevel)
    {
        DB::statement("UPDATE students s JOIN sections sec ON s.section_id = sec.id SET s.year_level = sec.year_level WHERE s.year_level IS NULL");

        $studentCount = Student::where('program_id', $program->id)
            ->where(function ($q) use ($yearLevel) {
                $q->where('year_level', $yearLevel)
                  ->orWhere('year_level', 'LIKE', $yearLevel . '%');
            })
            ->count();

        if ($studentCount === 0) {
            $unassignedCount = Student::where('program_id', $program->id)->whereNull('year_level')->count();
            if ($unassignedCount > 0) {
                $studentCount = $unassignedCount;
                Student::where('program_id', $program->id)->whereNull('year_level')->update(['year_level' => $yearLevel]);
            }
        }

        $neededCount      = max(4, ceil($studentCount / $this->studentsPerSection));
        $existingSections = Section::where('program_id', $program->id)
            ->where('year_level', $yearLevel)
            ->orderBy('section_name', 'asc')
            ->get();

        for ($i = $existingSections->count(); $i < $neededCount; $i++) {
            $letter = chr(65 + $i);
            Section::create([
                'program_id'    => $program->id,
                'department_id' => $program->department_id,
                'section_name'  => "{$program->program_code} {$yearLevel}-{$letter}",
                'year_level'    => $yearLevel,
                'school_year'   => date('Y') . '-' . (date('Y') + 1),
            ]);
        }

        $allSections = Section::where('program_id', $program->id)
            ->where('year_level', $yearLevel)
            ->orderBy('section_name', 'asc')
            ->get();

        return [
            'student_count' => $studentCount,
            'section_count' => $allSections->count(),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SLOT VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    private function isValidSlot($section, $days, $start, $end, $generatedSchedules)
    {
        foreach ($days as $day) {
            $exists = Schedule::where('section_id', $section->id)
                ->where('dayOfWeek', $day)
                ->where(function ($q) use ($start, $end) {
                    $q->where('startTime', '<', $end)->where('endTime', '>', $start);
                })->exists();

            if ($exists) return false;

            $overlap = array_filter($generatedSchedules, function ($s) use ($section, $day, $start, $end) {
                return $s->section_id === $section->id
                    && $s->dayOfWeek  === $day
                    && $this->overlaps($s->startTime, $s->endTime, $start, $end);
            });

            if (!empty($overlap)) return false;
        }

        return true;
    }

    private function overlaps($s1, $e1, $s2, $e2): bool
    {
        return max($s1, $s2) < min($e1, $e2);
    }
}
