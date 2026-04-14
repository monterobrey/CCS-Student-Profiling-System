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

  const filteredAwards = useMemo(() =>
    activeTab === "all" ? awards : awards.filter(a => a.status === activeTab),
    [awards, activeTab]
  );

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

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Award Approvals</h2>
          <p className="page-sub">Review, approve, and give awards to students in your department.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Give Award
        </button>
      </div>

      {/* TABS */}
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

      {/* LIST */}
      {isLoading ? (
        <div className="loading-state"><div className="spinner" /><p>Loading awards...</p></div>
      ) : (
        <div className="awards-list">
          {filteredAwards.length === 0 ? (
            <div className="empty-state">No awards in this category.</div>
          ) : (
            filteredAwards.map(a => (
              <div className="ach-card" key={a.id}>
                <div className="ach-icon">⭐</div>
                <div className="ach-info">
                  <p className="ach-title">{a.awardName}</p>
                  <p className="ach-student">
                    {a.student?.first_name} {a.student?.last_name} · {a.student?.program?.program_code}
                  </p>
                  <p className="ach-meta">
                    {a.applied_by
                      ? `Given by ${a.recommender?.name ?? "Admin"}`
                      : "Student application"
                    } · {formatDate(a.date_received)}
                  </p>
                  {a.action_taken && (
                    <p className="ach-reason">Reason: {a.action_taken}</p>
                  )}
                </div>
                <div className="ach-right">
                  <span className={`ach-status as-${a.status}`}>{a.status}</span>
                  {a.status === "pending" && (
                    <div className="ach-actions">
                      <button className="approve-btn" onClick={() => handleApprove(a.id)}>Approve</button>
                      <button className="reject-btn" onClick={() => { setRejectId(a.id); setRejectReason(""); }}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

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
              <button className="reject-btn" onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
