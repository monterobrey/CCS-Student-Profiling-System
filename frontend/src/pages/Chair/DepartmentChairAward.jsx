import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { awardService, studentService } from "../../services";
import styles from "../../styles/Chair/DepartmentChairAward.module.css";

const TABS = [
  { key: "all",      label: "All"      },
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const PREDEFINED_AWARDS = [
  "Dean's List", "President's List", "Academic Excellence Award",
  "Best Thesis Award", "Leadership Award", "Community Service Award",
  "Outstanding Student Award", "Scholar of the Year", "Others",
];

const AVATAR_COLORS = ["#FF6B1A", "#e85500", "#c94000", "#3d1500", "#7c3d1a", "#b85c00"];

const today = () => new Date().toISOString().split("T")[0];

const EMPTY_FORM = {
  student_ids: [], awardName: "", customAward: "", description: "", date_received: today(),
};

function getAvatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(a) {
  const f = a.student?.first_name?.[0] ?? "";
  const l = a.student?.last_name?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function getActionTaker(a) {
  if (!a) return "—";
  const actor = a.approver;
  return actor?.name || actor?.email || (a.approved_by ? `User #${a.approved_by}` : "—");
}

/* ─── Student Selector ──────────────────────────────────── */
function StudentSelector({ students, value, onChange, onRemove, showRemove }) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref               = useRef(null);

  const cx = (...names) =>
    names.filter(Boolean).map(n => styles[n]).filter(Boolean).join(" ");

  const selected = students.find(s => s.id === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return students.slice(0, 30);
    const q = query.toLowerCase();
    return students.filter(s =>
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(q) ||
      s.program?.program_code?.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [students, query]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={styles.studentSelector} ref={ref}>
      <div className={styles.studentSelectorInput} onClick={() => setOpen(o => !o)}>
        {selected
          ? <span className={styles.ssSelected}>{selected.last_name}, {selected.first_name} — {selected.program?.program_code}</span>
          : <span className={styles.ssPlaceholder}>Search student...</span>
        }
        <svg viewBox="0 0 16 16" fill="none" width="12" height="12" style={{ flexShrink: 0 }}>
          <path d="M3 6l5 5 5-5" stroke="#a38d82" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {open && (
        <div className={styles.ssDropdown}>
          <div className={styles.ssSearchWrap}>
            <svg viewBox="0 0 18 18" fill="none" width="13" height="13">
              <path d="M8 14A6 6 0 108 2a6 6 0 000 12zM16 16l-3.5-3.5" stroke="#a38d82" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Type name or program..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className={styles.ssList}>
            {filtered.length === 0
              ? <div className={styles.ssEmpty}>No students found</div>
              : filtered.map(s => (
                  <div
                    key={s.id}
                    className={cx("ssOption", s.id === value && "ssOptionActive")}
                    onClick={() => { onChange(s.id); setOpen(false); setQuery(""); }}
                  >
                    <div className={styles.ssAvatar} style={{ background: getAvatarColor(s.first_name ?? "") }}>
                      {s.first_name?.charAt(0)}
                    </div>
                    <div>
                      <p className={styles.ssName}>{s.last_name}, {s.first_name}</p>
                      <p className={styles.ssProg}>{s.program?.program_code}</p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {showRemove && (
        <button className={styles.ssRemove} onClick={onRemove} title="Remove">✕</button>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */
export default function DepartmentChairAward() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const { id }      = useParams();

  const cx = (...names) =>
    names.filter(Boolean).map(n => styles[n]).filter(Boolean).join(" ");

  const [activeTab,    setActiveTab]    = useState("pending");
  const [search,       setSearch]       = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [rejectId,     setRejectId]     = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);

  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["awards"],
    queryFn: async () => {
      const res = await awardService.getAll();
      return res.ok ? (res.data ?? []).filter(Boolean) : [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await studentService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const resolvedAwardName = form.awardName === "Others" ? form.customAward : form.awardName;

  const addStudentSlot    = () => setForm(f => ({ ...f, student_ids: [...f.student_ids, ""] }));
  const updateStudentSlot = (idx, id) => setForm(f => {
    const ids = [...f.student_ids]; ids[idx] = id; return { ...f, student_ids: ids };
  });
  const removeStudentSlot = (idx) =>
    setForm(f => ({ ...f, student_ids: f.student_ids.filter((_, i) => i !== idx) }));

  const safeAwards = useMemo(() => (awards ?? []).filter(Boolean), [awards]);

  // ── Detail view derived from URL param ──
  const viewingAward = id ? safeAwards.find(a => String(a.id) === String(id)) : null;
  const openDetail   = (a) => navigate(`/department-chair/awards/${a.id}`);
  const closeDetail  = ()  => navigate("/department-chair/awards");

  const filteredAwards = useMemo(() => {
    let result = activeTab === "all" ? safeAwards : safeAwards.filter(a => a?.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.awardName?.toLowerCase().includes(q) ||
        a.student?.first_name?.toLowerCase().includes(q) ||
        a.student?.last_name?.toLowerCase().includes(q) ||
        a.student?.program?.program_code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [safeAwards, activeTab, search]);

  const counts = useMemo(() => ({
    all:      safeAwards.length,
    pending:  safeAwards.filter(a => a?.status === "pending").length,
    approved: safeAwards.filter(a => a?.status === "approved").length,
    rejected: safeAwards.filter(a => a?.status === "rejected").length,
  }), [safeAwards]);

  const handleGive = async () => {
    const validIds = form.student_ids.filter(Boolean);
    if (validIds.length === 0 || !resolvedAwardName) {
      showToast("error", "Please fill in all required fields and select at least one student.");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        validIds.map(id => awardService.give({ ...form, student_id: id, awardName: resolvedAwardName }))
      );
      const allOk = results.every(r => r.ok);
      if (allOk) {
        showToast("success", `Award given to ${validIds.length} student(s).`);
        setShowModal(false);
        setForm(EMPTY_FORM);
        const created = results.map(r => r?.data).filter(Boolean);
        queryClient.setQueryData(["awards"], (old = []) => [...created, ...(old ?? []).filter(Boolean)]);
        queryClient.invalidateQueries({ queryKey: ["awards"] });
        queryClient.invalidateQueries({ queryKey: ["dean-summary"] });
      } else {
        showToast("error", "Some awards failed. Please try again.");
      }
    } catch {
      showToast("error", "Failed to give award.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await awardService.approve(id);
      if (res.ok) {
        showToast("success", "Award approved.");
        queryClient.setQueryData(["awards"], (old = []) =>
          (old ?? []).filter(Boolean).map(a => a.id === res.data.id ? res.data : a)
        );
        queryClient.invalidateQueries({ queryKey: ["dean-summary"] });
      } else showToast("error", res.message || "Failed to approve.");
    } catch { showToast("error", "Failed to approve."); }
  };

  const handleReject = async () => {
    try {
      const res = await awardService.reject(rejectId, rejectReason);
      if (res.ok) {
        showToast("success", "Award rejected.");
        setRejectId(null); setRejectReason("");
        queryClient.setQueryData(["awards"], (old = []) =>
          (old ?? []).filter(Boolean).map(a => a.id === res.data.id ? res.data : a)
        );
      } else showToast("error", res.message || "Failed to reject.");
    } catch { showToast("error", "Failed to reject."); }
  };

  return (
    <div className={styles.page}>

      {toast && <div className={cx("toast", `toast-${toast.type}`)}>{toast.message}</div>}

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Awards &amp; Recognition</h2>
          <p className={styles.pageSub}>Review, approve, and give awards to students in your department.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className={styles.headerBadge}>
            <span className={styles.headerDot} />
            {counts.pending} Pending
          </div>
          <button className={styles.btnPrimary} onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
            + Give Award
          </button>
        </div>
      </div>

      {/* CONTROLS */}
      <div className={styles.controlsRow}>
        <div className={styles.filterTabs}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={cx("filterTab", activeTab === t.key && "active")}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && <span className={styles.tabCount}>{counts[t.key]}</span>}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#b89f90" strokeWidth="1.3"/>
            <path d="M9.5 9.5l2.5 2.5" stroke="#b89f90" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search student or award..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles.searchClear} onClick={() => setSearch("")}>×</button>}
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading awards...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.awardsList}>

            {/* Header */}
            <div className={cx("row", "headerRow")}>
              <div className={styles.col}>Award</div>
              <div className={styles.col}>Student</div>
              <div className={styles.col}>Date</div>
              <div className={styles.col}>Status</div>
              <div className={cx("col", "actionCol")}>Action</div>
            </div>

            {filteredAwards.length === 0 ? (
              <div className={styles.emptyState}>
                No awards found.
                <span>{search ? "Try adjusting your search or filters." : "No awards in this category yet."}</span>
              </div>
            ) : (
              filteredAwards.map(a => (
                <div
                  className={styles.row}
                  key={a.id}
                  onClick={() => openDetail(a)}
                  style={{ cursor: "pointer" }}
                >

                  {/* Award */}
                  <div className={cx("col", "infoCol")}>
                    <div>
                      <p className={styles.awardTitle}>{a.awardName}</p>
                      <p className={styles.awardMeta}>
                        {a.applied_by
                          ? `Given by ${a.recommender?.name ?? "Admin"}`
                          : "Student application"}
                      </p>
                    </div>
                  </div>

                  {/* Student */}
                  <div className={styles.col}>
                    <div className={styles.studentCell}>
                      <div
                        className={styles.avatar}
                        style={{ background: getAvatarColor(a.student?.first_name ?? "") }}
                      >
                        {getInitials(a)}
                      </div>
                      <div>
                        <p className={styles.studentName}>
                          {a.student?.first_name} {a.student?.last_name}
                        </p>
                        <p className={styles.studentMeta}>
                          {a.student?.program?.program_code}
                          {a.student?.section?.section_name ? ` · ${a.student.section.section_name}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className={styles.col}>
                    <p className={styles.date}>{formatDate(a.date_received)}</p>
                    {a.action_taken && <p className={styles.reason}>{a.action_taken}</p>}
                  </div>

                  {/* Status */}
                  <div className={styles.col}>
                    <span className={cx("status", `status-${a.status}`)}>{a.status}</span>
                  </div>

                  {/* Action */}
                  <div className={cx("col", "actionCol")} onClick={e => e.stopPropagation()}>
                    {a.status === "pending" ? (
                      <div className={styles.actions}>
                        <button className={styles.btnApprove} onClick={() => handleApprove(a.id)}>Approve</button>
                        <button className={styles.btnReject} onClick={() => { setRejectId(a.id); setRejectReason(""); }}>Reject</button>
                      </div>
                    ) : (
                      <div className={styles.resolvedBlock}>
                        <span className={styles.resolvedText}>
                          {a.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                        <span className={styles.actionTakenBy}>
                          by {getActionTaker(a)}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GIVE AWARD MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Give Award to Student(s)</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)} disabled={saving}>×</button>
            </div>
            <div className={styles.modalBody}>

              <div className={styles.formGroup}>
                <label>
                  Student(s) <span className={styles.req}>*</span>
                  <span className={styles.labelHint}> — add multiple if needed</span>
                </label>
                {form.student_ids.length === 0 && (
                  <p className={styles.ssHint}>Click "+ Add Student" to begin.</p>
                )}
                {form.student_ids.map((id, idx) => (
                  <div key={idx} className={styles.studentSlot}>
                    <StudentSelector
                      students={students}
                      value={id}
                      onChange={newId => updateStudentSlot(idx, newId)}
                      onRemove={() => removeStudentSlot(idx)}
                      showRemove={form.student_ids.length > 1}
                    />
                  </div>
                ))}
                <button className={styles.btnAddStudent} onClick={addStudentSlot}>
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Add Student
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>Award Name <span className={styles.req}>*</span></label>
                <select
                  className={styles.awardSelect}
                  value={form.awardName}
                  onChange={e => setForm({ ...form, awardName: e.target.value, customAward: "" })}
                >
                  <option value="">Select an award...</option>
                  {PREDEFINED_AWARDS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {form.awardName === "Others" && (
                  <input
                    className={styles.awardCustomInput}
                    type="text"
                    placeholder="Specify award name..."
                    value={form.customAward}
                    onChange={e => setForm({ ...form, customAward: e.target.value })}
                  />
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the achievement..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleGive} disabled={saving}>
                {saving
                  ? "Saving..."
                  : `Give Award${form.student_ids.filter(Boolean).length > 1 ? ` (${form.student_ids.filter(Boolean).length})` : ""}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div className={styles.modalOverlay} onClick={() => setRejectId(null)}>
          <div className={cx("modal", "modalSm")} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reject Award</h3>
              <button className={styles.modalClose} onClick={() => setRejectId(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Reason (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide a reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setRejectId(null)}>Cancel</button>
              <button className={styles.btnReject} onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingAward && (() => {
        const a     = viewingAward;
        const COLOR = { approved: "#10b981", pending: "#f59e0b", rejected: "#ef4444" };
        const LABEL = { approved: "Approved", pending: "Pending Approval", rejected: "Rejected" };
        const color = COLOR[a.status] ?? "#9ca3af";
        const label = LABEL[a.status] ?? a.status;
        return (
          <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeDetail(); }}>
            <div className={cx("modal", "modalSm")} onClick={e => e.stopPropagation()}>

              {/* hero */}
              <div className={styles.detailHero} style={{ background: `linear-gradient(135deg,${color}20 0%,${color}08 100%)`, borderBottom: `3px solid ${color}28` }}>
                <div className={styles.detailHeroIcon} style={{ background: color + "22", border: `2px solid ${color}40` }}>
                  <svg viewBox="0 0 20 20" fill="none" width="22" height="22" style={{ color }}>
                    <path d="M10 2l2 6h6l-5 3.5 2 6L10 14.5l-5 3.5 2-6L2 8h6l2-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.detailHeroText}>
                  <h3 className={styles.detailTitle}>{a.awardName}</h3>
                  <div className={styles.detailHeroMeta}>
                    <span className={cx("status", `status-${a.status}`)}>{label}</span>
                    {a.category     && <span className={styles.detailChip}>{a.category}</span>}
                    {a.academic_year && <span className={styles.detailChip}>{a.academic_year}</span>}
                  </div>
                </div>
                <button className={styles.modalClose} onClick={closeDetail}>×</button>
              </div>

              {/* student block */}
              <div className={styles.detailStudentBlock}>
                <div className={styles.avatar} style={{ background: getAvatarColor(a.student?.first_name ?? ""), width: 40, height: 40, fontSize: 14 }}>
                  {getInitials(a)}
                </div>
                <div>
                  <p className={styles.studentName}>{a.student?.first_name} {a.student?.last_name}</p>
                  <p className={styles.studentMeta}>
                    {a.student?.program?.program_code}
                    {a.student?.section?.section_name ? ` · ${a.student.section.section_name}` : ""}
                  </p>
                </div>
              </div>

              {/* info rows */}
              <div className={styles.detailBody}>
                <div className={styles.detailRow}>
                  <span className={styles.detailRowLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    Date Received
                  </span>
                  <span className={styles.detailRowValue}>{formatDate(a.date_received)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailRowLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {a.applied_by ? "Given By" : "Submitted By"}
                  </span>
                  <span className={styles.detailRowValue}>{a.issued_by || "—"}</span>
                </div>
                {a.recommender?.name && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Recommended By
                    </span>
                    <span className={styles.detailRowValue}>{a.recommender.name}</span>
                  </div>
                )}
                {a.status !== "pending" && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Action Taken By
                    </span>
                    <span className={styles.detailRowValue}>{getActionTaker(a)}</span>
                  </div>
                )}
                {a.description && (
                  <div className={cx("detailRow", "detailRowBlock")}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      Description
                    </span>
                    <p className={styles.detailRowDesc}>{a.description}</p>
                  </div>
                )}
                {a.action_taken && a.status === "rejected" && (
                  <div className={cx("detailRow", "detailRowBlock", "detailRowDanger")}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Rejection Reason
                    </span>
                    <p className={styles.detailRowDesc}>{a.action_taken}</p>
                  </div>
                )}
              </div>

              {/* footer */}
              <div className={styles.modalFooter}>
                {a.status === "pending" && (
                  <>
                    <button className={styles.btnReject} onClick={() => { closeDetail(); setRejectId(a.id); setRejectReason(""); }}>Reject</button>
                    <button className={styles.btnApprove} onClick={() => { handleApprove(a.id); closeDetail(); }}>Approve</button>
                  </>
                )}
                {a.status !== "pending" && (
                  <button className={styles.btnSecondary} onClick={closeDetail}>Close</button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
