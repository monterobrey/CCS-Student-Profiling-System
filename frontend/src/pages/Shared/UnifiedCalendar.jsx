import React, { useMemo, useState } from "react";
import styles from "../../styles/Shared/UnifiedCalendar.module.css";
import { useAuth, ROLES } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { awardService } from "../../services/awardService";
import { studentService } from "../../services/studentService";
import { violationService } from "../../services/violationService";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const EVENT_TYPES = {
  event:    { label: "Event",    color: "#f97316" },
  activity: { label: "Activity", color: "#6366f1" },
  meeting:  { label: "Meeting",  color: "#10b981" },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  type: "event",
};

const CalendarBlankIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="8" width="30" height="27" rx="3" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
    <line x1="5" y1="16" x2="35" y2="16" stroke="#d1d5db" strokeWidth="1.5"/>
    <line x1="13" y1="5" x2="13" y2="11" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="27" y1="5" x2="27" y2="11" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="11" y="21" width="5" height="4" rx="1" fill="#e5e7eb"/>
    <rect x="20" y="21" width="5" height="4" rx="1" fill="#e5e7eb"/>
  </svg>
);

const UnifiedCalendar = () => {
  const { role } = useAuth();
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [localEvents, setLocalEvents] = useState([]);

  // ── Data fetching ─────────────────────────────────────────────────────────
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

  // ── Event transformation ──────────────────────────────────────────────────
  const events = useMemo(() => {
    const unified = [...localEvents];

    awards.forEach((award) => {
      if (award.created_at || award.date_given) {
        unified.push({
          id: `award-${award.id}`,
          title: award.title || "Award/Recognition",
          date: new Date(award.created_at || award.date_given),
          startTime: "", endTime: "",
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
            startTime: "", endTime: "",
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
          startTime: "", endTime: "",
          type: "meeting",
          location: "CCS Department",
          description: v.description || "Resolved violation record",
        });
      }
    });

    return unified;
  }, [awards, profile, violations, localEvents, role]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return {
      daysInMonth:       new Date(year, month + 1, 0).getDate(),
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
    setSelectedEvent(null);
  };

  const calendarDays = [
    ...Array(startingDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = (prefillDate = "") => {
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const dateStr = prefillDate || `${currentDate.getFullYear()}-${m}-${d}`;
    setFormData({ ...EMPTY_FORM, date: dateStr });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setFormError(""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { setFormError("Title is required."); return; }
    if (!formData.date)         { setFormError("Date is required."); return; }
    setLocalEvents((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        title: formData.title.trim(),
        date: new Date(formData.date + "T00:00:00"),
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type,
        location: formData.location.trim() || "—",
        description: formData.description.trim() || "No description provided.",
      },
    ]);
    closeModal();
  };

  const canSchedule = role === ROLES.SECRETARY || role === ROLES.ADMIN;
  const selType = selectedEvent ? EVENT_TYPES[selectedEvent.type] : null;

  return (
    <div className={styles.calPage}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.topMonth}>
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
        </div>

        <div className={styles.topRight}>
          <div className={styles.legends}>
            {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
              <div key={key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className={styles.navGroup}>
            <button className={styles.navBtn} onClick={() => navigateMonth(-1)}>&#8249;</button>
            <button className={styles.navBtn} onClick={() => navigateMonth(1)}>&#8250;</button>
          </div>

          {canSchedule && (
            <button className={styles.scheduleBtn} onClick={() => openModal()}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Schedule
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.calBody}>

        {/* Calendar */}
        <div className={styles.calPanel}>
          <div className={styles.dayNames}>
            {DAY_NAMES.map((d) => (
              <div key={d} className={styles.dayNameCell}>{d}</div>
            ))}
          </div>

          {isLoadingAwards ? (
            <div className={styles.loadingState}>Loading…</div>
          ) : (
            <div className={styles.daysGrid}>
              {calendarDays.map((day, idx) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const dateStr = day
                  ? `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
                  : "";
                return (
                  <div
                    key={idx}
                    className={`${styles.dayCell} ${!day ? styles.emptyDay : ""} ${canSchedule && day ? styles.dayCellClickable : ""}`}
                    onClick={() => { if (day && canSchedule) openModal(dateStr); }}
                  >
                    {day && (
                      <>
                        <span className={`${styles.dayNum} ${isToday(day) ? styles.todayNum : ""}`}>
                          {day}
                        </span>
                        <div className={styles.evList}>
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div
                              key={ev.id}
                              className={`${styles.evChip} ${selectedEvent?.id === ev.id ? styles.evChipActive : ""}`}
                              style={{ borderLeftColor: EVENT_TYPES[ev.type]?.color }}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className={styles.moreChip}>+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.calSidebar}>
          {selectedEvent ? (
            <>
              <div className={styles.sidebarStrip}>
                <div className={styles.stripDate}>{new Date(selectedEvent.date).getDate()}</div>
                <div className={styles.stripSub}>
                  {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                    weekday: "long", month: "long", year: "numeric",
                  })}
                </div>
              </div>

              <div className={styles.detailBody}>
                <div className={styles.detailTopRow}>
                  <span
                    className={styles.detailBadge}
                    style={{
                      color: selType?.color,
                      background: selType?.color + "15",
                      borderColor: selType?.color + "40",
                    }}
                  >
                    {selType?.label}
                  </span>
                  <button className={styles.detailClose} onClick={() => setSelectedEvent(null)}>✕</button>
                </div>

                <h3 className={styles.detailTitle}>{selectedEvent.title}</h3>
                <hr className={styles.detailDivider} />

                {selectedEvent.startTime && selectedEvent.endTime && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Time</span>
                    <span className={styles.detailValue}>{selectedEvent.startTime} – {selectedEvent.endTime}</span>
                  </div>
                )}

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Location</span>
                  <span className={styles.detailValue}>{selectedEvent.location}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Description</span>
                  <span className={styles.detailValue}>{selectedEvent.description}</span>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.sidebarEmpty}>
              <CalendarBlankIcon />
              <p className={styles.emptyTitle}>No event selected</p>
              <p className={styles.emptySub}>Click any event to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className={styles.backdrop} onClick={closeModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Schedule</h2>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            {/* Type selector */}
            <div className={styles.typeTabs}>
              {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.typeTab} ${formData.type === key ? styles.typeTabOn : ""}`}
                  style={formData.type === key
                    ? { borderColor: color, color, background: color + "12" }
                    : {}}
                  onClick={() => setFormData((p) => ({ ...p, type: key }))}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Title</label>
                <input
                  className={styles.fieldInput}
                  type="text"
                  placeholder={`${EVENT_TYPES[formData.type].label} title`}
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Description</label>
                <textarea
                  className={styles.fieldTextarea}
                  placeholder="Add a description…"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Date</label>
                  <input
                    className={styles.fieldInput}
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Location</label>
                  <input
                    className={styles.fieldInput}
                    type="text"
                    placeholder="Room / venue"
                    value={formData.location}
                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Start time</label>
                  <input
                    className={styles.fieldInput}
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>End time</label>
                  <input
                    className={styles.fieldInput}
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedCalendar;