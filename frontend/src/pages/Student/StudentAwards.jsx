import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardService } from "../../services";
import "../../styles/Student/StudentAwards.css";

const EMPTY_FORM = { awardName: "", description: "", date_received: "" };

const STATUS_COLORS = {
  approved: "#10b981",
  pending:  "#f59e0b",
  rejected: "#ef4444",
};

const StudentAwards = () => {
  const queryClient = useQueryClient();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState(null);

  // ── Cached query ──
  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["student-awards"],
    queryFn: async () => {
      const res = await awardService.getMyAwards();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  /* ===========================
     APPLY
  =========================== */

  const submitApplication = async () => {
    if (!form.awardName || !form.date_received) {
      showToast("error", "Award name and date are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await awardService.apply(form);
      if (res.ok) {
        showToast("success", "Application submitted. Pending approval.");
        setForm(EMPTY_FORM);
        setShowApplyModal(false);
        queryClient.setQueryData(["student-awards"], (old = []) => [res.data, ...old]);
      } else {
        showToast("error", res.message || "Failed to submit application.");
      }
    } catch {
      showToast("error", "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===========================
     JSX
  =========================== */

  return (
    <div className="saw-page">

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER */}
      <div className="saw-page-header">
        <div>
          <h2 className="saw-page-title">Awards & Recognition</h2>
          <p className="saw-page-sub">All your academic and extracurricular achievements.</p>
        </div>
        <button className="saw-primary-btn" onClick={() => setShowApplyModal(true)}>
          <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16 }}>
            <path d="M10 4v12m-6-6h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Apply for Award
        </button>
      </div>

      {/* LIST */}
      <div className="saw-pcard">
        <div className="saw-pcard-body">
          {isLoading ? (
            <div className="saw-empty-state"><p>Loading awards...</p></div>
          ) : awards.length === 0 ? (
            <div className="saw-empty-state">
              <svg viewBox="0 0 48 48" fill="none" style={{ width: 48, height: 48 }}>
                <path d="M24 4l4.5 13.5H43l-11.5 8.5 4.5 13.5L24 31.5l-12 8 4.5-13.5L5 17.5h14.5L24 4z" stroke="#f0e8e0" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <p>No awards recorded yet.</p>
            </div>
          ) : (
            <div className="saw-awards-list">
              {awards.map((award) => {
                const color = STATUS_COLORS[award.status] ?? "#9ca3af";
                return (
                  <div className="saw-award-row" key={award.id}>
                    <div className="saw-award-icon" style={{ background: color + "18" }}>
                      <svg viewBox="0 0 20 20" fill="none" style={{ color }}>
                        <path d="M10 2l2 6h6l-5 3.5 2 6L10 14.5l-5 3.5 2-6L2 8h6l2-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="saw-award-info">
                      <p className="saw-award-title">{award.awardName}</p>
                      <p className="saw-award-meta">
                        {formatDate(award.date_received)}
                        {award.issued_by ? ` · ${award.issued_by}` : ""}
                      </p>
                      {award.action_taken && award.status === "rejected" && (
                        <p className="saw-award-reason">Reason: {award.action_taken}</p>
                      )}
                    </div>
                    <span className="saw-award-badge" style={{ background: color + "18", color }}>
                      {award.status === "pending"  ? "Pending Approval" : ""}
                      {award.status === "approved" ? "Approved"         : ""}
                      {award.status === "rejected" ? "Rejected"         : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* APPLY MODAL */}
      {showApplyModal && (
        <div className="saw-modal-overlay" onClick={e => { if (!submitting && e.target === e.currentTarget) setShowApplyModal(false); }}>
          <div className="saw-modal">
            <div className="saw-modal-header">
              <div>
                <h3>Apply for Award</h3>
                <p className="saw-modal-sub">Submit your achievement for review and approval.</p>
              </div>
              <button className="saw-close-btn" onClick={() => setShowApplyModal(false)} disabled={submitting}>×</button>
            </div>

            <div className="saw-modal-body">
              <div className="saw-form-group">
                <label>Award / Achievement Title <span className="saw-req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Best Research Paper"
                  value={form.awardName}
                  onChange={e => setForm({ ...form, awardName: e.target.value })}
                />
              </div>
              <div className="saw-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Briefly describe the award or event..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="saw-form-group">
                <label>Date Received <span className="saw-req">*</span></label>
                <input
                  type="date"
                  value={form.date_received}
                  onChange={e => setForm({ ...form, date_received: e.target.value })}
                />
              </div>
            </div>

            <div className="saw-modal-footer">
              <button className="saw-ghost-btn" onClick={() => setShowApplyModal(false)} disabled={submitting}>Cancel</button>
              <button
                className="saw-primary-btn"
                onClick={submitApplication}
                disabled={submitting || !form.awardName || !form.date_received}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentAwards;
