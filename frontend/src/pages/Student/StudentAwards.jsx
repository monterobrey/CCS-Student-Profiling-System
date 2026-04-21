import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { awardService } from "../../services";
import "../../styles/Student/StudentAwards.css";

const EMPTY_FORM = { awardName: "", category: "", description: "", academic_year: "" };

const today = () => new Date().toISOString().split("T")[0];

const CATEGORIES = [
  { value: "Academic Honor",      emoji: "🎓", desc: "Latin honors, Dean's list" },
  { value: "Competition",         emoji: "🏅", desc: "Hackathons, quiz bees, sports" },
  { value: "Research / Paper",    emoji: "🔬", desc: "Thesis, publications, research" },
  { value: "Leadership / Service",emoji: "🤝", desc: "Org awards, community service" },
  { value: "Extra Curricular",    emoji: "🎭", desc: "Arts, culture, campus events" },
];

const ACADEMIC_YEARS = [
  "AY 2026–27 · 1st Sem",
  "AY 2026–27 · 2nd Sem",
  "AY 2025–26 · 2nd Sem",
  "AY 2025–26 · 1st Sem",
  "AY 2024–25 · 2nd Sem",
  "AY 2024–25 · 1st Sem",
];

const STATUS_CONFIG = {
  approved: { color: "#10b981", label: "Approved" },
  pending:  { color: "#f59e0b", label: "Pending Approval" },
  rejected: { color: "#ef4444", label: "Rejected" },
};

const AwardIcon = ({ color }) => (
  <svg viewBox="0 0 20 20" fill="none" style={{ color }}>
    <path
      d="M10 2l2 6h6l-5 3.5 2 6L10 14.5l-5 3.5 2-6L2 8h6l2-6z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const StudentAwards = () => {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const { id }      = useParams();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Cached query ──
  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["student-awards"],
    queryFn: async () => {
      const res = await awardService.getMyAwards();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  

  // ── Detail view derived from URL param ──
  const viewingAward = id ? awards.find((a) => String(a.id) === String(id)) : null;

  const openDetail  = (award) => navigate(`/student/awards/${award.id}`);
  const closeDetail = ()      => navigate("/student/awards");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  /* ===========================
     APPLY
  =========================== */
  const submitApplication = async () => {
    if (!form.awardName) {
      showToast("error", "Award name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await awardService.apply({
        awardName:     form.awardName,
        category:      form.category      || undefined,
        description:   form.description   || undefined,
        date_received: today(),
        academic_year: form.academic_year || undefined,
      });
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

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* HEADER */}
      <div className="saw-page-header">
        <div>
          <h2 className="saw-page-title">My Achievements</h2>
          <p className="saw-page-sub">Your submitted and approved academic achievements.</p>
        </div>
        <button className="saw-primary-btn" onClick={() => setShowApplyModal(true)}>
          <svg viewBox="0 0 20 20" fill="none" style={{ width: 15, height: 15 }}>
            <path d="M10 4v12m-6-6h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Apply for Award
        </button>
      </div>

      

      {/* LIST */}
      {isLoading ? (
        <div className="saw-skeleton-list">
          {[1, 2, 3].map((n) => (
            <div className="saw-skeleton-row" key={n} />
          ))}
        </div>
      ) : awards.length === 0 ? (
        <div className="saw-empty-state">
          <div className="saw-empty-icon">
            <svg viewBox="0 0 48 48" fill="none" width="28" height="28">
              <path
                d="M24 4l4.5 13.5H43l-11.5 8.5 4.5 13.5L24 31.5l-12 8 4.5-13.5L5 17.5h14.5L24 4z"
                stroke="#FF6B1A"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h4>No awards yet</h4>
          <p>Submit an application to get your achievements recognized by the department.</p>
          <button className="saw-primary-btn" onClick={() => setShowApplyModal(true)}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: 14, height: 14 }}>
              <path d="M10 4v12m-6-6h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Apply for Award
          </button>
        </div>
      ) : (
        <>
          <p className="saw-section-label">{awards.length} {awards.length === 1 ? "record" : "records"}</p>
          <div className="saw-awards-list">
            {awards.map((award) => {
              const cfg   = STATUS_CONFIG[award.status] ?? { color: "#9ca3af", label: award.status };
              const color = cfg.color;

              return (
                <div className="saw-card" key={award.id} onClick={() => openDetail(award)} style={{ cursor: "pointer" }}>
                  <div className="saw-card-border" style={{ background: color }} />
                  <div className="saw-card-content">
                    <div className="saw-card-header">
                      <div className="saw-card-icon" style={{ background: color + "15", color }}>
                        <AwardIcon color={color} />
                      </div>
                      <span className="saw-card-badge" style={{ background: color + "15", color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <h3 className="saw-card-title">{award.awardName}</h3>
                    <p className="saw-card-meta">
                      {[award.category, award.academic_year, award.issued_by].filter(Boolean).join(" · ") || "No details recorded"}
                    </p>
                    {award.action_taken && award.status === "rejected" && (
                      <p className="saw-card-reason">Reason: {award.action_taken}</p>
                    )}
                    <span className="saw-card-date">{formatDate(award.date_received)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* APPLY MODAL */}
      {showApplyModal && (
        <div
          className="saw-modal-overlay"
          onClick={(e) => {
            if (!submitting && e.target === e.currentTarget) setShowApplyModal(false);
          }}
        >
          <div className="saw-modal">
            {/* HEADER */}
            <div className="saw-modal-header">
              <div className="saw-modal-header-icon">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="#FF6B1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 2l2.2 5H18l-4 3 1.6 5L11 12 5.4 15l1.6-5-4-3h4.8z"/>
                  <path d="M11 15v5M7.5 18l3.5 2.5 3.5-2.5"/>
                </svg>
              </div>
              <div>
                <h3>Apply for an Award</h3>
                <p className="saw-modal-sub">Submit your achievement for faculty review and approval.</p>
              </div>
              <button
                className="saw-close-btn"
                onClick={() => setShowApplyModal(false)}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div className="saw-modal-body">

              {/* Category pills */}
              <div className="saw-form-group">
                <label>Category</label>
                <div className="saw-cat-pills">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`saw-cat-pill${form.category === cat.value ? " saw-cat-pill--active" : ""}`}
                      onClick={() => setForm({ ...form, category: form.category === cat.value ? "" : cat.value })}
                    >
                      <span>{cat.emoji}</span>
                      {cat.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Award title */}
              <div className="saw-form-group">
                <label>
                  Award / Achievement Title <span className="saw-req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best in Capstone, Cum Laude, 1st Place Hackathon"
                  maxLength={100}
                  value={form.awardName}
                  onChange={(e) => setForm({ ...form, awardName: e.target.value })}
                />
                <span className="saw-char-count">{form.awardName.length}/100</span>
              </div>

              {/* Academic Year */}
              <div className="saw-form-group">
                <label>Academic Year</label>
                <select
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                >
                  <option value="">Select semester</option>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="saw-form-group">
                <label>Brief Description</label>
                <textarea
                  rows="3"
                  placeholder="Briefly describe what this award is for..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Info note */}
              <div className="saw-info-note">
                <span>ℹ️</span>
                <p>Your faculty adviser will review this application. Attach supporting documents (certificates, official results) if required. Incomplete submissions may be returned.</p>
              </div>

            </div>

            {/* FOOTER */}
            <div className="saw-modal-footer">
              <button
                className="saw-ghost-btn"
                onClick={() => setShowApplyModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="saw-primary-btn"
                onClick={submitApplication}
                disabled={submitting || !form.awardName}
              >
                {submitting ? "Submitting..." : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 6.5L5.5 10 11 3"/>
                    </svg>
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingAward && (() => {
        const cfg   = STATUS_CONFIG[viewingAward.status] ?? { color: "#9ca3af", label: viewingAward.status };
        const color = cfg.color;
        const catEmoji = CATEGORIES.find(c => c.value === viewingAward.category)?.emoji ?? "🏆";
        return (
          <div className="saw-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}>
            <div className="saw-modal saw-detail-modal">

              {/* ── HERO BANNER ── */}
              <div className="saw-detail-hero" style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`, borderBottom: `3px solid ${color}30` }}>
                <div className="saw-detail-hero-icon" style={{ background: color + "22", border: `2px solid ${color}40` }}>
                  <span style={{ fontSize: 28 }}>{catEmoji}</span>
                </div>
                <div className="saw-detail-hero-text">
                  <h3 className="saw-detail-title">{viewingAward.awardName}</h3>
                  <div className="saw-detail-hero-meta">
                    <span className="saw-award-badge" style={{ background: color + "20", color, fontSize: 11, padding: "3px 10px" }}>
                      {cfg.label}
                    </span>
                    {viewingAward.category && <span className="saw-detail-chip">{viewingAward.category}</span>}
                    {viewingAward.academic_year && <span className="saw-detail-chip">{viewingAward.academic_year}</span>}
                  </div>
                </div>
                <button className="saw-close-btn" onClick={closeDetail}>×</button>
              </div>

              {/* ── INFO ROWS ── */}
              <div className="saw-detail-body">
                <div className="saw-detail-row">
                  <span className="saw-detail-row-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    {viewingAward.status === "approved" ? "Date Received" : "Date Applied For"}
                  </span>
                  <span className="saw-detail-row-value">{formatDate(viewingAward.date_received)}</span>
                </div>

                <div className="saw-detail-row">
                  <span className="saw-detail-row-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Submitted By
                  </span>
                  <span className="saw-detail-row-value">{viewingAward.issued_by || "—"}</span>
                </div>

                <div className="saw-detail-row">
                  <span className="saw-detail-row-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    Submitted On
                  </span>
                  <span className="saw-detail-row-value">{formatDate(viewingAward.created_at)}</span>
                </div>

                {viewingAward.description && (
                  <div className="saw-detail-row saw-detail-row--block">
                    <span className="saw-detail-row-label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      Description
                    </span>
                    <p className="saw-detail-row-desc">{viewingAward.description}</p>
                  </div>
                )}

                {viewingAward.action_taken && viewingAward.status === "rejected" && (
                  <div className="saw-detail-row saw-detail-row--block saw-detail-row--danger">
                    <span className="saw-detail-row-label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Rejection Reason
                    </span>
                    <p className="saw-detail-row-desc">{viewingAward.action_taken}</p>
                  </div>
                )}
              </div>

              {/* ── FOOTER ── */}
              <div className="saw-modal-footer">
                <button className="saw-ghost-btn" onClick={closeDetail}>Close</button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default StudentAwards;
