        import { useEffect, useState } from "react";
import "../../styles/Chair/DepartmentChairAward.css";
import axios from "axios";

export default function AwardApprovals() {
  const [activeTab, setActiveTab] = useState("pending");
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH DATA FROM BACKEND (NO DUMMY DATA)
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

  const filteredAwards =
    activeTab === "all"
      ? awards
      : awards.filter((a) => a.status === activeTab);

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

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Award Approvals</h2>
          <p className="page-sub">
            Review and approve student award nominations.
          </p>
        </div>
      </div>

      {/* TABS */}
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

      {/* LIST */}
      <div className="awards-list">
        {filteredAwards.length === 0 ? (
          <div className="empty-state">No awards in this category.</div>
        ) : (
          filteredAwards.map((a) => (
            <div className="ach-card" key={a.id}>
              <div
                className="ach-icon"
                style={{ background: a.color + "18", color: a.color }}
              >
                ⭐
              </div>

              <div className="ach-info">
                <p className="ach-title">{a.award}</p>
                <p className="ach-student">
                  {a.student} · {a.course}
                </p>
                <p className="ach-meta">
                  Submitted by {a.faculty} · {a.date}
                </p>
              </div>

              <div className="ach-right">
                <span
                  className="cat-badge"
                  style={{ background: a.color + "18", color: a.color }}
                >
                  {a.category}
                </span>

                <span className={`ach-status as-${a.status}`}>
                  {a.status}
                </span>

                {a.status === "pending" ? (
                  <div className="ach-actions">
                    <button
                      className="approve-btn"
                      onClick={() => updateStatus(a.id, "approved")}
                    >
                      Approve
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => updateStatus(a.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="ach-resolved">
                    {a.status === "approved" ? "Approved" : "Rejected"}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}