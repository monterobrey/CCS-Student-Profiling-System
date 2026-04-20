import React, { useMemo, useState } from "react";
import styles from "../../styles/Student/StudentSchedule.module.css";
import { useStudentSchedule } from "../../hooks/useStudentSchedule";

const StudentSchedule = () => {
  const cx = (...classKeys) =>
    classKeys
      .filter(Boolean)
      .map((k) => styles[k])
      .filter(Boolean)
      .join(" ");

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const { data: schedules = [], isLoading } = useStudentSchedule();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toMinutes = (timeValue) => {
    if (!timeValue) return -1;
    const [hours, minutes] = timeValue.slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Generate 30-min slots from 7:00 AM to 9:00 PM
  const slotRanges = useMemo(() => {    const slots = [];
    const START = 7 * 60;   // 7:00 AM in minutes
    const END   = 21 * 60;  // 9:00 PM in minutes
    for (let t = START; t < END; t += 30) {
      const fmtTime = (mins) => {
        const h24 = Math.floor(mins / 60);
        const m   = mins % 60;
        const suffix = h24 >= 12 ? "PM" : "AM";
        const h12  = h24 % 12 || 12;
        return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
      };
      slots.push({
        label: `${fmtTime(t)} - ${fmtTime(t + 30)}`,
        start: t,
        end:   t + 30,
      });
    }
    return slots;
  }, []);

  const now = new Date();
  const currentDay = days[now.getDay() - 1] || "";
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const stats = useMemo(() => {
    const total = new Set(schedules.map((s) => s.course_id)).size;
    const today = new Set(schedules.filter((s) => s.dayOfWeek === currentDay).map((s) => s.course_id)).size;
    const upcoming = schedules.filter(
      (s) => s.dayOfWeek === currentDay && toMinutes(s.startTime) > currentMinutes
    ).length;
    const morning = new Set(schedules.filter((s) => toMinutes(s.startTime) < 12 * 60).map((s) => s.course_id)).size;
    const afternoon = new Set(schedules.filter((s) => toMinutes(s.startTime) >= 12 * 60).map((s) => s.course_id)).size;
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

  const getFacultyName = (schedule) => {
    const f = schedule?.faculty;
    if (!f) return "TBA";
    if (f.user?.name) return f.user.name;
    const first = f.first_name || f.user?.first_name || "";
    const last = f.last_name || f.user?.last_name || "";
    return [first, last].filter(Boolean).join(" ") || "TBA";
  };

  const formatTime = (t) => {
    if (!t) return "—";
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  return (
    <div className={styles["faculty-page"]}>

      {/* Header */}
      <div className={styles["page-header"]}>
        <div>
          <h2 className={styles["page-title"]}>My Class Schedule</h2>
          <p className={styles["page-sub"]}>Your enrolled subjects and class times for this semester.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles["stats-grid"]}>
        <div className={cx("stat-card", "stat-card-blue")}>
          <div className={cx("stat-icon", "stat-icon-blue")}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M6 10h12M8 14h8M10 18h4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles["stat-content"]}>
            <span className={cx("stat-number", "stat-number-blue")}>{stats.total}</span>
            <span className={styles["stat-label"]}>TOTAL SUBJECTS</span>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-green")}>
          <div className={cx("stat-icon", "stat-icon-green")}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M8 7V3m8 4V3M5 10h14M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className={styles["stat-content"]}>
            <span className={cx("stat-number", "stat-number-green")}>{stats.today}</span>
            <span className={styles["stat-label"]}>TODAY'S CLASSES</span>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-purple")}>
          <div className={cx("stat-icon", "stat-icon-purple")}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5l3 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-number"]}>{stats.upcoming}</span>
            <span className={styles["stat-label"]}>UPCOMING</span>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-orange")}>
          <div className={cx("stat-icon", "stat-icon-orange")}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3v3M12 18v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M3 12h3M18 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className={styles["stat-content"]}>
            <span className={cx("stat-number", "stat-number-orange")}>{stats.morning}</span>
            <span className={styles["stat-label"]}>MORNING</span>
          </div>
        </div>

        <div className={cx("stat-card", "stat-card-red")}>
          <div className={cx("stat-icon", "stat-icon-red")}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3a9 9 0 1 0 9 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 7v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12a9 9 0 0 0-9-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className={styles["stat-content"]}>
            <span className={cx("stat-number", "stat-number-red")}>{stats.afternoon}</span>
            <span className={styles["stat-label"]}>AFTERNOON</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className={styles["calendar-card"]}>
        {isLoading ? (
          <div className={styles["loading-state"]}>
            <div className={styles["spinner"]} />
            <p>Loading your schedule...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className={styles["empty-state"]}>
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <rect x="6" y="8" width="36" height="34" rx="4" stroke="#e0d8d0" strokeWidth="2" />
              <path d="M16 4v8M32 4v8M6 18h36" stroke="#e0d8d0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p>No schedule assigned yet.</p>
            <span>Your class schedule will appear here once your section is assigned.</span>
          </div>
        ) : (
          <div className={styles["calendar-wrapper"]}>
            <div className={styles["calendar-grid"]}>
              {/* Header */}
              <div className={styles["time-header"]}></div>
              {days.map((day) => (
                <div
                  key={day}
                  className={cx("day-header", day === currentDay && "day-header-today")}
                >
                  {day}
                </div>
              ))}

              {/* Time Grid */}
              {slotRanges.map((slot, i) => (
                <React.Fragment key={i}>
                  <div className={styles["time-label"]}>
                    {slot.label}
                  </div>
                  {days.map((day, j) => {
                    const schedule = getScheduleForCell(day, slot);
                    const isStartSlot = isScheduleStartSlot(schedule, slot);
                    const slotSpan = getSlotSpan(schedule);
                    const palette = schedule ? getSubjectPalette(schedule) : null;
                    const subjectName = getSubjectName(schedule);
                    return (
                      <div
                        key={j}
                        className={cx(
                          "grid-cell",
                          schedule && !isStartSlot && "grid-cell-continuation"
                        )}
                        onClick={() => schedule && isStartSlot && setSelectedSchedule(schedule)}
                        style={{
                          cursor: schedule && isStartSlot ? "pointer" : "default",
                        }}
                        title={
                          schedule
                            ? `${schedule.course?.course_code || ""} | ${subjectName} | ${schedule.room || "TBA"}`
                            : ""
                        }
                      >
                        {schedule && isStartSlot && (
                          <div
                            className={cx("subject-chip", "subject-chip-block")}
                            style={{
                              height: `calc(${slotSpan} * 35px - 4px)`,
                              backgroundColor: palette?.bg,
                              borderColor: palette?.border,
                            }}
                          >
                            <div className={styles["subject-chip-code"]} style={{ color: palette?.code }}>
                              {schedule.course?.course_code || "SUBJECT"}
                            </div>
                            <div className={styles["subject-chip-name"]} style={{ color: palette?.text }}>
                              {subjectName}
                            </div>
                            <div className={styles["subject-chip-meta"]} style={{ color: palette?.meta }}>
                              {schedule.room || "TBA"}
                            </div>
                            <div className={styles["subject-chip-meta"]} style={{ color: palette?.meta }}>
                              {getFacultyName(schedule)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subject Detail Modal */}
      {selectedSchedule && (
        <div className={styles["modal-overlay"]} onClick={() => setSelectedSchedule(null)}>
          <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header-styled"]}>
              <div className={styles["modal-title-info"]}>
                <div className={styles["modal-course-badge"]}>Subject</div>
                <h3>{selectedSchedule?.course?.course_code || "—"}</h3>
                <p className={styles["modal-subtitle"]}>{getSubjectName(selectedSchedule)}</p>
              </div>
              <button className={styles["close-btn"]} onClick={() => setSelectedSchedule(null)}>
                &times;
              </button>
            </div>

            <div className={styles["modal-body-styled"]}>
              <table className={styles["students-table"]}>
                <tbody>
                  <tr>
                    <td className={styles["detail-key"]}>Day</td>
                    <td>{selectedSchedule.dayOfWeek || "—"}</td>
                  </tr>
                  <tr>
                    <td className={styles["detail-key"]}>Time</td>
                    <td>{formatTime(selectedSchedule.startTime)} – {formatTime(selectedSchedule.endTime)}</td>
                  </tr>
                  <tr>
                    <td className={styles["detail-key"]}>Room</td>
                    <td>{selectedSchedule.room || "TBA"}</td>
                  </tr>
                  <tr>
                    <td className={styles["detail-key"]}>Instructor</td>
                    <td>{getFacultyName(selectedSchedule)}</td>
                  </tr>
                  <tr>
                    <td className={styles["detail-key"]}>Section</td>
                    <td>{selectedSchedule.section?.section_name || "—"}</td>
                  </tr>
                  <tr>
                    <td className={styles["detail-key"]}>Type</td>
                    <td>
                      <span className={cx(
                        "status-badge",
                        selectedSchedule.class_type === "lab" ? "status-inactive" : "status-active"
                      )}>
                        <span className={styles.dot} />
                        {selectedSchedule.class_type === "lab" ? "Laboratory" : "Lecture"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles["modal-footer"]}>
              <button className={styles["modal-close-footer-btn"]} onClick={() => setSelectedSchedule(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentSchedule;
