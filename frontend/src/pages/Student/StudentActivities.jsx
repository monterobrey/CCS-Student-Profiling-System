import React, { useState } from "react";
import "../../styles/Student/StudentActivities.css";

const typeColor = (t) =>
  ({ Competition: "#FF6B1A", Seminar: "#3b82f6", Community: "#10b981", Workshop: "#8b5cf6", Sports: "#f59e0b", Other: "#6b7280" }[t] || "#6b7280");

const typeIcon = (t) => {
  const icons = {
    Competition: '<path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
    Seminar: '<rect x="3" y="3" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M8 17h4M10 14v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    Community: '<circle cx="10" cy="6" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    default: '<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/>',
  };
  return icons[t] || icons.default;
};

const StudentActivities = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", org: "", date: "", type: "Seminar" });
  const [activities, setActivities] = useState([
    { title: "ICPEP.SE Hackathon", org: "ICPEP.SE", date: "March 2026", type: "Competition" },
    { title: "Annual JS Summit 2026", org: "GDSC Campus", date: "February 2026", type: "Seminar" },
    { title: "Campus Clean Drive", org: "BLGF Campus", date: "January 2026", type: "Community" },
  ]);

  const addActivity = () => {
    if (!form.title) return;
    setActivities([{ ...form }, ...activities]);
    setForm({ title: "", org: "", date: "", type: "Seminar" });
    setShowForm(false);
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h2 className="sa-page-title">Non-Academic Activities</h2>
          <p className="sa-page-sub">Extracurriculars, events, seminars, and competitions.</p>
        </div>
        <button className="sa-primary-btn" onClick={() => setShowForm(!showForm)}>+ Log Activity</button>
      </div>

      {showForm && (
        <div className="sa-pcard">
          <div className="sa-pcard-header"><h3>Log New Activity</h3></div>
          <div className="sa-pcard-body">
            <div className="sa-form-grid">
              <div className="sa-form-group">
                <label>Activity Title</label>
                <input type="text" placeholder="e.g. JS Summit 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="sa-form-group">
                <label>Organization / Host</label>
                <input type="text" placeholder="e.g. GDSC Campus" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} />
              </div>
              <div className="sa-form-group">
                <label>Date</label>
                <input type="text" placeholder="e.g. March 2026" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="sa-form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>Competition</option>
                  <option>Seminar</option>
                  <option>Community</option>
                  <option>Workshop</option>
                  <option>Sports</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="sa-form-actions">
              <button className="sa-primary-btn" onClick={addActivity}>Save</button>
              <button className="sa-ghost-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="sa-activities-grid">
        {activities.length === 0 ? (
          <div className="sa-empty-state">No activities logged yet.</div>
        ) : (
          activities.map((act, i) => (
            <div className="sa-activity-card" key={i}>
              <div className="sa-act-top">
                <div className="sa-act-icon-wrap" style={{ background: typeColor(act.type) + "18" }}>
                  <svg viewBox="0 0 20 20" fill="none" style={{ color: typeColor(act.type) }}
                    dangerouslySetInnerHTML={{ __html: typeIcon(act.type) }} />
                </div>
                <span className="sa-act-badge" style={{ background: typeColor(act.type) + "18", color: typeColor(act.type) }}>
                  {act.type}
                </span>
              </div>
              <p className="sa-act-title">{act.title}</p>
              <p className="sa-act-org">{act.org}</p>
              <p className="sa-act-date">{act.date}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentActivities;