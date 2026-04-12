import React, { useState } from "react";
import "../../styles/Student/StudentAwards.css";

const StudentAwards = () => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: "", title: "", description: "", file: null, fileName: "" });
  const [awards, setAwards] = useState([
    { title: "Dean's List Awardee", semester: "1st Sem 2025–2026", badge: "Academic", category: "Academic Excellence", color: "#f59e0b", status: "Approved" },
    { title: "Best Research Paper", semester: "2nd Sem 2024–2025", badge: "Research", category: "Research & Innovation", color: "#3b82f6", status: "Approved" },
    { title: "Outstanding Student Leader", semester: "1st Sem 2024–2025", badge: "Leadership", category: "Student Affairs", color: "#10b981", status: "Approved" },
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setForm({ ...form, file, fileName: file.name });
  };

  const submitApplication = () => {
    setSubmitting(true);
    setTimeout(() => {
      setAwards([
        {
          title: form.title,
          semester: "Current Semester",
          badge: form.category,
          category: form.category + " (Pending)",
          color: "#9ca3af",
          status: "Pending",
        },
        ...awards,
      ]);
      setForm({ category: "", title: "", description: "", file: null, fileName: "" });
      setSubmitting(false);
      setShowApplyModal(false);
      alert("Achievement application submitted successfully! It is now pending review.");
    }, 800);
  };

  return (
    <div className="saw-page">
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

      {/* Awards List */}
      <div className="saw-pcard">
        <div className="saw-pcard-body">
          {awards.length === 0 ? (
            <div className="saw-empty-state">
              <svg viewBox="0 0 48 48" fill="none" style={{ width: 48, height: 48 }}>
                <path d="M24 4l4.5 13.5H43l-11.5 8.5 4.5 13.5L24 31.5l-12 8 4.5-13.5L5 17.5h14.5L24 4z" stroke="#f0e8e0" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <p>No awards recorded yet.</p>
            </div>
          ) : (
            <div className="saw-awards-list">
              {awards.map((award, i) => (
                <div className="saw-award-row" key={i}>
                  <div className="saw-award-icon" style={{ background: award.color + "18" }}>
                    <svg viewBox="0 0 20 20" fill="none" style={{ color: award.color }}>
                      <path d="M10 2l2 6h6l-5 3.5 2 6L10 14.5l-5 3.5 2-6L2 8h6l2-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="saw-award-info">
                    <p className="saw-award-title">{award.title}</p>
                    <p className="saw-award-meta">{award.semester} · {award.category}</p>
                  </div>
                  <span className="saw-award-badge" style={{
                    background: award.status === "Pending" ? "#fffbeb" : award.color + "18",
                    color: award.status === "Pending" ? "#d97706" : award.color,
                  }}>
                    {award.status === "Pending" ? "Pending Approval" : award.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showApplyModal && (
        <div className="saw-modal-overlay" onClick={(e) => { if (!submitting && e.target === e.currentTarget) setShowApplyModal(false); }}>
          <div className="saw-modal">
            <div className="saw-modal-header">
              <div>
                <h3>Submit Achievement</h3>
                <p className="saw-modal-sub">Apply to have an award or certification recognized.</p>
              </div>
              <button className="saw-close-btn" onClick={() => setShowApplyModal(false)} disabled={submitting}>×</button>
            </div>

            <div className="saw-modal-body">
              <div className="saw-form-group">
                <label>Award Category <span className="saw-req">*</span></label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select a category...</option>
                  <option value="Academic">Academic Excellence</option>
                  <option value="Leadership">Leadership & Service</option>
                  <option value="Research">Research & Innovation</option>
                  <option value="Athletics">Athletics & Sports</option>
                  <option value="Other">Other Certification</option>
                </select>
              </div>
              <div className="saw-form-group">
                <label>Award/Achievement Title <span className="saw-req">*</span></label>
                <input type="text" placeholder="e.g., Best Research Paper" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="saw-form-group">
                <label>Description & Context</label>
                <textarea rows="3" placeholder="Briefly describe the award or event..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="saw-form-group">
                <label>Proof / Certificate <span className="saw-req">*</span></label>
                <div className="saw-file-upload-box">
                  <input type="file" onChange={handleFileUpload} accept=".pdf,.jpg,.png" id="cert-upload" className="saw-file-input" />
                  <label htmlFor="cert-upload" className="saw-file-label">
                    <svg viewBox="0 0 20 20" fill="none" style={{ width: 24, height: 24, marginBottom: 8, color: "#FF6B1A" }}>
                      <path d="M4 16v1a2 2 0 002 2h8a2 2 0 002-2v-1m-4-8l-4-4-4 4m4-4v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{form.fileName || "Click to upload PDF or Image"}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="saw-modal-footer">
              <button className="saw-ghost-btn" onClick={() => setShowApplyModal(false)} disabled={submitting}>Cancel</button>
              <button className="saw-primary-btn" onClick={submitApplication}
                disabled={submitting || !form.category || !form.title}>
                {submitting && <span className="saw-spinner-sm"></span>}
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