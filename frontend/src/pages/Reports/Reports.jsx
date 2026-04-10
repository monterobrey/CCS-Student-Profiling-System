import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { analyticsService } from "../../services";
import "./Reports.css";

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getAcademicPerformance();
      const data = response?.data || {};
      
      setReports([
        {
          id: "users",
          title: "User Statistics",
          description: "Total users, by role breakdown",
          icon: { bg: "#ecfeff", color: "#0891b2", path: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
          data: data?.summary || null,
        },
        {
          id: "students",
          title: "Student Performance",
          description: "Academic statistics and GWA trends",
          icon: { bg: "#f0fdf4", color: "#16a34a", path: "M22 12h-4l-3 9L9 3l-3 9H2" },
          data: data?.avg_gwa_by_year || null,
        },
        {
          id: "violations",
          title: "Violation Summary",
          description: "Student violations by type",
          icon: { bg: "#fef2f2", color: "#dc2626", path: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" },
          data: data?.violations_by_type || null,
        },
        {
          id: "awards",
          title: "Awards & Recognition",
          description: "Student awards and achievements",
          icon: { bg: "#fffbeb", color: "#d97706", path: "M12 15l-2 5 2-1 2 1-2-5zM19 9l-6 6-3-3" },
          data: data?.recent_violations || null,
        },
      ]);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Reports</h1>
          <p>System reports and analytics - Admin access only</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchReports}>Retry</button>
        </div>
      )}

      <div className="reports-grid">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className="report-icon" style={{ background: report.icon.bg, color: report.icon.color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={report.icon.path} />
              </svg>
            </div>
            <div className="report-content">
              <h3>{report.title}</h3>
              <p>{report.description}</p>
              {report.data && (
                <span className="report-date">Data available</span>
              )}
            </div>
            <button className="report-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="admin-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          Viewing as <strong>{user?.name || "Admin"}</strong> ({user?.role || "admin"})
        </span>
      </div>
    </div>
  );
}