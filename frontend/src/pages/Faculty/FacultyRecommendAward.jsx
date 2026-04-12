import { useEffect, useState } from "react";
import "../../styles/Faculty/FacultyRecommendAward.css";
import axios from "axios";

export default function FacultyRecommendAward() {
  const [activeTab, setActiveTab] = useState("pending");
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student: "",
    award: "",
    category: "",
    description: ""
  });

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/faculty/awards");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/faculty/awards", formData);
      setShowModal(false);
      setFormData({ student: "", award: "", category: "", description: "" });
      const res = await axios.get("http://localhost:8000/api/faculty/awards");
      setAwards(res.data);
    } catch (err) {
      console.error("Failed to submit award:", err);
    }
  };

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Recommend Awards</h2>
          <p className="page-sub">
            Recommend students for academic achievements and awards.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Recommend Student
        </button>
      </div>

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
                  Submitted on · {a.date}
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
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recommend Student for Award</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  value={formData.student}
                  onChange={(e) =>
                    setFormData({ ...formData, student: e.target.value })
                  }
                  required
                  placeholder="Enter student name"
                />
              </div>
              <div className="form-group">
                <label>Award Type</label>
                <select
                  value={formData.award}
                  onChange={(e) =>
                    setFormData({ ...formData, award: e.target.value })
                  }
                  required
                >
                  <option value="">Select award</option>
                  <option value="Dean's List">Dean's List</option>
                  <option value="Best Research Paper">Best Research Paper</option>
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Leadership Award">Leadership Award</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="">Select category</option>
                  <option value="Academic">Academic</option>
                  <option value="Research">Research</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Community Service">Community Service</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the student's achievement..."
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Recommendation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}