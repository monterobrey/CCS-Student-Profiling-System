import React, { useMemo, useState } from "react";
import "../../styles/Faculty/FacultySchedule.css";
import { useFacultySchedule, useSectionStudents } from "../../hooks/useFacultySchedule";

const FacultySchedule = () => {
  const [selectedSection, setSelectedSection] = useState(null);
  const { data: schedules = [] } = useFacultySchedule();
  const { data: students = [], isLoading: loadingStudents } = useSectionStudents(selectedSection?.section_id);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const timeLabels = [
    "7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM",
    "10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM",
    "1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
    "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM",
    "7:00 PM","7:30 PM","8:00 PM","8:30 PM"
  ];

  const toMinutes = (timeValue) => {
    if (!timeValue) return -1;
    const [hours, minutes] = timeValue.slice(0, 5).split(":").map(Number);
    return (hours * 60) + minutes;
  };

  const slotRanges = useMemo(
    () =>
      timeLabels.map((label) => {
        const [time, suffix] = label.split(" ");
        const [rawHour, rawMinute] = time.split(":").map(Number);
        let hour = rawHour % 12;
        if (suffix === "PM") hour += 12;
        const minute = rawMinute;
        const start = (hour * 60) + minute;
        return { label, start, end: start + 30 };
      }),
    [timeLabels]
  );

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
    { bg: "#dbeafe", border: "#3b82f6", code: "#1d4ed8", text: "#1e40af", meta: "#3b82f6", icon: "#2563eb" },
    { bg: "#dcfce7", border: "#22c55e", code: "#15803d", text: "#166534", meta: "#22c55e", icon: "#16a34a" },
    { bg: "#f3e8ff", border: "#a855f7", code: "#7e22ce", text: "#6b21a8", meta: "#a855f7", icon: "#9333ea" },
    { bg: "#ffedd5", border: "#fb923c", code: "#c2410c", text: "#9a3412", meta: "#fb923c", icon: "#ea580c" },
    { bg: "#fee2e2", border: "#ef4444", code: "#b91c1c", text: "#991b1b", meta: "#ef4444", icon: "#dc2626" },
    { bg: "#cffafe", border: "#06b6d4", code: "#0e7490", text: "#155e75", meta: "#06b6d4", icon: "#0891b2" },
    { bg: "#fef9c3", border: "#eab308", code: "#a16207", text: "#713f12", meta: "#eab308", icon: "#ca8a04" },
    { bg: "#fce7f3", border: "#ec4899", code: "#be185d", text: "#831843", meta: "#ec4899", icon: "#db2777" },
    { bg: "#e0e7ff", border: "#6366f1", code: "#4338ca", text: "#3730a3", meta: "#6366f1", icon: "#4f46e5" },
    { bg: "#d1fae5", border: "#14b8a6", code: "#0f766e", text: "#115e59", meta: "#14b8a6", icon: "#0d9488" },
  ];

  const getSubjectPalette = (schedule) => {
    const key = `${schedule?.course?.course_code || ""}-${getSubjectName(schedule)}`;
    const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return subjectPalettes[hash % subjectPalettes.length];
  };

  return (
    <div className="faculty-page">
 
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Teaching Schedule</h2>
          <p className="page-sub">
            View your assigned courses and enrolled students.
          </p>
        </div>
      </div>
 
      {/* Stats Cards */}
      <div className="stats-grid">

        <div className="stat-card stat-card-blue">
          <div className="stat-icon stat-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-blue">{stats.total}</span>
            <span className="stat-label">TOTAL CLASSES</span>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon stat-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-green">{stats.today}</span>
            <span className="stat-label">TODAY'S CLASSES</span>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon stat-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.upcoming}</span>
            <span className="stat-label">UPCOMING</span>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon stat-icon-orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
              <path d="M12 2v10"/>
              <path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-orange">{stats.morning}</span>
            <span className="stat-label">MORNING</span>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-icon stat-icon-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-red">{stats.afternoon}</span>
            <span className="stat-label">AFTERNOON</span>
          </div>
        </div>

      </div>
 
      {/* Calendar */}
      <div className="calendar-card">
        <div className="calendar-wrapper">
          <div className="calendar-grid">

            {/* Header */}
            <div className="time-header"></div>
            {days.map((day) => (
              <div key={day} className="day-header">{day}</div>
            ))}

            {/* Time Grid */}
            {slotRanges.map((slot, i) => (
              <React.Fragment key={i}>
                <div className="time-label">{slot.label}</div>
                {days.map((day, j) => {
                  const schedule = getScheduleForCell(day, slot);
                  const isStartSlot = isScheduleStartSlot(schedule, slot);
                  const slotSpan = getSlotSpan(schedule);
                  const palette = schedule ? getSubjectPalette(schedule) : null;
                  const subjectName = getSubjectName(schedule);
                  return (
                    <div
                      key={j}
                      className={`grid-cell ${schedule && !isStartSlot ? "grid-cell-continuation" : ""}`}
                      onClick={() => schedule && setSelectedSection(schedule)}
                      style={{
                        backgroundColor: schedule && isStartSlot ? palette?.bg : undefined,
                        cursor: schedule ? "pointer" : "default",
                      }}
                      title={
                        schedule
                          ? `${schedule.course?.course_code || ""} | ${subjectName} | ${schedule.section?.section_name || "No Section"} | ${schedule.room || "TBA"}`
                          : ""
                      }
                    >
                      {schedule && isStartSlot && (
                        <div
                          className="subject-chip subject-chip-block"
                          style={{
                            height: `calc(${slotSpan} * 35px - 4px)`,
                            backgroundColor: palette?.bg,
                            borderColor: palette?.border,
                          }}
                        >
                          <div className="subject-chip-header">
                            <svg className="subject-chip-icon" viewBox="0 0 16 16" fill="none" stroke={palette?.icon} strokeWidth="1.5">
                              <path d="M2 4.5A1.5 1.5 0 013.5 3H12.5A1.5 1.5 0 0114 4.5v10a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 14.5v-10z"/>
                            </svg>
                            <div className="subject-chip-code" style={{ color: palette?.code }}>
                              {schedule.course?.course_code || "SUBJECT"}
                            </div>
                          </div>
                          <div className="subject-chip-name" style={{ color: palette?.text }}>
                            {subjectName}
                          </div>
                          <div className="subject-chip-meta" style={{ color: palette?.meta }}>
                            {schedule.section?.section_name || "No Section"}
                          </div>
                          <div className="subject-chip-meta" style={{ color: palette?.meta }}>
                            {schedule.room || "TBA"}
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
      </div>
 
      {/* Modal */}
      {selectedSection && (
        <div className="modal-overlay" onClick={() => setSelectedSection(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-styled">
              <div className="modal-title-info">
                <div className="modal-course-badge">Course</div>
                <h3>{selectedSection?.course?.course_code || ""}</h3>
                <p className="modal-subtitle">{selectedSection?.section?.section_name || ""}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedSection(null)}>
                &times;
              </button>
            </div>

            <div className="modal-student-count">{students.length} enrolled students</div>

            <div className="modal-body-styled">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student Number</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={4}>Loading students...</td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No students found.</td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td className="student-num">{student.user?.student_number || student.student_number || "N/A"}</td>
                        <td>{student.user?.name || `${student.user?.first_name || ""} ${student.user?.last_name || ""}`.trim() || "N/A"}</td>
                        <td>
                          <span className={`status-badge ${student.status === "Inactive" ? "status-inactive" : "status-active"}`}>
                            <span className="dot" />
                            {student.status || "Active"}
                          </span>
                        </td>
                        <td>
                          <button className="report-btn" type="button">
                            Report violation
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="modal-close-footer-btn" onClick={() => setSelectedSection(null)}>
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