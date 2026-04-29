import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { scheduleService } from "../../services/scheduleService";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Chair/ScheduleManagement.css";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = { Monday: "M", Tuesday: "T", Wednesday: "W", Thursday: "Th", Friday: "F", Saturday: "Sat" };

const EMPTY_FORM = {
  section_id: "", course_id: "", class_type: "lec",
  dayOfWeek: "Monday", startTime: "08:00", endTime: "09:00", room: "",
};

const formatTime = (t) =>
  t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const formatDays = (days) =>
  [...days]
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map((d) => DAY_SHORT[d])
    .join("/");

// Render days from daySlots: always "M/Th" style
const formatSlotDays = (daySlots) =>
  daySlots
    .map((s) => DAY_SHORT[s.day])
    .join("/");

// Render times from daySlots:
// - All same time → "8:00 AM – 9:00 AM"
// - Different times → "8:00 AM – 9:00 AM / 9:00 AM – 10:00 AM"
const formatSlotTimes = (daySlots) => {
  const times = daySlots.map((s) => `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`);
  const unique = [...new Set(times)];
  return unique.join(" / ");
};

export default function ScheduleManagement() {
  const queryClient  = useQueryClient();
  const fileInputRef = useRef(null);
  const { user }     = useAuth();

  // Chair's own program — locked, cannot be changed
  const chairProgramId = user?.faculty?.program_id
    ? String(user.faculty.program_id)
    : null;

  // ── Restore filters from cache on mount (survives navigation) ────────────
  const cachedFilters = queryClient.getQueryData(["schedule-filters"]);

  const [filterProgram,   setFilterProgram]   = useState(cachedFilters?.filterProgram   ?? chairProgramId ?? "");
  const [filterYear,      setFilterYear]      = useState(cachedFilters?.filterYear      ?? "");
  const [activeSectionId, setActiveSectionId] = useState(cachedFilters?.activeSectionId ?? "");

  // Persist filters to cache whenever they change
  const persistFilters = (patch) => {
    queryClient.setQueryData(["schedule-filters"], (prev = {}) => ({ ...prev, ...patch }));
  };

  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showAutoModal,   setShowAutoModal]   = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [autoForm,   setAutoForm]   = useState({ program_id: chairProgramId ?? "", year_level: "1", semester: "1st" });
  const [assignForm, setAssignForm] = useState({ faculty_id: "" });

  const [saving,     setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [assigning,  setAssigning]  = useState(false);
  const [importing,  setImporting]  = useState(false);

  const [toast,         setToast]         = useState(null);
  const [assignError,   setAssignError]   = useState("");
  const [autoConflicts, setAutoConflicts] = useState([]);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await scheduleService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.SECTIONS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.PROGRAMS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: faculty = [] } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.FACULTY.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  // Curriculum courses — only fetched when a section is selected in the add modal
  const { data: curriculumCourses = [] } = useQuery({
    queryKey: ["curriculum-courses", form.section_id],
    queryFn: async () => {
      const res = await scheduleService.getCurriculumCourses(form.section_id);
      return res.ok ? (res.data ?? []) : [];
    },
    enabled: showAddModal && !!form.section_id,
  });

  // ── Derived: which semesters already have schedules for the auto-form selection ──
  const availableSemesters = useMemo(() => {
    if (!autoForm.program_id || !autoForm.year_level) {
      return [{ value: "1st", label: "1st Semester", enabled: true }];
    }

    // Get section IDs for this program + year
    const sectionIds = new Set(
      sections
        .filter(s =>
          String(s.program_id) === String(autoForm.program_id) &&
          String(s.year_level) === String(autoForm.year_level)
        )
        .map(s => s.id)
    );

    // Which semesters already have schedules for these sections
    const existingSemesters = new Set(
      schedules
        .filter(s => sectionIds.has(s.section_id) && s.semester)
        .map(s => s.semester)
    );

    const has1st = existingSemesters.has("1st");
    const has2nd = existingSemesters.has("2nd");

    return [
      { value: "1st",    label: "1st Semester",  enabled: true },
      { value: "2nd",    label: "2nd Semester",   enabled: has1st },
      { value: "Summer", label: "Summer",          enabled: has1st && has2nd },
    ];
  }, [autoForm.program_id, autoForm.year_level, schedules, sections]);

  // Auto-correct semester selection when program/year changes
  useEffect(() => {
    const current = availableSemesters.find(s => s.value === autoForm.semester);
    if (current && !current.enabled) {
      // Reset to first enabled semester
      const first = availableSemesters.find(s => s.enabled);
      if (first) setAutoForm(f => ({ ...f, semester: first.value }));
    }
  }, [availableSemesters]);

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Auto-select chair's program + first year that has schedules ────────────
  useEffect(() => {
    if (!programs.length || !sections.length) return;

    const targetProgram = chairProgramId ?? (programs[0] ? String(programs[0].id) : null);
    if (!targetProgram) return;

    // Already have a filter set (from cache or previous interaction) — keep it
    if (filterProgram && filterYear) return;

    // Find the first year level that has existing schedules for this program
    const yearsWithSchedules = ["1", "2", "3", "4"].filter(y =>
      sections
        .filter(s => String(s.program_id) === String(targetProgram) && String(s.year_level) === y)
        .some(s => schedules.some(sch => sch.section_id === s.id))
    );

    // Default to first year with schedules; if none exist yet, fall back to year 1
    const defaultYear = yearsWithSchedules.length > 0 ? yearsWithSchedules[0] : "1";

    setFilterProgram(targetProgram);
    setFilterYear(defaultYear);
    persistFilters({ filterProgram: targetProgram, filterYear: defaultYear, activeSectionId: "" });
  }, [programs, sections, schedules, chairProgramId]);

  // ── Derived: filtered sections (tabs) ────────────────────────────────────

  const filteredSections = useMemo(() => {
    if (!filterProgram || !filterYear) return [];
    return sections
      .filter((s) => String(s.program_id) === String(filterProgram) && String(s.year_level) === String(filterYear))
      .sort((a, b) => a.section_name.localeCompare(b.section_name));
  }, [sections, filterProgram, filterYear]);

  // Auto-select first tab when filter changes — but respect cached active section
  useEffect(() => {
    if (filteredSections.length === 0) {
      setActiveSectionId("");
      persistFilters({ activeSectionId: "" });
      return;
    }
    // If cached section is still in the filtered list, keep it; otherwise pick first
    const stillValid = filteredSections.some((s) => s.id === activeSectionId);
    if (!stillValid) {
      const first = filteredSections[0].id;
      setActiveSectionId(first);
      persistFilters({ activeSectionId: first });
    }
  }, [filteredSections]);

  // ── Derived: grouped schedules ────────────────────────────────────────────

  const groupedSchedules = useMemo(() => {
    // Group all entries by section + course + type into one row.
    // Each day entry keeps its own time, sorted by day order.
    const grouped = {};

    schedules.forEach((item) => {
      const key = `${item.section_id}-${item.course_id}-${item.class_type}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          ids: [item.id],
          daySlots: [{ day: item.dayOfWeek, startTime: item.startTime, endTime: item.endTime }],
          scheduleEntries: [item], // Keep original entries for faculty lookup
        };
      } else {
        grouped[key].ids.push(item.id);
        grouped[key].daySlots.push({ day: item.dayOfWeek, startTime: item.startTime, endTime: item.endTime });
        grouped[key].scheduleEntries.push(item);
      }
    });

    // Sort each row's day slots by day order
    Object.values(grouped).forEach((row) => {
      row.daySlots.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
    });

    return Object.values(grouped)
      .filter((item) => {
        if (activeSectionId) return item.section_id === activeSectionId;
        const sec = item.section;
        if (filterProgram && String(sec?.program_id) !== String(filterProgram)) return false;
        if (filterYear    && String(sec?.year_level)  !== String(filterYear))   return false;
        return true;
      })
      .sort((a, b) =>
        (a.section?.section_name || "").localeCompare(b.section?.section_name || "")
      );
  }, [schedules, activeSectionId, filterProgram, filterYear]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const saveSchedule = async () => {
    if (!form.section_id || !form.course_id || !form.room) {
      showToast("error", "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await scheduleService.create(form);
      if (res.ok) {
        showToast("success", res.message || "Schedule created.");
        setShowAddModal(false);
        setForm(EMPTY_FORM);
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
      } else {
        showToast("error", res.message || "Failed to create schedule.");
      }
    } catch {
      showToast("error", "Failed to create schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!autoForm.program_id) {
      showToast("error", "Select a program.");
      return;
    }
    setGenerating(true);
    setAutoConflicts([]);
    try {
      const res = await scheduleService.autoGenerate(autoForm);
      if (res.ok) {
        showToast("success", res.message || "Schedules generated successfully.");
        setShowAutoModal(false);
        setAutoConflicts([]);

        // 1. Immediately refetch so the page shows the new schedules right away
        await queryClient.invalidateQueries({ queryKey: ["schedules"] });
        await queryClient.invalidateQueries({ queryKey: ["sections"] });

        // 2. Auto-navigate the filter to the just-generated program + year
        //    so the user lands directly on what was generated
        const generatedYear = String(autoForm.year_level);
        setFilterYear(generatedYear);
        persistFilters({
          filterProgram: String(autoForm.program_id),
          filterYear:    generatedYear,
          activeSectionId: "",
        });
      } else {
        const conflicts = Array.isArray(res.errors) ? res.errors : [];
        if (conflicts.length > 0) {
          setAutoConflicts(conflicts);
        } else {
          showToast("error", res.message || "Auto-generation failed.");
        }
      }
    } catch {
      showToast("error", "Auto-generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const saveAssignment = async () => {
    if (!assignForm.faculty_id) {
      setAssignError("Please select a faculty member.");
      return;
    }
    setAssigning(true);
    setAssignError("");
    try {
      const res = await scheduleService.assignFaculty(selectedSchedule.id, assignForm.faculty_id);
      if (res.ok) {
        showToast("success", res.message || "Faculty assigned.");
        setShowAssignModal(false);
        setAssignForm({ faculty_id: "" });
        setAssignError("");

        const assignedFaculty = faculty.find((f) => String(f.id) === String(assignForm.faculty_id));
        const pairedAssigned = res.data?.paired_assigned ?? false;

        if (pairedAssigned) {
          // Backend also updated the paired type — refetch to get the full accurate state
          queryClient.invalidateQueries({ queryKey: ["schedules"] });
        } else {
          // Only the single slot changed — patch cache directly
          queryClient.setQueryData(["schedules"], (old = []) =>
            old.map((s) =>
              s.id === selectedSchedule.id
                ? { ...s, faculty_id: assignedFaculty?.id ?? null, faculty: assignedFaculty ?? null }
                : s
            )
          );
        }
      } else {
        setAssignError(res.message || "Failed to assign faculty.");
      }
    } catch {
      setAssignError("Something went wrong. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const deleteSchedule = async (item) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      const res = await scheduleService.bulkDelete(item.ids);
      if (res.ok) {
        showToast("success", "Schedule deleted.");
        // Remove deleted entries from cache directly — no refetch
        queryClient.setQueryData(["schedules"], (old = []) =>
          old.filter((s) => !item.ids.includes(s.id))
        );
      } else {
        showToast("error", res.message || "Failed to delete.");
      }
    } catch {
      showToast("error", "Failed to delete.");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await scheduleService.importCsv(file);
      if (res.success) {
        showToast("success", res.message || `Imported successfully.`);
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
      } else {
        showToast("error", res.message || "Import failed.");
      }
    } catch {
      showToast("error", "Import failed.");
    } finally {
      setImporting(false);
      fileInputRef.current.value = "";
    }
  };

  const openAssign = (item, specificEntry = null) => {
    // If a specific unassigned entry is provided (mixed state), use it.
    // Otherwise fall back to the first unassigned entry in the group.
    const entry = specificEntry ?? item.scheduleEntries.find(s => !s.faculty) ?? item;
    setSelectedSchedule({ ...entry, course: item.course, section: item.section });
    setAssignForm({ faculty_id: "" });
    setAssignError("");
    setShowAssignModal(true);
  };

  const openReassign = (item) => {
    // For reassign, use the first entry that has a faculty assigned
    const entry = item.scheduleEntries.find(s => s.faculty) ?? item;
    setSelectedSchedule({ ...entry, course: item.course, section: item.section });
    setAssignForm({ faculty_id: entry.faculty_id?.toString() ?? "" });
    setAssignError("");
    setShowAssignModal(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="schedule-page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Schedule Management</h2>
          <p className="page-sub">Manage and assign class schedules per section.</p>
        </div>
        <div className="header-actions">
          <button className="outline-btn" onClick={() => {
            setAutoForm({ program_id: chairProgramId ?? "", year_level: "1", semester: "1st" });
            setShowAutoModal(true);
          }}>
            Auto-Generate
          </button>
          <button className="outline-btn" onClick={() => fileInputRef.current.click()} disabled={importing}>
            {importing ? "Importing..." : "Import CSV"}
          </button>
          <input type="file" hidden ref={fileInputRef} accept=".csv" onChange={handleImport} />
          <button className="primary-btn" onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}>
            + New Schedule
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-bar pcard">
        {chairProgramId ? (
          <div style={{
            padding: "8px 14px",
            background: "#faf8f6",
            border: "1.5px solid #f0e8e0",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            color: "#1a0a00",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            {programs.find(p => String(p.id) === String(chairProgramId))?.program_code ?? "Your Program"}
          </div>
        ) : (
          <select value={filterProgram} onChange={(e) => {
            setFilterProgram(e.target.value);
            setFilterYear("");
            persistFilters({ filterProgram: e.target.value, filterYear: "", activeSectionId: "" });
          }}>
            <option value="">Select Program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.program_code}</option>
            ))}
          </select>
        )}
        <select value={filterYear} onChange={(e) => {
          setFilterYear(e.target.value);
          persistFilters({ filterYear: e.target.value, activeSectionId: "" });
        }} disabled={!filterProgram}>
          <option value="">Select Year</option>
          {["1","2","3","4"].map((y) => (
            <option key={y} value={y}>{y}{y==="1"?"st":y==="2"?"nd":y==="3"?"rd":"th"} Year</option>
          ))}
        </select>
      </div>

      {/* SECTION TABS + TABLE */}
      {filteredSections.length > 0 ? (
        <div className="schedule-body">
          <div className="section-tabs pcard">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                className={`section-tab ${activeSectionId === sec.id ? "active" : ""}`}
                onClick={() => { setActiveSectionId(sec.id); persistFilters({ activeSectionId: sec.id }); }}
              >
                {sec.section_name}
              </button>
            ))}
          </div>

          <div className="schedule-list pcard">
            {isLoading ? (
              <div className="loading-state">Loading schedules...</div>
            ) : groupedSchedules.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                  <rect x="6" y="8" width="36" height="34" rx="4" stroke="#f0e8e0" strokeWidth="2.5"/>
                  <path d="M16 6v4M32 6v4M6 18h36" stroke="#f0e8e0" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M16 28h16M16 34h10" stroke="#f0e8e0" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <p className="empty-state-title">No schedules yet</p>
                <p className="empty-state-sub">This section doesn't have any schedules. Use Auto-Generate or add one manually.</p>
                <div className="empty-state-actions">
                  <button className="outline-btn" onClick={() => setShowAutoModal(true)}>Auto-Generate</button>
                  <button className="primary-btn" onClick={() => { setForm({ ...EMPTY_FORM, section_id: String(activeSectionId) }); setShowAddModal(true); }}>+ Add Manually</button>
                </div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Days</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Faculty</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSchedules.map((item) => (
                    <tr key={`${item.section_id}-${item.course_id}-${item.class_type}`}>
                      <td>{item.section?.section_name || "—"}</td>
                      <td>
                        <span className="course-code">{item.course?.course_code}</span>
                        <span className="course-name">{item.course?.course_name}</span>
                      </td>
                      <td>
                        <span className={`type-badge type-${item.class_type}`}>
                          {item.class_type?.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatSlotDays(item.daySlots)}</td>
                      <td>{formatSlotTimes(item.daySlots)}</td>
                      <td>{item.room}</td>
                      <td>
                        {(() => {
                          // Render each slot in day order: prof name or Assign button
                          const parts = item.daySlots.map((slot) => {
                            const entry = item.scheduleEntries.find(
                              (s) =>
                                s.dayOfWeek === slot.day &&
                                s.startTime === slot.startTime &&
                                s.endTime === slot.endTime
                            );
                            if (entry?.faculty) {
                              return {
                                type: "name",
                                label: `${entry.faculty.first_name} ${entry.faculty.last_name}`,
                                entry,
                              };
                            }
                            return { type: "assign", entry };
                          });

                          // If every slot has the same prof, just show the name once
                          const allSamePro = parts.every(
                            (p) => p.type === "name" && p.label === parts[0].label
                          );
                          if (allSamePro) {
                            return <span className="faculty-name">{parts[0].label}</span>;
                          }

                          // All unassigned — single Assign button
                          if (parts.every((p) => p.type === "assign")) {
                            return (
                              <button className="assign-btn" onClick={() => openAssign(item, parts[0].entry)}>
                                Assign
                              </button>
                            );
                          }

                          // Mixed — render positionally
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              {parts.map((part, i) => (
                                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {i > 0 && <span style={{ color: "#b89f90" }}>/</span>}
                                  {part.type === "name" ? (
                                    <span className="faculty-name">{part.label}</span>
                                  ) : (
                                    <button
                                      className="assign-btn"
                                      onClick={() => openAssign(item, part.entry)}
                                    >
                                      Assign
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <div className="action-cell">
                          {item.scheduleEntries.some(s => s.faculty) && (
                            <button className="edit-btn-sm" onClick={() => openReassign(item)} title="Change faculty">
                              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                                <path d="M11.5 2.5l2 2M2 14l2-2 8.5-8.5-2-2-8.5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                          <button className="delete-btn-sm" onClick={() => deleteSchedule(item)} title="Delete schedule">
                            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                              <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="pcard empty-state">
          {filterProgram && filterYear ? (
            <>
              <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                <rect x="6" y="8" width="36" height="34" rx="4" stroke="#f0e8e0" strokeWidth="2.5"/>
                <path d="M16 6v4M32 6v4M6 18h36" stroke="#f0e8e0" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M24 26v8M20 30h8" stroke="#FF6B1A" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <p className="empty-state-title">No sections found</p>
              <p className="empty-state-sub">
                There are no sections for this program and year level yet. Auto-generate will create them automatically.
              </p>
              <button className="primary-btn" onClick={() => setShowAutoModal(true)}>Auto-Generate Schedules</button>
            </>
          ) : (
            <>
              <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                <rect x="6" y="8" width="36" height="34" rx="4" stroke="#f0e8e0" strokeWidth="2.5"/>
                <path d="M16 6v4M32 6v4M6 18h36" stroke="#f0e8e0" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M16 28h16M16 34h10" stroke="#f0e8e0" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <p className="empty-state-title">Select a year level</p>
              <p className="empty-state-sub">Choose a year level above to view or manage schedules.</p>
            </>
          )}
        </div>
      )}

{/* ── ADD SCHEDULE MODAL ── */}
{showAddModal && (
  <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
    <div className="modal modal-add" onClick={(e) => e.stopPropagation()}>

      {/* HEADER */}
      <div className="modal-header">
        <div className="modal-header-left">
          <div className="modal-header-icon">
            <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
              <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M6 2v2M12 2v2M2 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M6 10h2M10 10h2M6 13h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3>New Schedule Entry</h3>
            <p className="modal-subtitle">Add a class schedule for a section</p>
          </div>
        </div>
        <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
      </div>

      {/* BODY */}
      <div className="modal-body">

        <div className="form-section-label">Class Details</div>

        <div className="field">
          <label>Section <span className="req">*</span></label>
          <select
            value={form.section_id}
            onChange={(e) => setForm({ ...form, section_id: e.target.value, course_id: "" })}
          >
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.section_name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>
            Course <span className="req">*</span>
            {!form.section_id && <span className="field-hint"> — select a section first</span>}
          </label>
          <select
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            disabled={!form.section_id}
          >
            <option value="">Select course</option>
            {curriculumCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Type <span className="req">*</span></label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${form.class_type === "lec" ? "type-btn-lec" : ""}`}
              onClick={() => setForm({ ...form, class_type: "lec" })}
            >
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <rect x="2" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Lecture
            </button>
            <button
              type="button"
              className={`type-btn ${form.class_type === "lab" ? "type-btn-lab" : ""}`}
              onClick={() => setForm({ ...form, class_type: "lab" })}
            >
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M6 2v5L3 13h10L10 7V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.5 2h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Laboratory
            </button>
          </div>
        </div>

        <div className="form-section-label" style={{ marginTop: 4 }}>Schedule</div>

        <div className="field">
          <label>Day <span className="req">*</span></label>
          <div className="day-pills">
            {DAY_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                className={`day-pill ${form.dayOfWeek === d ? "day-pill-active" : ""}`}
                onClick={() => setForm({ ...form, dayOfWeek: d })}
              >
                {DAY_SHORT[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Start Time <span className="req">*</span></label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div className="field">
            <label>End Time <span className="req">*</span></label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label>Room <span className="req">*</span></label>
          <input
            type="text"
            placeholder="e.g. Room 101"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
          />
        </div>

        {form.section_id && form.course_id && form.room && (
          <div className="modal-hint" style={{ marginTop: 2 }}>
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            You can add more days for this course after saving by creating another entry with the same course and type.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="modal-footer">
        <button className="outline-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
        <button className="primary-btn" onClick={saveSchedule} disabled={saving}>
          {saving ? (
            <><span className="spinner-sm"></span> Saving...</>
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Save Schedule
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
      {/* ── AUTO-GENERATE MODAL ── */}
      {showAutoModal && (
        <div className="modal-overlay" onClick={() => { setShowAutoModal(false); setAutoConflicts([]); }}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                    <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.22 4.22l1.42 1.42M12.36 12.36l1.42 1.42M4.22 13.78l1.42-1.42M12.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <h3>Auto-Generate Schedules</h3>
                  <p className="modal-subtitle">Automatically assign schedules for a program</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => { setShowAutoModal(false); setAutoConflicts([]); }}>✕</button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label>Program</label>
                <div style={{
                  padding: "10px 14px",
                  background: "#faf8f6",
                  border: "1.5px solid #f0e8e0",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a0a00",
                }}>
                  {programs.find(p => String(p.id) === String(autoForm.program_id))?.program_code ?? "—"}
                </div>
              </div>

              <div className="field">
                <label>Year Level <span className="req">*</span></label>
                <select
                  value={autoForm.year_level}
                  onChange={(e) => setAutoForm({ ...autoForm, year_level: e.target.value })}
                >
                  {["1","2","3","4"].map((y) => (
                    <option key={y} value={y}>{y}{y==="1"?"st":y==="2"?"nd":y==="3"?"rd":"th"} Year</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Semester <span className="req">*</span></label>
                <select
                  value={autoForm.semester}
                  onChange={(e) => setAutoForm({ ...autoForm, semester: e.target.value })}
                >
                  {availableSemesters.map(s => (
                    <option key={s.value} value={s.value} disabled={!s.enabled}>
                      {s.label}{!s.enabled ? " (complete 1st sem first)" : ""}
                    </option>
                  ))}
                </select>
                {availableSemesters.find(s => s.value === "2nd" && !s.enabled) && (
                  <p className="field-hint" style={{ marginTop: 4, color: "#b89f90", fontSize: 11 }}>
                    Generate 1st semester schedules first before proceeding to 2nd semester.
                  </p>
                )}
              </div>

              {autoConflicts.length > 0 && (
                <div className="conflict-box">
                  <div className="conflict-header">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Conflicts Detected</span>
                  </div>
                  <ul className="conflict-list">
                    {autoConflicts.map((c, i) => (
                      <li key={i} className="conflict-note">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="outline-btn" onClick={() => { setShowAutoModal(false); setAutoConflicts([]); }}>Cancel</button>
              <button className="primary-btn" onClick={handleAutoGenerate} disabled={generating}>
                {generating ? (
                  <><span className="spinner-sm"></span> Generating...</>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                      <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN FACULTY MODAL ── */}
      {showAssignModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedSchedule.faculty ? "Change Faculty" : "Assign Faculty"}</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="assign-info">
                {selectedSchedule.course?.course_code} —{" "}
                {selectedSchedule.class_type?.toUpperCase()} ·{" "}
                {selectedSchedule.section?.section_name}
              </p>
              <div className="field">
                <label>Faculty Member</label>
                <select value={assignForm.faculty_id} onChange={(e) => { setAssignForm({ faculty_id: e.target.value }); setAssignError(""); }}>
                  <option value="">Select faculty</option>
                  {faculty
                    .filter((f) => f.user?.role === "faculty")
                    .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.first_name} {f.last_name}
                    </option>
                  ))}
                </select>
              </div>
              {assignError && (
                <div className="conflict-box">
                  <div className="conflict-header">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Schedule Conflict</span>
                  </div>
                  <p className="conflict-note">{assignError}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="outline-btn" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={saveAssignment} disabled={assigning}>
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

    </div>
  );
}
