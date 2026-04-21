import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardService } from "../../services";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import styles from "../../styles/Faculty/FacultyRecommendAward.module.css";

const cx = (...names) =>
  names.filter(Boolean).map(n => styles[n]).filter(Boolean).join(" ");

const TABS = [
  { key: "all",      label: "All"      },
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_META = {
  pending:  { bg: "#fffbeb", color: "#f59e0b", border: "#fde68a", label: "Pending Approval" },
  approved: { bg: "#ecfdf5", color: "#10b981", border: "#a7f3d0", label: "Approved"         },
  rejected: { bg: "#fef2f2", color: "#ef4444", border: "#fecaca", label: "Rejected"         },
};

const AVATAR_COLORS = ["#FF6B1A", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
const avatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (first = "", last = "") =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";

const EMPTY_FORM = { awardName: "", description: "", date_received: "" };

function StarIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function FacultyRecommendAward() {
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);

  const [activeTab,        setActiveTab]        = useState("all");
  const [showModal,        setShowModal]        = useState(false);
  const [selectedDetail,   setSelectedDetail]   = useState(null);
  const [form,             setForm]             = useState(EMPTY_FORM);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch,    setStudentSearch]    = useState("");
  const [dropdownOpen,     setDropdownOpen]     = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [toast,            setToast]            = useState(null);

  // ── Queries ──
  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["faculty-awards"],
    queryFn: async () => {
      const res = await awardService.getFacultyAwards();
      return res.ok ? (res.data ?? []) : [];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: myStudentsData = {} } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.FACULTY.MY_STUDENTS);
      return res.ok ? (res.data ?? {}) : {};
    },
  });

  const allStudents = myStudentsData.students ?? [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ──
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const counts = useMemo(() => ({
    all:      awards.length,
    pending:  awards.filter(a => a.status === "pending").length,
    approved: awards.filter(a => a.status === "approved").length,
    rejected: awards.filter(a => a.status === "rejected").length,
  }), [awards]);

  const filteredAwards = useMemo(() =>
    activeTab === "all" ? awards : awards.filter(a => a.status === activeTab),
    [awards, activeTab]
  );

  const filteredStudentOptions = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return allStudents;
    return allStudents.filter(s => {
      const name = `${s.last_name ?? ""} ${s.first_name ?? ""}`.toLowerCase();
      return name.includes(term) ||
        (s.user?.student_number ?? "").toLowerCase().includes(term) ||
        (s.section?.section_name ?? "").toLowerCase().includes(term);
    });
  }, [allStudents, studentSearch]);

  const toggleStudent = (s) => {
    setSelectedStudents(prev =>
      prev.some(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]
    );
  };

  const resetModal = () => {
    setForm(EMPTY_FORM);
    setSelectedStudents([]);
    setStudentSearch("");
    setDropdownOpen(false);
  };

  // ── Submit — one award per selected student ──
  const handleSubmit = async () => {
    if (!selectedStudents.length || !form.awardName || !form.date_received) {
      showToast("error", "Select at least one student and fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        selectedStudents.map(s =>
          awardService.giveByFaculty({ student_id: s.id, ...form })
        )
      );
      const allOk = results.every(r => r.ok);
      if (allOk) {
        showToast("success", `Award submitted for ${selectedStudents.length} student${selectedStudents.length > 1 ? "s" : ""}.`);
        setShowModal(false);
        resetModal();
        queryClient.invalidateQueries({ queryKey: ["faculty-awards"] });
      } else {
        const firstErr = results.find(r => !r.ok);
        showToast("error", firstErr?.message || "Some submissions failed.");
      }
    } catch {
      showToast("error", "Failed to submit award.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* ── Toast ── */}
      {toast && (
        <div className={cx("toast", `toast-${toast.type}`)}>
          {toast.type === "success"
            ? <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          }
          {toast.message}
        </div>
      )}

      {/* ── Header ── */}
      <div className={styles["page-header"]}>
        <div>
          <h2 className={styles.title}>Recommend Awards</h2>
          <p className={styles.subtitle}>Nominate students for academic achievements. Submissions require Chair / Dean approval.</p>
        </div>
        <button className={styles["record-btn"]} onClick={() => { resetModal(); setShowModal(true); }}>
          + Recommend Student
        </button>
      </div>

      {/* ── Stats ── */}
      <div className={styles["mini-stats"]}>
        {[
          { label: "Total Submitted", color: "#FF6B1A", iconBg: "#fff5ef", count: counts.all,      icon: <StarIcon size={20} /> },
          { label: "Pending Approval",color: "#f59e0b", iconBg: "#fffbeb", count: counts.pending,  icon: <ClockIcon size={20} /> },
          { label: "Approved",        color: "#10b981", iconBg: "#ecfdf5", count: counts.approved, icon: <CheckIcon size={20} /> },
          { label: "Rejected",        color: "#ef4444", iconBg: "#fef2f2", count: counts.rejected, icon: <XIcon size={20} /> },
        ].map(card => (
          <div className={styles["mini-stat-card"]} key={card.label}>
            <div className={styles["mini-stat-border"]} style={{ background: card.color }} />
            <div className={styles["mini-stat-content"]}>
              <div className={styles["mini-stat-icon"]} style={{ background: card.iconBg, color: card.color }}>
                {card.icon}
              </div>
              <div className={styles["mini-stat-info"]}>
                <span className={styles["mini-stat-value"]} style={{ color: card.color }}>
                  {isLoading ? "—" : card.count}
                </span>
                <span className={styles["mini-stat-label"]}>{card.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className={styles["table-wrapper"]}>
        {/* Tabs toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t.key}
                className={cx("tab", activeTab === t.key && "tab-active")}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className={styles["tab-count"]}>{counts[t.key]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className={styles["table-loader"]}>
            <div className={styles.spinner} />
            <p>Loading awards...</p>
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className={styles["empty-msg"]}>
            No awards in this category.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Award</th>
                <th>Date Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAwards.map(a => {
                const meta = STATUS_META[a.status] ?? STATUS_META.pending;
                const color = avatarColor(a.student?.last_name ?? "");
                const ini = initials(a.student?.first_name, a.student?.last_name);
                return (
                  <tr
                    key={a.id}
                    className={styles["row-hover"]}
                    onClick={() => setSelectedDetail(a)}
                  >
                    <td>
                      <div className={styles["student-cell"]}>
                        <div className={styles.avatar} style={{ background: color }}>{ini}</div>
                        <div className={styles.meta}>
                          <p className={styles.name}>
                            {a.student?.first_name} {a.student?.last_name}
                          </p>
                          <p className={styles.section}>
                            {a.student?.program?.program_code ?? "—"}
                            {a.student?.section?.section_name ? ` · ${a.student.section.section_name}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles["award-name"]}>{a.awardName}</span>
                    </td>
                    <td className={styles["date-text"]}>{formatDate(a.date_received)}</td>
                    <td>
                      <span
                        className={styles["status-pill"]}
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                      >
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Recommend Modal ── */}
      {showModal && (
        <div className={styles["modal-backdrop"]} onClick={() => !saving && (setShowModal(false), resetModal())}>
          <div className={styles["modal-box"]} onClick={e => e.stopPropagation()}>

            <div className={styles["modal-header"]}>
              <div className={styles["modal-header-left"]}>
                <div className={styles["modal-icon"]}>
                  <StarIcon size={18} />
                </div>
                <div>
                  <h3 className={styles["modal-title"]}>Recommend Student for Award</h3>
                  <p className={styles["modal-sub"]}>Submissions require Chair / Dean approval before being awarded.</p>
                </div>
              </div>
              <button className={styles["close-x"]} onClick={() => { setShowModal(false); resetModal(); }} disabled={saving}>
                &times;
              </button>
            </div>

            <div className={styles["modal-content"]}>

              {/* Student multi-select */}
              <div className={styles["modal-section-label"]}>Students</div>
              <div className={styles["modal-grid"]}>
                <div className={cx("modal-field", "full")} ref={dropdownRef}>
                  <label>Select Students <span className={styles.req}>*</span></label>
                  <div className={styles["student-multi-select"]}>
                    <div
                      className={styles["student-multi-trigger"]}
                      onClick={() => setDropdownOpen(p => !p)}
                    >
                      {selectedStudents.length
                        ? `${selectedStudents.length} student${selectedStudents.length > 1 ? "s" : ""} selected`
                        : "Search and select students..."}
                    </div>
                    {dropdownOpen && (
                      <div className={styles["student-dropdown-panel"]}>
                        <input
                          className={styles["student-search-input"]}
                          type="text"
                          placeholder="Search by name, student number, or section..."
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          autoFocus
                        />
                        <div className={styles["student-option-list"]}>
                          {filteredStudentOptions.length === 0 ? (
                            <p className={styles["no-students"]}>No students found.</p>
                          ) : filteredStudentOptions.map(s => {
                            const checked = selectedStudents.some(x => x.id === s.id);
                            return (
                              <label key={s.id} className={cx("student-option-item", checked && "student-option-checked")}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleStudent(s)}
                                />
                                <span>
                                  {s.last_name}, {s.first_name}
                                  <span className={styles["option-meta"]}>
                                    {s.user?.student_number ? ` · ${s.user.student_number}` : ""}
                                    {s.section?.section_name ? ` · ${s.section.section_name}` : ""}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedStudents.length > 0 && (
                    <div className={styles["selected-chips"]}>
                      {selectedStudents.map(s => (
                        <span key={s.id} className={styles.chip}>
                          {s.first_name} {s.last_name}
                          <button
                            className={styles["chip-remove"]}
                            onClick={() => toggleStudent(s)}
                            type="button"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Award details */}
              <div className={styles["modal-section-label"]}>Award Details</div>
              <div className={styles["modal-grid"]}>
                <div className={cx("modal-field", "full")}>
                  <label>Award / Achievement Title <span className={styles.req}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Best Research Paper, Dean's Lister"
                    value={form.awardName}
                    onChange={e => setForm({ ...form, awardName: e.target.value })}
                  />
                </div>
                <div className={styles["modal-field"]}>
                  <label>Date Received <span className={styles.req}>*</span></label>
                  <input
                    type="date"
                    value={form.date_received}
                    onChange={e => setForm({ ...form, date_received: e.target.value })}
                  />
                </div>
                <div className={cx("modal-field", "full")}>
                  <label>Description <span className={styles.optional}>(optional)</span></label>
                  <textarea
                    rows="3"
                    placeholder="Briefly describe the achievement or reason for nomination..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles["approval-note"]}>
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                This recommendation will be submitted as <strong>pending</strong> and requires Chair or Dean approval.
                {selectedStudents.length > 1 && ` One award entry will be created for each of the ${selectedStudents.length} selected students.`}
              </div>
            </div>

            <div className={styles["modal-actions"]}>
              <button className={styles["btn-cancel"]} onClick={() => { setShowModal(false); resetModal(); }} disabled={saving}>
                Cancel
              </button>
              <button
                className={styles["btn-submit"]}
                onClick={handleSubmit}
                disabled={saving || !selectedStudents.length || !form.awardName || !form.date_received}
              >
                {saving
                  ? "Submitting..."
                  : `Submit${selectedStudents.length > 1 ? ` for ${selectedStudents.length} Students` : " Recommendation"}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedDetail && (() => {
        const a = selectedDetail;
        const meta = STATUS_META[a.status] ?? STATUS_META.pending;
        const color = avatarColor(a.student?.last_name ?? "");
        const ini = initials(a.student?.first_name, a.student?.last_name);
        return (
          <div className={styles["modal-backdrop"]} onClick={() => setSelectedDetail(null)}>
            <div className={styles["modal-box"]} onClick={e => e.stopPropagation()}>
              <div className={styles["modal-header"]}>
                <div className={styles["modal-header-left"]}>
                  <div className={styles.avatar} style={{ background: color, width: 38, height: 38, borderRadius: 10, fontSize: 14 }}>{ini}</div>
                  <div>
                    <h3 className={styles["modal-title"]}>{a.awardName}</h3>
                    <p className={styles["modal-sub"]}>
                      {a.student?.first_name} {a.student?.last_name}
                      {a.student?.program?.program_code ? ` · ${a.student.program.program_code}` : ""}
                    </p>
                  </div>
                </div>
                <button className={styles["close-x"]} onClick={() => setSelectedDetail(null)}>&times;</button>
              </div>

              <div className={styles["modal-content"]}>
                <div className={styles["detail-grid"]}>
                  <div className={styles["detail-card"]}>
                    <label>Status</label>
                    <span
                      className={styles["status-pill"]}
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className={styles["detail-card"]}>
                    <label>Date Received</label>
                    <p>{formatDate(a.date_received)}</p>
                  </div>
                  <div className={styles["detail-card"]}>
                    <label>Section</label>
                    <p>{a.student?.section?.section_name ?? "—"}</p>
                  </div>
                  <div className={styles["detail-card"]}>
                    <label>Issued By</label>
                    <p>{a.issued_by ?? "—"}</p>
                  </div>
                </div>

                {a.description && (
                  <div className={styles["detail-group"]}>
                    <label>Description</label>
                    <p className={styles["desc-box"]}>{a.description}</p>
                  </div>
                )}

                {a.action_taken && a.status === "rejected" && (
                  <div className={styles["detail-group"]}>
                    <label>Rejection Reason</label>
                    <p className={styles["desc-box"]} style={{ color: "#ef4444", background: "#fef2f2" }}>
                      {a.action_taken}
                    </p>
                  </div>
                )}
              </div>

              <div className={styles["modal-actions"]}>
                <button className={styles["btn-cancel"]} onClick={() => setSelectedDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
