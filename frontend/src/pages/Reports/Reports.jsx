import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Reports.css";

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/reports");
      setReports(response.data.data || response.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setReports([]);
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

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon" style={{ background: "#ecfeff", color: "#0891b2" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div className="report-content">
            <h3>User Statistics</h3>
            <p>Total users, by role breakdown</p>
            <span className="report-date">Updated: Today</span>
          </div>
          <button className="report-action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <div className="report-card">
          <div className="report-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="report-content">
            <h3>Academic Performance</h3>
            <p>GWA trends and analytics</p>
            <span className="report-date">Updated: Today</span>
          </div>
          <button className="report-action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <div className="report-card">
          <div className="report-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="report-content">
            <h3>Violation Summary</h3>
            <p>Student violations by type</p>
            <span className="report-date">Updated: Today</span>
          </div>
          <button className="report-action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        <div className="report-card">
          <div className="report-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
          <div className="report-content">
            <h3>Awards & Recognition</h3>
            <p>Student awards and achievements</p>
            <span className="report-date">Updated: Today</span>
          </div>
          <button className="report-action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
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