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
          <div className="stat-icon stat-icon-blue"></div>
          <div className="stat-content">
            <span className="stat-number stat-number-blue">{stats.total}</span>
            <span className="stat-label">TOTAL CLASSES</span>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon stat-icon-green"></div>
          <div className="stat-content">
            <span className="stat-number stat-number-green">{stats.today}</span>
            <span className="stat-label">TODAY'S CLASSES</span>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon stat-icon-purple"></div>
          <div className="stat-content">
            <span className="stat-number">{stats.upcoming}</span>
            <span className="stat-label">UPCOMING</span>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon stat-icon-orange"></div>
          <div className="stat-content">
            <span className="stat-number stat-number-orange">{stats.morning}</span>
            <span className="stat-label">MORNING</span>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-icon stat-icon-red"></div>
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
                          <div className="subject-chip-code" style={{ color: palette?.code }}>
                            {schedule.course?.course_code || "SUBJECT"}
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
                <h3>{selectedSection.course?.course_code || ""}</h3>
                <p className="modal-subtitle">{selectedSection.section?.section_name || ""}</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedSection(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body-styled">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student Number</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
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
                        <td>{student.student_number || "N/A"}</td>
                        <td>{student.user?.name || `${student.user?.first_name || ""} ${student.user?.last_name || ""}`.trim() || "N/A"}</td>
                        <td>{student.status || "Active"}</td>
                        <td className="text-right">-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FacultySchedule;