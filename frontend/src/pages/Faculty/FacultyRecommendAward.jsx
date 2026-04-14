import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { awardService } from "../../services";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Faculty/FacultyRecommendAward.css";

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

export default function FacultyRecommendAward() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  // ── Cached queries ──
  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["faculty-awards"],
    queryFn: async () => {
      const res = await awardService.getFacultyAwards();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  // Faculty's own students (from their assigned sections)
  const { data: myStudentsData = {} } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.FACULTY.MY_STUDENTS);
      return res.ok ? (res.data ?? {}) : {};
    },
  });

  const myStudents = myStudentsData.students ?? [];

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

  /* ===========================
     GIVE AWARD (Faculty → pending)
  =========================== */

  const handleSubmit = async () => {
    if (!form.student_id || !form.awardName || !form.date_received) {
      showToast("error", "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await awardService.giveByFaculty(form);
      if (res.ok) {
        showToast("success", res.message || "Award submitted for approval.");
        setShowModal(false);
        setForm(EMPTY_FORM);
        queryClient.setQueryData(["faculty-awards"], (old = []) => [res.data, ...old]);
      } else {
        const firstError = res.errors ? Object.values(res.errors)[0]?.[0] : null;
        showToast("error", firstError || res.message || "Failed to submit award.");
      }
    } catch {
      showToast("error", "Failed to submit award.");
    } finally {
      setSaving(false);
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
          <h2 className="page-title">Recommend Awards</h2>
          <p className="page-sub">Recommend students for academic achievements. Pending Chair/Dean approval.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Recommend Student
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
                  <p className="ach-meta">Submitted · {formatDate(a.date_received)}</p>
                  {a.action_taken && (
                    <p className="ach-reason">Reason: {a.action_taken}</p>
                  )}
                </div>
                <div className="ach-right">
                  <span className={`ach-status as-${a.status}`}>{a.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* RECOMMEND MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recommend Student for Award</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={saving}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Student <span className="req">*</span></label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                  <option value="">Select student</option>
                  {myStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.last_name}, {s.first_name} — {s.section?.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Award Name <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Best Research Paper"
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
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Submitting..." : "Submit Recommendation"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
