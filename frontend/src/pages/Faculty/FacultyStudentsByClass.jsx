import { useEffect, useState } from "react";
import "../../styles/Faculty/FacultyStudentsByClass.css";
import axios from "axios";

export default function FacultyStudentsByClass() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/faculty/students-by-class"
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // group tabs dynamically
  const tabs = [
    { key: "all", label: "All" },
    ...Array.from(new Set(data.map((d) => d.course))).map((c) => ({
      key: c,
      label: c,
    })),
  ];

  const filtered =
    selectedFilter === "all"
      ? data
      : data.filter((d) => d.course === selectedFilter);

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Students</h2>
          <p className="page-sub">
            Students grouped by course and year level under your advisory.
          </p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="filter-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`filter-tab ${
              selectedFilter === t.key ? "active" : ""
            }`}
            onClick={() => setSelectedFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="student-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No students found.</div>
        ) : (
          filtered.map((s) => (
            <div className="student-card" key={s.id}>
              <div className="student-avatar">
                {s.name?.charAt(0)}
              </div>

              <div className="student-info">
                <p className="student-name">{s.name}</p>
                <p className="student-meta">
                  {s.course} · {s.year_level}
                </p>
                <p className="student-sub">
                  ID: {s.student_id} · GWA: {s.gwa}
                </p>
              </div>

              <div className="student-right">
                <span className="gwa-badge">
                  {s.gwa}
                </span>

                <span
                  className={`status ${
                    s.gwa <= 2.0
                      ? "good"
                      : s.gwa <= 2.5
                      ? "warning"
                      : "danger"
                  }`}
                >
                  {s.gwa <= 2.0
                    ? "Excellent"
                    : s.gwa <= 2.5
                    ? "Average"
                    : "At Risk"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}