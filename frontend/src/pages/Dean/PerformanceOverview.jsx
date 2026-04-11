import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Dean/PerformanceOverview.css";

export default function PerformanceOverview() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [distribution, setDistribution] = useState([]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/dean/analytics/performance");
      const data = response.data;

      setSummary([
        { label: "DEAN'S LIST", value: data.summary?.deans_list || 0, tag: "Dean's List", tagBg: "#f0fdf4", tagColor: "#16a34a" },
        { label: "SATISFACTORY", value: data.summary?.satisfactory || 0, tag: "Satisfactory", tagBg: "#eff6ff", tagColor: "#3b82f6" },
        { label: "AT RISK", value: data.summary?.at_risk || 0, tag: "At Risk", tagBg: "#fff7ed", tagColor: "#ea580c" },
        { label: "FAILED SUBJECTS", value: data.summary?.failed || 0, tag: "Failed Subjects", tagBg: "#fff1f2", tagColor: "#e11d48" }
      ]);

      setDistribution(data.distribution || []);
    } catch (err) {
      console.error("Failed to fetch performance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "dean" || role === "department_chair") {
      fetchPerformanceData();
    }
  }, [role]);

  const trend = [
    { sem: "1st '22", pct: 45 },
    { sem: "2nd '22", pct: 55 },
    { sem: "1st '23", pct: 50 },
    { sem: "2nd '23", pct: 65 },
    { sem: "1st '24", pct: 70 },
    { sem: "2nd '24", pct: 85 }
  ];

  return (
    <div className="performance-page">
      <div className="page-header">
        <div className="header-left">
          <h2 className="section-title">Academic Performance</h2>
          <p className="section-desc">Monitor GWA trends, Dean's List qualifiers, and at-risk students.</p>
        </div>
      </div>

      <div className="summary-grid">
        {summary.map((item, index) => (
          <div className="summary-card" key={index}>
            <div className="summary-content">
              <span className="summary-label">{item.label}</span>
              <div className="summary-main">
                <span className="summary-value">{item.value}</span>
                <span className="summary-unit">students</span>
              </div>
              <span className="summary-tag" style={{ background: item.tagBg, color: item.tagColor }}>
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="performance-content">
        <div className="perf-card distribution-card">
          <div className="card-header">
            <h3 className="card-title">GWA Distribution</h3>
            <p className="card-sub">Students per GWA bracket</p>
          </div>
          <div className="distribution-list">
            {distribution.map((row, index) => (
              <div className="dist-row" key={index}>
                <div className="dist-label-wrap">
                  <span className="dist-range">{row.range}</span>
                  <span className="dist-desc">({row.desc})</span>
                </div>
                <div className="dist-bar-wrap">
                  <div className="dist-bar">
                    <div className="dist-fill" style={{ width: row.pct + "%", background: row.color }}></div>
                  </div>
                  <span className="dist-stats"><strong>{row.count}</strong> ({row.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="perf-card trend-card">
          <div className="card-header">
            <h3 className="card-title">Semester Trend</h3>
            <p className="card-sub">Average GWA over 6 semesters</p>
          </div>
          <div className="trend-chart">
            <div className="chart-bars">
              {trend.map((bar, index) => (
                <div className="chart-col" key={index}>
                  <div className="bar-wrap">
                    <div className="bar-fill" style={{ height: bar.pct + "%" }}></div>
                  </div>
                  <span className="bar-label">{bar.sem}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="trend-footer">
            <div className="trend-stat">
              <span className="ts-label">Highest GWA</span>
              <span className="ts-value">1.21</span>
            </div>
            <div className="trend-stat">
              <span className="ts-label">Lowest GWA</span>
              <span className="ts-value">3.45</span>
            </div>
            <div className="trend-stat">
              <span className="ts-label">Dept. Average</span>
              <span className="ts-value">1.87</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
