import React, { useMemo, useState } from "react";
import styles from "../../styles/Faculty/FacultySchedule.module.css";
import { useFacultySchedule, useSectionStudents } from "../../hooks/useFacultySchedule";

const FacultySchedule = () => {
  const cx = (...classKeys) =>
    classKeys
      .filter(Boolean)
      .map((k) => styles[k])
      .filter(Boolean)
      .join(" ");

  const [selectedSection, setSelectedSection] = useState(null);
  const { data: schedules = [] } = useFacultySchedule();
  const { data: students = [], isLoading: loadingStudents } = useSectionStudents(selectedSection?.section_id);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toMinutes = (timeValue) => {
    if (!timeValue) return -1;
    const [hours, minutes] = timeValue.slice(0, 5).split(":").map(Number);
    return (hours * 60) + minutes;
  };

  const slotRanges = useMemo(() => {
    const slots = [];
    const START = 7 * 60;
    const END   = 21 * 60;
    const fmt = (mins) => {
      const h24    = Math.floor(mins / 60);
      const m      = mins % 60;
      const suffix = h24 >= 12 ? "PM" : "AM";
      const h12    = h24 % 12 || 12;
      return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
    };
    for (let t = START; t < END; t += 30) {
      slots.push({ label: `${fmt(t)} - ${fmt(t + 30)}`, start: t, end: t + 30 });
    }
    return slots;
  }, []);

  const now = new Date();
  const currentDay = days[now.getDay() - 1] || "";
  const currentMinutes = (now.getHours() * 60) + now.getMinutes();

  const stats = useMemo(() => {
    const total = schedules.length;
    const today = schedules.filter((s) => s.dayOfWeek === currentDay).length;
    const upcoming = schedules.filter((s) => s.dayOfWeek === currentDay && toMinutes(s.startTime) > currentMinutes).length;
    const morning = schedules.filter((s) => toMinutes(s.startTime) < 12 * 60).length;
    const afternoon = schedules.filter((s) => toMinutes(s.startTime) >= 12 * 60).length;
    return { total, today, upcoming, morning, afternoon };
  }, [schedules, currentDay, currentMinutes]);

  const getScheduleForCell = (day, slot) =>
    schedules.find((s) => {
      if (s.dayOfWeek !== day) return false;
      const start = toMinutes(s.startTime);
      const end = toMinutes(s.endTime);
      return start < slot.end && end > slot.start;
    });

  const isScheduleStartSlot = (schedule, slot) => {
    if (!schedule) return false;
    const start = toMinutes(schedule.startTime);
    return start >= slot.start && start < slot.end;
  };

  const getSlotSpan = (schedule) => {
    if (!schedule) return 1;
    const start = toMinutes(schedule.startTime);
    const end = toMinutes(schedule.endTime);
    const duration = Math.max(30, end - start);
    return Math.max(1, Math.ceil(duration / 30));
  };

  const getSubjectName = (schedule) =>
    schedule?.course?.course_name ||
    schedule?.course?.subject_name ||
    schedule?.course?.name ||
    "Untitled Subject";

  const subjectPalettes = [
    { bg: "#eff6ff", border: "#60a5fa", code: "#1d4ed8", text: "#1e3a8a", meta: "#1e40af" },
    { bg: "#f0fdf4", border: "#4ade80", code: "#15803d", text: "#14532d", meta: "#166534" },
    { bg: "#faf5ff", border: "#c084fc", code: "#7e22ce", text: "#581c87", meta: "#6b21a8" },
    { bg: "#fff7ed", border: "#fb923c", code: "#c2410c", text: "#7c2d12", meta: "#9a3412" },
    { bg: "#fef2f2", border: "#f87171", code: "#b91c1c", text: "#7f1d1d", meta: "#991b1b" },
    { bg: "#ecfeff", border: "#22d3ee", code: "#0e7490", text: "#164e63", meta: "#155e75" },
    { bg: "#fefce8", border: "#facc15", code: "#a16207", text: "#713f12", meta: "#854d0e" },
  ];

  const getSubjectPalette = (schedule) => {
    const key = `${schedule?.course?.course_code || ""}-${getSubjectName(schedule)}`;
    const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return subjectPalettes[hash % subjectPalettes.length];
  };

  return (
    <div className={styles["faculty-page"]}>
 
      {/* Header */}
      <div className={styles["page-header"]}>
        <div>
          <h2 className={styles["page-title"]}>My Teaching Schedule</h2>
          <p className={styles["page-sub"]}>
            View your assigned courses and enrolled students.
          </p>
        </div>
      </div>
 
      {/* Stats Cards */}
      <div className={styles["stats-grid"]}>

        <div className={cx("stat-card", "stat-card-blue")}>
          <div className={styles["stat-border"]} style={{ background: '#3b82f6' }} />
          <div className={styles["stat-card-content"]}>
            <div className={cx("stat-icon", "stat-icon-blue")} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M6 10h12M8 14h8M10 18h4" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles["stat-content"]}>
              <span className={cx("stat-number", "stat-number-blue")}>{stats.total}</span>
              <span className={styles["stat-label"]}>TOTAL CLASSES</span>
            </div>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-green")}>
          <div className={styles["stat-border"]} style={{ background: '#22c55e' }} />
          <div className={styles["stat-card-content"]}>
            <div className={cx("stat-icon", "stat-icon-green")} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M8 7V3m8 4V3M5 10h14M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles["stat-content"]}>
              <span className={cx("stat-number", "stat-number-green")}>{stats.today}</span>
              <span className={styles["stat-label"]}>TODAY'S CLASSES</span>
            </div>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-purple")}>
          <div className={styles["stat-border"]} style={{ background: '#a855f7' }} />
          <div className={styles["stat-card-content"]}>
            <div className={cx("stat-icon", "stat-icon-purple")} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5l3 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles["stat-content"]}>
              <span className={cx("stat-number", "stat-number-purple")}>{stats.upcoming}</span>
              <span className={styles["stat-label"]}>UPCOMING</span>
            </div>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-orange")}>
          <div className={styles["stat-border"]} style={{ background: '#f97316' }} />
          <div className={styles["stat-card-content"]}>
            <div className={cx("stat-icon", "stat-icon-orange")} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v1M4.22 4.22l.9.9M2 12h1M4.22 19.78l.9-.9M12 22v-1M19.78 19.78l.9-.9M22 12h-1M19.78 4.22l-.9.9" />
                <circle cx="12" cy="12" r="4" fill="none" />
              </svg>
            </div>
            <div className={styles["stat-content"]}>
              <span className={cx("stat-number", "stat-number-orange")}>{stats.morning}</span>
              <span className={styles["stat-label"]}>MORNING</span>
            </div>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-red")}>
          <div className={styles["stat-border"]} style={{ background: '#ef4444' }} />
          <div className={styles["stat-card-content"]}>
            <div className={cx("stat-icon", "stat-icon-red")} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
            <div className={styles["stat-content"]}>
              <span className={cx("stat-number", "stat-number-red")}>{stats.afternoon}</span>
              <span className={styles["stat-label"]}>AFTERNOON</span>
            </div>
          </div>
        </div>

      </div>
 
      {/* Calendar */}
      <div className={styles["calendar-card"]}>
        <div className={styles["calendar-wrapper"]}>
          {/* Outer table: time labels col + one col per day */}
          <div className={styles["cal-outer"]}>

            {/* Time label column */}
            <div className={styles["time-col"]}>
              {/* spacer for header row */}
              <div className={styles["time-col-header"]} />
              {slotRanges.map((slot, i) => (
                <div key={i} className={styles["time-label"]}>{slot.label}</div>
              ))}
            </div>

            {/* One column per day */}
            {days.map((day) => {
              // Collect schedules for this day, sorted by start time
              const daySchedules = schedules
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

              // Build rows: for each slot, either a schedule chip (spanning rows) or an empty cell
              const GRID_START = slotRanges[0].start;
              const rows = [];
              let slotIdx = 0;

              while (slotIdx < slotRanges.length) {
                const slot = slotRanges[slotIdx];
                const sched = daySchedules.find(
                  (s) => toMinutes(s.startTime) >= slot.start && toMinutes(s.startTime) < slot.end
                );

                if (sched) {
                  const span = getSlotSpan(sched);
                  const palette = getSubjectPalette(sched);
                  rows.push(
                    <div
                      key={`sched-${sched.id}-${slotIdx}`}
                      className={styles["day-sched-cell"]}
                      style={{ gridRow: `span ${span}` }}
                      onClick={() => setSelectedSection(sched)}
                      title={`${sched.course?.course_code || ""} | ${getSubjectName(sched)} | ${sched.section?.section_name || ""} | ${sched.room || "TBA"}`}
                    >
                      <div
                        className={styles["subject-chip"]}
                        style={{ backgroundColor: palette.bg, borderColor: palette.border }}
                      >
                        <div className={styles["subject-chip-code"]} style={{ color: palette.code }}>
                          {sched.course?.course_code || "SUBJECT"}
                        </div>
                        <div className={styles["subject-chip-name"]} style={{ color: palette.text }}>
                          {getSubjectName(sched)}
                        </div>
                        <div className={styles["subject-chip-meta"]} style={{ color: palette.meta }}>
                          {sched.section?.section_name || "No Section"}
                        </div>
                        <div className={styles["subject-chip-meta"]} style={{ color: palette.meta }}>
                          {sched.room || "TBA"}
                        </div>
                      </div>
                    </div>
                  );
                  slotIdx += span;
                } else {
                  rows.push(
                    <div key={`empty-${slotIdx}`} className={styles["day-empty-cell"]} />
                  );
                  slotIdx += 1;
                }
              }

              return (
                <div key={day} className={styles["day-col"]}>
                  <div className={cx("day-header", day === currentDay && "day-header-today")}>
                    {day}
                  </div>
                  <div className={styles["day-col-body"]}>
                    {rows}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
 
      {/* Modal */}
      {selectedSection && (
        <div className={styles["modal-overlay"]} onClick={() => setSelectedSection(null)}>
          <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header-styled"]}>
              <div className={styles["modal-title-info"]}>
                <div className={styles["modal-course-badge"]}>Course</div>
                <h3>{selectedSection?.course?.course_code || ""}</h3>
                <p className={styles["modal-subtitle"]}>{selectedSection?.section?.section_name || ""}</p>
              </div>
              <button className={styles["close-btn"]} onClick={() => setSelectedSection(null)}>
                &times;
              </button>
            </div>

            <div className={styles["modal-student-count"]}>{students.length} enrolled students</div>

            <div className={styles["modal-body-styled"]}>
              <table className={styles["students-table"]}>
                <thead>
                  <tr>
                    <th>Student Number</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={3}>Loading students...</td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No students found.</td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td className={styles["student-num"]}>{student.user?.student_number || student.student_number || "N/A"}</td>
                        <td>{student.user?.name || `${student.user?.first_name || ""} ${student.user?.last_name || ""}`.trim() || "N/A"}</td>
                        <td>
                          <span className={cx(
                            "status-badge",
                            student.status === "Inactive" ? "status-inactive" : "status-active"
                          )}>
                            <span className={styles.dot} />
                            {student.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles["modal-footer"]}>
              <button className={styles["modal-close-footer-btn"]} onClick={() => setSelectedSection(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultySchedule;