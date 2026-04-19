import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardService, studentService } from "../../services";
import styles from "../../styles/Chair/DepartmentChairAward.module.css";

const TABS = [
  { key: "all",      label: "All"      },
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const PREDEFINED_AWARDS = [
  "Dean's List",
  "President's List",
  "Academic Excellence Award",
  "Best Thesis Award",
  "Leadership Award",
  "Community Service Award",
  "Outstanding Student Award",
  "Scholar of the Year",
  "Others",
];

const EMPTY_FORM = {
  student_ids:   [],
  awardName:     "",
  customAward:   "",
  description:   "",
  date_received: "",
};

function getActionTaker(a) {
  if (!a) return "—";
  const actor = a.approver;
  return actor?.name || actor?.email || (a.approved_by ? `User #${a.approved_by}` : "—");
}

function StudentSelector({ students, value, onChange, onRemove, showRemove }) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref               = useRef(null);

  const cx = (...names) =>
    names
      .filter(Boolean)
      .map((name) => styles[name])
      .filter(Boolean)
      .join(" ");

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
    <div className={styles["student-selector"]} ref={ref}>
      <div className={styles["student-selector-input"]} onClick={() => setOpen(o => !o)}>
        {selected
          ? <span className={styles["ss-selected"]}>{selected.last_name}, {selected.first_name} — {selected.program?.program_code}</span>
          : <span className={styles["ss-placeholder"]}>Search student...</span>
        }
        <svg viewBox="0 0 16 16" fill="none" width="12" height="12" style={{ flexShrink: 0 }}>
          <path d="M3 6l5 5 5-5" stroke="#a38d82" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {open && (
        <div className={styles["ss-dropdown"]}>
          <div className={styles["ss-search-wrap"]}>
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
          <div className={styles["ss-list"]}>
            {filtered.length === 0
              ? <div className={styles["ss-empty"]}>No students found</div>
              : filtered.map(s => (
                  <div
                    key={s.id}
                    className={cx("ss-option", s.id === value && "ss-option-active")}
                    onClick={() => { onChange(s.id); setOpen(false); setQuery(""); }}
                  >
                    <div className={styles["ss-avatar"]} style={{ background: s.color ?? "#FF6B1A" }}>
                      {s.first_name?.charAt(0)}
                    </div>
                    <div>
                      <p className={styles["ss-name"]}>{s.last_name}, {s.first_name}</p>
                      <p className={styles["ss-prog"]}>{s.program?.program_code}</p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {showRemove && (
        <button className={styles["ss-remove"]} onClick={onRemove} title="Remove">✕</button>
      )}
    </div>
  );
}

export default function DepartmentChairAward() {
  const queryClient = useQueryClient();

  const cx = (...names) =>
    names
      .filter(Boolean)
      .map((name) => styles[name])
      .filter(Boolean)
      .join(" ");

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
    d ? new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }) : "—";

  const resolvedAwardName = form.awardName === "Others" ? form.customAward : form.awardName;

  const addStudentSlot    = () => setForm(f => ({ ...f, student_ids: [...f.student_ids, ""] }));
  const updateStudentSlot = (idx, id) => setForm(f => {
    const ids = [...f.student_ids]; ids[idx] = id; return { ...f, student_ids: ids };
  });
  const removeStudentSlot = (idx) =>
    setForm(f => ({ ...f, student_ids: f.student_ids.filter((_, i) => i !== idx) }));

  const safeAwards = useMemo(() => (awards ?? []).filter(Boolean), [awards]);

  const filteredAwards = useMemo(() => {
    let result = safeAwards;
    if (activeTab !== "all") result = result.filter(a => a?.status === activeTab);
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
    if (validIds.length === 0 || !resolvedAwardName || !form.date_received) {
      showToast("error", "Please fill in all required fields and select at least one student.");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        validIds.map(id =>
          awardService.give({ ...form, student_id: id, awardName: resolvedAwardName })
        )
      );
      const allOk = results.every(r => r.ok);
      if (allOk) {
        showToast("success", `Award given to ${validIds.length} student(s).`);
        setShowModal(false);
        setForm(EMPTY_FORM);
        const created = results
          .map(r => r?.data)
          .filter(Boolean);
        queryClient.setQueryData(["awards"], (old = []) => [
          ...created,
          ...(old ?? []).filter(Boolean),
        ]);
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
          (old ?? [])
            .filter(Boolean)
            .map(a => a.id === res.data.id ? res.data : a)
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
          (old ?? [])
            .filter(Boolean)
            .map(a => a.id === res.data.id ? res.data : a)
        );
      } else showToast("error", res.message || "Failed to reject.");
    } catch { showToast("error", "Failed to reject."); }
  };

  return (
    <div className={styles.page}>

      {toast && <div className={cx("toast", `toast-${toast.type}`)}>{toast.message}</div>}

      {/* HEADER */}
      <div className={styles["award-header-clean"]}>
        <div>
          <h2 className={styles["page-title"]}>Awards</h2>
          <p className={styles["page-sub"]}>Review, approve, and give awards to students in your department.</p>
        </div>
        <button className={styles["btn-primary"]} onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
          + Give Award
        </button>
      </div>

      {/* CONTROLS */}
      <div className={styles["controls-row"]}>
        <div className={styles["filter-tabs"]}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={cx("filter-tab", activeTab === t.key && "active")}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && <span className={styles["tab-count"]}>{counts[t.key]}</span>}
            </button>
          ))}
        </div>
        <div className={styles["search-wrap"]}>
          <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="#a38d82" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search student or award..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles["search-clear"]} onClick={() => setSearch("")}>✕</button>}
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className={styles["loading-state"]}><div className={styles.spinner} /><p>Loading awards...</p></div>
      ) : (
        <div className={styles["awards-table-container"]}>

          {/* Header — inside container so grid aligns */}
          <div className={cx("ach-row", "ach-header")}>
            <div className={styles["ach-col"]}>Award</div>
            <div className={styles["ach-col"]}>Student</div>
            <div className={styles["ach-col"]}>Date</div>
            <div className={styles["ach-col"]}>Status</div>
            <div className={cx("ach-col", "action-col")}>Action</div>
          </div>

          {filteredAwards.length === 0 ? (
            <div className={styles["empty-state"]}>
              <p>No awards found.</p>
              <span>Try adjusting filters or search.</span>
            </div>
          ) : (
            <div className={styles["awards-list"]}>
              {filteredAwards.map(a => (
                <div className={styles["ach-row"]} key={a.id}>

                  {/* Award */}
                  <div className={cx("ach-col", "ach-info-col")}>
                    <div>
                      <p className={styles["ach-title"]}>{a.awardName}</p>
                      <p className={styles["ach-meta"]}>
                        {a.applied_by
                          ? `Recommender: ${a.recommender?.name ?? "Admin"}`
                          : "Student Application"}
                      </p>
                    </div>
                  </div>

                  {/* Student */}
                  <div className={styles["ach-col"]}>
                    <p className={styles["ach-student-name"]}>
                      {a.student?.first_name} {a.student?.last_name}
                    </p>
                    <p className={styles["ach-student-prog"]}>
                      {a.student?.program?.program_code}
                    </p>
                  </div>

                  {/* Date */}
                  <div className={styles["ach-col"]}>
                    <p className={styles["ach-date"]}>{formatDate(a.date_received)}</p>
                    {a.action_taken && (
                      <p className={styles["ach-reason"]} title={a.action_taken}>
                        Note: {a.action_taken}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className={styles["ach-col"]}>
                    <span className={cx("ach-status", `as-${a.status}`)}>{a.status}</span>
                  </div>

                  {/* Action */}
                  <div className={cx("ach-col", "action-col")}>
                    {a.status === "pending" ? (
                      <div className={styles["ach-actions"]}>
                        <button className={styles["btn-approve"]} onClick={() => handleApprove(a.id)}>Approve</button>
                        <button className={styles["btn-reject"]} onClick={() => { setRejectId(a.id); setRejectReason(""); }}>Reject</button>
                      </div>
                    ) : (
                      <div className={styles["ach-resolved-block"]}>
                        <span className={styles["ach-resolved"]}>
                          {a.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                        <span className={styles["ach-action-by"]}>
                          Action taken by {getActionTaker(a)}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* GIVE AWARD MODAL */}
      {showModal && (
        <div className={styles["modal-overlay"]} onClick={() => !saving && setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <h3>Give Award to Student(s)</h3>
              <button className={styles["modal-close"]} onClick={() => setShowModal(false)} disabled={saving}>×</button>
            </div>
            <div className={styles["modal-body"]}>

              <div className={styles["form-group"]}>
                <label>
                  Student(s) <span className={styles.req}>*</span>
                  <span className={styles["label-hint"]}> — add multiple if needed</span>
                </label>
                {form.student_ids.length === 0 && (
                  <p className={styles["ss-hint"]}>Click "+ Add Student" to begin.</p>
                )}
                {form.student_ids.map((id, idx) => (
                  <div key={idx} className={styles["student-slot"]}>
                    <StudentSelector
                      students={students}
                      value={id}
                      onChange={newId => updateStudentSlot(idx, newId)}
                      onRemove={() => removeStudentSlot(idx)}
                      showRemove={form.student_ids.length > 1}
                    />
                  </div>
                ))}
                <button className={styles["btn-add-student"]} onClick={addStudentSlot}>
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Add Student
                </button>
              </div>

              <div className={styles["form-group"]}>
                <label>Award Name <span className={styles.req}>*</span></label>
                <select
                  value={form.awardName}
                  onChange={e => setForm({ ...form, awardName: e.target.value, customAward: "" })}
                  className={styles["award-select"]}
                >
                  <option value="">Select an award...</option>
                  {PREDEFINED_AWARDS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                {form.awardName === "Others" && (
                  <input
                    className={styles["award-custom-input"]}
                    type="text"
                    placeholder="Specify award name..."
                    value={form.customAward}
                    onChange={e => setForm({ ...form, customAward: e.target.value })}
                  />
                )}
              </div>

              <div className={styles["form-group"]}>
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the achievement..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Date Received <span className={styles.req}>*</span></label>
                <input
                  type="date"
                  value={form.date_received}
                  onChange={e => setForm({ ...form, date_received: e.target.value })}
                />
              </div>

            </div>
            <div className={styles["modal-footer"]}>
              <button className={styles["btn-secondary"]} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className={styles["btn-primary"]} onClick={handleGive} disabled={saving}>
                {saving
                  ? "Saving..."
                  : `Give Award${form.student_ids.filter(Boolean).length > 1
                      ? ` (${form.student_ids.filter(Boolean).length})`
                      : ""}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div className={styles["modal-overlay"]} onClick={() => setRejectId(null)}>
          <div className={cx("modal", "modal-sm")} onClick={e => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <h3>Reject Award</h3>
              <button className={styles["modal-close"]} onClick={() => setRejectId(null)}>×</button>
            </div>
            <div className={styles["modal-body"]}>
              <div className={styles["form-group"]}>
                <label>Reason (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide a reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className={styles["modal-footer"]}>
              <button className={styles["btn-secondary"]} onClick={() => setRejectId(null)}>Cancel</button>
              <button className={styles["btn-reject"]} onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}