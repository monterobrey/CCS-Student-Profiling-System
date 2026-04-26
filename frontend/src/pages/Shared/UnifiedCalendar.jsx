import React, { useMemo, useState } from "react";
import styles from "../../styles/Shared/UnifiedCalendar.module.css";
import { useAuth, ROLES } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { awardService } from "../../services/awardService";
import { studentService } from "../../services/studentService";
import { violationService } from "../../services/violationService";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CalendarIcon = () => (
  <svg
    className={styles.placeholderIcon}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2.5" />
    <line x1="16" y1="6" x2="16" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="6" x2="32" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="14" y="26" width="6" height="5" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="24" y="26" width="6" height="5" rx="1" fill="currentColor" opacity="0.4" />
  </svg>
);

const eventTypes = {
  event:    { label: "Event",    color: "#10b981" },
  activity: { label: "Activity", color: "#f59e0b" },
  meeting:  { label: "Meeting",  color: "#8b5cf6" },
};

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const UnifiedCalendar = () => {
  const { role } = useAuth();
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "event",
  });

  // ── Data fetching ────────────────────────────────────────────────
  const { data: awards = [], isLoading: isLoadingAwards } = useQuery({
    queryKey: ["unified-calendar-awards", role],
    queryFn: async () => {
      if (role === ROLES.STUDENT) {
        const res = await awardService.getMyAwards();
        return res.ok ? (res.data ?? []) : [];
      } else if (role === ROLES.FACULTY) {
        const res = await awardService.getFacultyAwards();
        return res.ok ? (res.data ?? []) : [];
      } else {
        const res = await awardService.getAll();
        return res.ok ? (res.data ?? []) : [];
      }
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const res = await studentService.getProfile();
      return res.ok ? res.data : null;
    },
    enabled: role === ROLES.STUDENT,
  });

  const { data: violations = [] } = useQuery({
    queryKey: ["unified-calendar-violations", role],
    queryFn: async () => {
      if (role === ROLES.STUDENT) {
        const res = await violationService.getMyViolations();
        return res.ok ? (res.data ?? []) : [];
      } else if (role === ROLES.FACULTY) {
        const res = await violationService.getMyViolations();
        return res.ok ? (res.data ?? []) : [];
      } else {
        const res = await violationService.getAll();
        return res.ok ? (res.data ?? []) : [];
      }
    },
  });

  const isLoading = isLoadingAwards;

  // ── Event transformation ─────────────────────────────────────────
  const events = useMemo(() => {
    const unified = [];

    awards.forEach((award) => {
      if (award.created_at || award.date_given) {
        unified.push({
          id: `award-${award.id}`,
          title: award.title || "Award/Recognition",
          date: new Date(award.created_at || award.date_given),
          startTime: "00:00",
          endTime: "23:59",
          type: "event",
          location: "CCS Department",
          description: award.description || "Award ceremony or recognition event",
        });
      }
    });

    if (profile?.organizations && role === ROLES.STUDENT) {
      profile.organizations.forEach((aff) => {
        if (aff.joined_at) {
          unified.push({
            id: `affiliation-${aff.id}`,
            title: `${aff.organization?.organization_name || "Organization"} – ${aff.role || "Member"}`,
            date: new Date(aff.joined_at),
            startTime: "00:00",
            endTime: "23:59",
            type: "activity",
            location: "Campus",
            description: aff.organization?.description || "Organization affiliation",
          });
        }
      });
    }

    violations.forEach((v) => {
      if (v.created_at && (v.status === "resolved" || v.status === "dismissed")) {
        unified.push({
          id: `meeting-${v.id}`,
          title: v.title || "Resolved Violation",
          date: new Date(v.created_at),
          startTime: "00:00",
          endTime: "23:59",
          type: "meeting",
          location: "CCS Department",
          description: v.description || "Resolved violation record",
        });
      }
    });

    return unified;
  }, [awards, profile, violations, role]);

  // ── Calendar helpers ─────────────────────────────────────────────
  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return {
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      startingDayOfWeek: new Date(year, month, 1).getDay(),
    };
  }, [currentDate]);

  const getEventsForDay = (day) => {
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
    });
  };

  const isToday = (day) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  const navigateMonth = (dir) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + dir);
      return d;
    });
  };

  // ── Modal helpers ────────────────────────────────────────────────
  const openModal = (prefillDate = "") => {
    setFormData({
      title: "",
      description: "",
      date: prefillDate || new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      type: "event",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: implement actual event creation
    console.log("Form submitted:", formData);
    closeModal();
  };

  // Build calendar day array
  const calendarDays = [
    ...Array(startingDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={styles.unifiedCalendarPage}>

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleBlock}>
          <h1 className={styles.pageTitle}>Activity Calendar</h1>
          <p className={styles.pageSubtitle}>Track events, activities, and meetings across the semester</p>
        </div>

        <div className={styles.pageActions}>
          {/* Legend */}
          <div className={styles.legendItems}>
            {Object.entries(eventTypes).map(([key, { label, color }]) => (
              <div key={key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Add Event – Secretary only */}
          {role === ROLES.SECRETARY && (
            <button className={styles.addEventBtn} onClick={() => openModal()}>
              + Add Event
            </button>
          )}
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className={styles.mainContent}>

        {/* ── Calendar ── */}
        <div className={styles.calendarContainer}>
          {/* Dark navy month navigation */}
          <div className={styles.calendarHeader}>
            <button className={styles.navBtn} onClick={() => navigateMonth(-1)}>&#60;</button>
            <h2 className={styles.monthTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button className={styles.navBtn} onClick={() => navigateMonth(1)}>&#62;</button>
          </div>

          {isLoading ? (
            <div className={styles.loadingState}>
              <p>Loading activities…</p>
            </div>
          ) : (
            <>
              {/* Day name headers */}
              <div className={styles.dayNames}>
                {dayNames.map((d) => (
                  <div key={d} className={styles.dayNameCell}>{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className={styles.daysGrid}>
                {calendarDays.map((day, idx) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  return (
                    <div
                      key={idx}
                      className={`${styles.dayCell} ${!day ? styles.emptyDay : ""}`}
                      onClick={() => {
                        if (day && role === ROLES.SECRETARY) {
                          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          openModal(dateStr);
                        }
                      }}
                    >
                      {day && (
                        <>
                          <div className={`${styles.dayNumber} ${isToday(day) ? styles.todayNumber : ""}`}>
                            {day}
                          </div>
                          <div className={styles.eventsList}>
                            {dayEvents.slice(0, 3).map((ev) => (
                              <div
                                key={ev.id}
                                className={styles.eventItem}
                                style={{ borderLeftColor: eventTypes[ev.type]?.color || "#6b7280" }}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                                title={ev.title}
                              >
                                <span className={styles.eventTitle}>{ev.title}</span>
                                <span className={styles.eventTime}>
                                  {ev.startTime === "00:00" && ev.endTime === "23:59"
                                    ? "All day"
                                    : ev.startTime}
                                </span>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className={styles.moreEvents}>
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Event Details Sidebar ── */}
        <div className={styles.eventDetailsSidebar}>
          {selectedEvent ? (
            <div className={styles.eventDetailsCard}>
              <h3>{selectedEvent.title}</h3>

              <div className={styles.eventDetailRow}>
                <span className={styles.eventDetailLabel}>Type</span>
                <span
                  className={styles.eventTypeBadge}
                  style={{ backgroundColor: eventTypes[selectedEvent.type]?.color || "#6b7280" }}
                >
                  {eventTypes[selectedEvent.type]?.label}
                </span>
              </div>

              <div className={styles.eventDetailRow}>
                <span className={styles.eventDetailLabel}>Date</span>
                <span className={styles.eventDetailValue}>
                  {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>

              <div className={styles.eventDetailRow}>
                <span className={styles.eventDetailLabel}>Time</span>
                <span className={styles.eventDetailValue}>
                  {selectedEvent.startTime === "00:00" && selectedEvent.endTime === "23:59"
                    ? "All day"
                    : `${selectedEvent.startTime} – ${selectedEvent.endTime}`}
                </span>
              </div>

              <div className={styles.eventDetailRow}>
                <span className={styles.eventDetailLabel}>Location</span>
                <span className={styles.eventDetailValue}>{selectedEvent.location}</span>
              </div>

              <div className={styles.eventDetailRow}>
                <span className={styles.eventDetailLabel}>Description</span>
                <span className={styles.eventDetailValue}>{selectedEvent.description}</span>
              </div>

              <button className={styles.closeDetailsBtn} onClick={() => setSelectedEvent(null)}>
                Close Details
              </button>
            </div>
          ) : (
            <div className={styles.eventDetailsPlaceholder}>
              <CalendarIcon />
              <p className={styles.placeholderTitle}>Select an Event</p>
              <p className={styles.placeholderSub}>Click on any event to view its details</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Event Modal ── */}
      {isModalOpen && role === ROLES.SECRETARY && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Event</h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.eventForm}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  placeholder="Add a description…"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. CCS Department, Room 101"
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="event">Event</option>
                  <option value="activity">Activity</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={closeModal} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedCalendar;