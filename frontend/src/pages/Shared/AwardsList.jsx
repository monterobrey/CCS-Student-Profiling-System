import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, ROLES } from "../../context/AuthContext";
import { awardService } from "../../services";

const TABS = [
  { key: "all",      label: "All"      },
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AwardsList() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const isDean = role === ROLES.DEAN;

  const [activeTab,    setActiveTab]    = useState("pending");
  const [rejectId,     setRejectId]     = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast,        setToast]        = useState(null);

  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["awards"],
    queryFn: async () => {
      const res = await awardService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

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

  return (
    <div className="page">

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <div>
          <h2 className="page-title">Awards & Recognition</h2>
          <p className="page-sub">
            {isDean ? "Review and approve award nominations across all departments." : "View all student award records."}
          </p>
        </div>
      </div>

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
                    {a.student?.first_name} {a.student?.last_name} · {a.student?.program?.program_code} · {a.student?.section?.section_name}
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
                  {isDean && a.status === "pending" && (
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

      {/* REJECT MODAL */}
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
