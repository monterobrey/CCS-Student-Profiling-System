import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardService, studentService } from "../../services";
import "../../styles/Chair/DepartmentChairAward.css";

const TABS = [
  { key: "all",      label: "All"      },
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const EMPTY_FORM = {
  student_id:    "",
  awardName:     "",
  description:   "",
  date_received: "",
};

export default function DepartmentChairAward() {
  const queryClient = useQueryClient();

  const [activeTab,    setActiveTab]    = useState("pending");
  const [search,       setSearch]       = useState(""); // NEW: Search state
  const [showModal,    setShowModal]    = useState(false);
  const [rejectId,     setRejectId]     = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── Cached queries ──
  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["awards"],
    queryFn: async () => {
      const res = await awardService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await studentService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  /* ===========================
     HELPERS
  =========================== */

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  // NEW: Filtering logic now includes search text
  const filteredAwards = useMemo(() => {
    let result = awards;
    
    // 1. Filter by Tab
    if (activeTab !== "all") {
      result = result.filter(a => a.status === activeTab);
    }
    
    // 2. Filter by Search input
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
  }, [awards, activeTab, search]);

  const counts = useMemo(() => ({
    all:      awards.length,
    pending:  awards.filter(a => a.status === "pending").length,
    approved: awards.filter(a => a.status === "approved").length,
    rejected: awards.filter(a => a.status === "rejected").length,
  }), [awards]);

  /* ===========================
     GIVE AWARD (Chair → auto-approved)
  =========================== */

  const handleGive = async () => {
    if (!form.student_id || !form.awardName || !form.date_received) {
      showToast("error", "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await awardService.give(form);
      if (res.ok) {
        showToast("success", res.message || "Award given and approved.");
        setShowModal(false);
        setForm(EMPTY_FORM);
        queryClient.setQueryData(["awards"], (old = []) => [res.data, ...old]);
      } else {
        showToast("error", res.message || "Failed to give award.");
      }
    } catch {
      showToast("error", "Failed to give award.");
    } finally {
      setSaving(false);
    }
  };

  /* ===========================
     APPROVE
  =========================== */

  const handleApprove = async (id) => {
    try {
      const res = await awardService.approve(id);
      if (res.ok) {
        showToast("success", "Award approved.");
        queryClient.setQueryData(["awards"], (old = []) =>
          old.map(a => a.id === res.data.id ? res.data : a)
        );
        queryClient.invalidateQueries({ queryKey: ["dean-summary"] });
      } else {
        showToast("error", res.message || "Failed to approve.");
      }
    } catch {
      showToast("error", "Failed to approve.");
    }
  };

  /* ===========================
     REJECT
  =========================== */

  const handleReject = async () => {
    try {
      const res = await awardService.reject(rejectId, rejectReason);
      if (res.ok) {
        showToast("success", "Award rejected.");
        setRejectId(null);
        setRejectReason("");
        queryClient.setQueryData(["awards"], (old = []) =>
          old.map(a => a.id === res.data.id ? res.data : a)
        );
      } else {
        showToast("error", res.message || "Failed to reject.");
      }
    } catch {
      showToast("error", "Failed to reject.");
    }
  };

  /* ===========================
     JSX
  =========================== */

  return (
    <div className="page">

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER (Renamed class to avoid the global dark banner bug) */}
      <div className="award-header-clean">
        <div>
          <h2 className="page-title">Award Approvals</h2>
          <p className="page-sub">Review, approve, and give awards to students in your department.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Give Award
        </button>
      </div>

      {/* CONTROLS: Tabs & Search */}
      <div className="controls-row">
        <div className="filter-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`filter-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && <span className="tab-count">{counts[t.key]}</span>}
            </button>
          ))}
        </div>

          <div className="search-wrap">
            <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
              <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="#a38d82" strokeWidth="2" strokeLinecap="round"/>
            </svg>

            <input 
              type="text" 
              placeholder="Search student or award..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

              {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* LIST / DATA TABLE */}
      {isLoading ? (
        <div className="loading-state"><div className="spinner" /><p>Loading awards...</p></div>
      ) : (
        <div className="awards-table-container">

          {/* TABLE HEADER */}
          <div className="ach-row ach-header">
            <div className="ach-col">Award</div>
            <div className="ach-col">Student</div>
            <div className="ach-col">Date</div>
            <div className="ach-col">Status</div>
            <div className="ach-col action-col">Action</div>
          </div>

          {filteredAwards.length === 0 ? (
            <div className="empty-state">
              <p>No awards found.</p>
              <span>Try adjusting filters or search.</span>
            </div>
          ) : (
            <div className="awards-list">
              {filteredAwards.map(a => (
                <div className="ach-row" key={a.id}>
                  
                  {/* Award Info */}
                  <div className="ach-col ach-info-col">
                    <div className="ach-icon">⭐</div>
                    <div>
                      <p className="ach-title">{a.awardName}</p>
                      <p className="ach-meta">
                        {a.applied_by ? `Recommender: ${a.recommender?.name ?? "Admin"}` : "Student Application"}
                      </p>
                    </div>
                  </div>

                  {/* Student */}
                  <div className="ach-col">
                    <p className="ach-student-name">
                      {a.student?.first_name} {a.student?.last_name}
                    </p>
                    <p className="ach-student-prog">
                      {a.student?.program?.program_code}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="ach-col">
                    <p className="ach-date">{formatDate(a.date_received)}</p>
                    {a.action_taken && (
                      <p className="ach-reason" title={a.action_taken}>
                        Note: {a.action_taken}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="ach-col">
                    <span className={`ach-status as-${a.status}`}>
                      {a.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="ach-col action-col">
                    {a.status === "pending" ? (
                      <div className="ach-actions">
                        <button className="btn-approve" onClick={() => handleApprove(a.id)}>
                          Approve
                        </button>
                        <button className="btn-reject" onClick={() => {
                          setRejectId(a.id);
                          setRejectReason("");
                        }}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="ach-resolved">Resolved</span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS (Keep exactly as they were, they are fine!) */}
      {/* GIVE AWARD MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Give Award to Student</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={saving}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Student <span className="req">*</span></label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.last_name}, {s.first_name} — {s.program?.program_code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Award Name <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Dean's List"
                  value={form.awardName}
                  onChange={e => setForm({ ...form, awardName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the achievement..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Date Received <span className="req">*</span></label>
                <input
                  type="date"
                  value={form.date_received}
                  onChange={e => setForm({ ...form, date_received: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleGive} disabled={saving}>
                {saving ? "Saving..." : "Give Award"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Award</h3>
              <button className="modal-close" onClick={() => setRejectId(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Reason (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide a reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn-reject" onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}