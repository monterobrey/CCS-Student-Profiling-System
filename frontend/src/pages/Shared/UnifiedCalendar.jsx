import React, { useMemo, useState } from "react";
import styles from "../../styles/Shared/UnifiedCalendar.module.css";
import { useAuth, ROLES } from "../../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import { awardService } from "../../services/awardService";
import { studentService } from "../../services/studentService";
import { violationService } from "../../services/violationService";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Convert a hex color to rgba with given opacity
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const EVENT_TYPES = {
  event:    { label: "Event",    color: "#f97316" },
  activity: { label: "Activity", color: "#6366f1" },
  meeting:  { label: "Meeting",  color: "#10b981" },
};

// Audience options the secretary can target
const AUDIENCE_OPTIONS = [
  { value: "dean",             label: "Dean" },
  { value: "department_chair", label: "Department Chair" },
  { value: "faculty",          label: "Faculty" },
  { value: "student",          label: "Students" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  start_time: "09:00",
  end_time: "10:00",
  location: "",
  type: "event",
  visible_to: [],
};

const CalendarBlankIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
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
  const queryClient = useQueryClient();
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const canSchedule = role === ROLES.SECRETARY;

  // ── Fetch calendar events from backend ───────────────────────────────────
  const { data: calendarEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.CALENDAR.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  // ── Fetch derived events (awards, affiliations, violations) ──────────────
  const { data: awards = [] } = useQuery({
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

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => httpClient.post(API_ENDPOINTS.CALENDAR.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      closeModal();
    },
    onError: (err) => setFormError(err?.message || "Failed to save event."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => httpClient.delete(API_ENDPOINTS.CALENDAR.DELETE(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setSelectedEvent(null);
    },
  });

  // ── Merge all events ──────────────────────────────────────────────────────
  const events = useMemo(() => {
    const unified = calendarEvents.map((e) => ({
      id: `cal-${e.id}`,
      _id: e.id,
      title: e.title,
      date: new Date(e.date + "T00:00:00"),
      startTime: e.start_time ?? "",
      endTime: e.end_time ?? "",
      type: e.type,
      location: e.location || "—",
      description: e.description || "",
      visible_to: e.visible_to,
      isOwned: e.created_by != null,
      source: "backend",
    }));

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
          source: "award",
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
            source: "affiliation",
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
          source: "violation",
        });
      }
    });

    return unified;
  }, [calendarEvents, awards, profile, violations, role]);

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

  const toggleAudience = (val) => {
    setFormData((prev) => ({
      ...prev,
      visible_to: prev.visible_to.includes(val)
        ? prev.visible_to.filter((v) => v !== val)
        : [...prev.visible_to, val],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim())       { setFormError("Title is required."); return; }
    if (!formData.date)               { setFormError("Date is required."); return; }
    if (formData.visible_to.length === 0) { setFormError("Select at least one audience."); return; }

    createMutation.mutate({
      title:       formData.title.trim(),
      description: formData.description.trim(),
      date:        formData.date,
      start_time:  formData.start_time || null,
      end_time:    formData.end_time || null,
      location:    formData.location.trim() || null,
      type:        formData.type,
      visible_to:  formData.visible_to,
    });
  };

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
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Schedule
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.calBody}>

        {/* Calendar panel */}
        <div className={styles.calPanel}>
          <div className={styles.dayNames}>
            {DAY_NAMES.map((d) => (
              <div key={d} className={styles.dayNameCell}>{d}</div>
            ))}
          </div>

          {isLoadingEvents ? (
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
                          {dayEvents.slice(0, 3).map((ev) => {
                            const evColor = EVENT_TYPES[ev.type]?.color ?? "#9ca3af";
                            return (
                              <div
                                key={ev.id}
                                className={`${styles.evChip} ${selectedEvent?.id === ev.id ? styles.evChipActive : ""}`}
                                style={{
                                  borderLeftColor: evColor,
                                  background: hexToRgba(evColor, 0.12),
                                  color: evColor,
                                }}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                                title={ev.title}
                              >
                                {ev.title}
                              </div>
                            );
                          })}
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

                {selectedEvent.location && selectedEvent.location !== "—" && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.detailValue}>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Description</span>
                    <span className={styles.detailValue}>{selectedEvent.description}</span>
                  </div>
                )}

                {/* Audience tags — visible to secretary */}
                {canSchedule && selectedEvent.visible_to?.length > 0 && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Visible to</span>
                    <div className={styles.audienceTags}>
                      {selectedEvent.visible_to.map((r) => (
                        <span key={r} className={styles.audienceTag}>
                          {AUDIENCE_OPTIONS.find((o) => o.value === r)?.label ?? r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete button — secretary only, backend events only */}
                {canSchedule && selectedEvent.source === "backend" && (
                  <button
                    className={styles.deleteEventBtn}
                    onClick={() => deleteMutation.mutate(selectedEvent._id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting…" : "Delete Event"}
                  </button>
                )}
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

      {/* ── Create Event Modal ── */}
      {isModalOpen && (
        <div className={styles.backdrop} onClick={closeModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Event</h2>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            {/* Type selector */}
            <div className={styles.typeTabs}>
              {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.typeTab} ${formData.type === key ? styles.typeTabOn : ""}`}
                  style={formData.type === key ? { borderColor: color, color, background: color + "12" } : {}}
                  onClick={() => setFormData((p) => ({ ...p, type: key }))}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Title <span style={{color:"#f97316"}}>*</span></label>
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
                  <label className={styles.fieldLabel}>Date <span style={{color:"#f97316"}}>*</span></label>
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
                    value={formData.start_time}
                    onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>End time</label>
                  <input
                    className={styles.fieldInput}
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData((p) => ({ ...p, end_time: e.target.value }))}
                  />
                </div>
              </div>

              {/* ── Audience multi-select ── */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Visible to <span style={{color:"#f97316"}}>*</span></label>
                <div className={styles.audienceGrid}>
                  {AUDIENCE_OPTIONS.map(({ value, label }) => {
                    const checked = formData.visible_to.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.audienceChip} ${checked ? styles.audienceChipOn : ""}`}
                        onClick={() => toggleAudience(value)}
                      >
                        {checked && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.audienceHint}>Secretary is always included.</p>
              </div>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving…" : "Save Event"}
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
