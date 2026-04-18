import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, ROLES } from "../../context/AuthContext";
import { awardService } from "../../services";
import "../../styles/Dean/DeanDashboard.css";

const TABS = [
  { key: "all",      label: "All"      },
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const AVATAR_COLORS = [
  "#FF6B1A", "#e85500", "#c94000",
  "#3d1500", "#7c3d1a", "#b85c00",
];

function getAvatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(a) {
  const f = a.student?.first_name?.[0] ?? "";
  const l = a.student?.last_name?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

export default function AwardsList() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const isDean = role === ROLES.DEAN;

  const [activeTab,    setActiveTab]    = useState("all");
  const [search,       setSearch]       = useState("");
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
    d ? new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }) : "—";

  const counts = useMemo(() => ({
    all:      awards.length,
    pending:  awards.filter(a => a.status === "pending").length,
    approved: awards.filter(a => a.status === "approved").length,
    rejected: awards.filter(a => a.status === "rejected").length,
  }), [awards]);

  const filteredAwards = useMemo(() => {
    let list = activeTab === "all"
      ? awards
      : awards.filter(a => a.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.awardName?.toLowerCase().includes(q) ||
        a.student?.first_name?.toLowerCase().includes(q) ||
        a.student?.last_name?.toLowerCase().includes(q) ||
        a.student?.program?.program_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [awards, activeTab, search]);

  const handleApprove = async (id) => {
    try {
      const res = await awardService.approve(id);
      if (res.ok) {
        showToast("success", "Award approved successfully.");
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

      {/* TOAST */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* PAGE HEADER */}
      <div className="award-header-clean">
        <div>
          <h2 className="page-title">Awards &amp; Recognition</h2>
          <p className="page-sub">
            {isDean
              ? "Review and approve award nominations across all departments."
              : "View all student award records."}
          </p>
        </div>
      </div>

      {/* CONTROLS ROW */}
      <div className="controls-row">
        <div className="filter-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`filter-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className="tab-count">{counts[t.key]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="search-wrap">
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
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading awards...</p>
        </div>
      ) : (
        <div className="awards-table-container">
          <div className="awards-list">

            {/* Header */}
            <div className={`ach-row ach-header${isDean ? " ach-row--dean" : ""}`}>
              <div className="ach-col">Award</div>
              <div className="ach-col">Student</div>
              <div className="ach-col">Date</div>
              <div className="ach-col">Status</div>
              {isDean && <div className="ach-col action-col">Action</div>}
            </div>

            {/* Empty state */}
            {filteredAwards.length === 0 ? (
              <div className="empty-state">
                No awards found.
                <span>
                  {search
                    ? "Try adjusting your search or filters."
                    : "No awards in this category yet."}
                </span>
              </div>
            ) : (
              filteredAwards.map(a => (
                <div
                  key={a.id}
                  className={`ach-row${isDean ? " ach-row--dean" : ""}`}
                >
                  {/* Award */}
                  <div className="ach-col ach-info-col">
                    <div>
                      <p className="ach-title">{a.awardName}</p>
                      <p className="ach-meta">
                        {a.applied_by
                          ? `Given by ${a.recommender?.name ?? "Admin"}`
                          : "Student application"}
                      </p>
                    </div>
                  </div>

                  {/* Student */}
                  <div className="ach-col">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="ss-avatar"
                        style={{ background: getAvatarColor(a.student?.first_name ?? "") }}
                      >
                        {getInitials(a)}
                      </div>
                      <div>
                        <p className="ach-student-name">
                          {a.student?.first_name} {a.student?.last_name}
                        </p>
                        <p className="ach-student-prog">
                          {a.student?.program?.program_code}
                          {a.student?.section?.section_name
                            ? ` · ${a.student.section.section_name}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="ach-col">
                    <p className="ach-date">{formatDate(a.date_received)}</p>
                    {a.action_taken && (
                      <p className="ach-reason">{a.action_taken}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="ach-col">
                    <span className={`ach-status as-${a.status}`}>
                      {a.status}
                    </span>
                  </div>

                  {/* Actions — Dean only */}
                  {isDean && (
                    <div className="ach-col action-col">
                      {a.status === "pending" ? (
                        <div className="ach-actions">
                          <button
                            className="btn-approve"
                            onClick={() => handleApprove(a.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => { setRejectId(a.id); setRejectReason(""); }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="ach-resolved">
                          {a.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
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
              <button className="btn-reject" onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}