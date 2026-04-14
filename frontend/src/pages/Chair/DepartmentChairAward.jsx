import { useEffect, useState } from "react";
import "../../styles/Chair/DepartmentChairAward.css";
import axios from "axios";

export default function AwardApprovals() {
  const [activeTab, setActiveTab] = useState("pending");
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/awards");
        setAwards(res.data);
      } catch (err) {
        console.error("Failed to fetch awards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, []);

  const filteredAwards = awards.filter((a) => {
    const matchesTab = activeTab === "all" || a.status === activeTab;
    const matchesSearch = !search || 
      a.award?.toLowerCase().includes(search.toLowerCase()) ||
      a.student?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:8000/api/awards/${id}`, { status });
      setAwards((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const pendingCount = awards.filter(a => a.status === "pending").length;
  const approvedCount = awards.filter(a => a.status === "approved").length;
  const rejectedCount = awards.filter(a => a.status === "rejected").length;
  const totalCount = awards.length;

  if (loading) return <div className="chair-award-page"><div className="page-loader">Loading...</div></div>;

  return (
    <div className="chair-award-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="title">Award Approvals</h2>
          <p className="subtitle">Review and approve student award nominations.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="mini-card accent-blue">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" width="18" height="18">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-value">{totalCount}</span>
            <span className="card-label">Total Awards</span>
          </div>
        </div>

        <div className="mini-card accent-amber">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-value">{pendingCount}</span>
            <span className="card-label">Pending</span>
          </div>
        </div>

        <div className="mini-card accent-green">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="18" height="18">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-value">{approvedCount}</span>
            <span className="card-label">Approved</span>
          </div>
        </div>

        <div className="mini-card accent-red">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="18" height="18">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
          <div className="card-info">
            <span className="card-value">{rejectedCount}</span>
            <span className="card-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="table-actions">
        <input
          type="text"
          className="search-input"
          placeholder="Search by award or student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`filter-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="award-table">
          <thead>
            <tr>
              <th>Award</th>
              <th>Student</th>
              <th>Category</th>
              <th>Faculty</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAwards.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-msg">No awards found.</td>
              </tr>
            ) : (
              filteredAwards.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="award-cell">
                      <div className="award-icon" style={{ background: a.color + "18", color: a.color }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                      </div>
                      <span className="award-name">{a.award}</span>
                    </div>
                  </td>
                  <td>
                    <div className="student-cell">
                      <span className="student-name">{a.student}</span>
                      <span className="student-course">{a.course}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cat-badge" style={{ background: a.color + "18", color: a.color }}>
                      {a.category}
                    </span>
                  </td>
                  <td className="text-muted">{a.faculty}</td>
                  <td className="text-muted">{a.date}</td>
                  <td>
                    <span className={`status-pill ${a.status}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    {a.status === "pending" ? (
                      <div className="action-buttons">
                        <button className="btn-approve" onClick={() => updateStatus(a.id, "approved")}>
                          Approve
                        </button>
                        <button className="btn-reject" onClick={() => updateStatus(a.id, "rejected")}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`resolved-text ${a.status}`}>
                        {a.status === "approved" ? "✓ Approved" : "✕ Rejected"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}