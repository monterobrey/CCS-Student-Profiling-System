import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import '../../styles/Dean/DeanDashboard.css';

export default function DeanDashboard() {
  const [activeViolationsCount, setActiveViolationsCount] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [chartData, setChartData] = useState([
    { sem: "1st '22", gwa: 2.14, pct: 38 }, { sem: "2nd '22", gwa: 2.08, pct: 50 },
    { sem: "1st '23", gwa: 2.01, pct: 60 }, { sem: "2nd '23", gwa: 1.96, pct: 68 },
    { sem: "1st '24", gwa: 1.91, pct: 75 }, { sem: "2nd '24", gwa: 1.87, pct: 85 }
  ]);
  const [topStudents, setTopStudents] = useState([]);
  const [deanViolations, setDeanViolations] = useState([]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let timeMsg = 'morning';
    if (hour >= 12 && hour < 18) timeMsg = 'afternoon';
    else if (hour >= 18 || hour < 5) timeMsg = 'evening';
    return `Good ${timeMsg}, Dean`;
  }, []);

  const stats = useMemo(() => {
    const totalStudents = topStudents.length; // Placeholder, should come from API
    const totalFaculty = 0; // Placeholder
    const avgGwa = 0; // Placeholder
    const totalAwards = 0; // Placeholder

    return [
      { 
        label: 'Total Students', 
        value: totalStudents.toString(), 
        delta: 'Real-time sync', 
        deltaClass: 'positive', 
        fill: '100%', 
        iconBg: '#fff5ef', 
        iconColor: '#FF6B1A', 
        route: '/students', 
        iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' 
      },
      { 
        label: 'Total Faculty', 
        value: totalFaculty.toString(), 
        delta: 'Active members', 
        deltaClass: 'positive', 
        fill: '100%', 
        iconBg: '#eff6ff', 
        iconColor: '#3b82f6', 
        route: '/faculty', 
        iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1M6 13v-3a1 1 0 011-1h4a1 1 0 011-1v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' 
      },
      { 
        label: 'Dept. Avg GWA', 
        value: avgGwa > 0 ? avgGwa.toFixed(2) : 'N/A', 
        delta: 'Target: 1.75', 
        deltaClass: (avgGwa > 0 && avgGwa <= 1.75) ? 'positive' : 'warning', 
        fill: avgGwa > 0 ? (Math.max(0, Math.min(100, (3 - avgGwa) / (3 - 1) * 100)) + '%') : '0%', 
        iconBg: '#f5f3ff', 
        iconColor: '#8b5cf6', 
        iconPath: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' 
      },
      { 
        label: 'With Violations', 
        value: activeViolationsCount.toString(), 
        delta: 'Active cases', 
        deltaClass: 'negative', 
        fill: totalStudents > 0 ? (Math.min(100, (activeViolationsCount / totalStudents) * 100) + '%') : '0%', 
        iconBg: '#fff1f2', 
        iconColor: '#ef4444', 
        iconPath: '<path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' 
      },
      { 
        label: 'Awards Logged', 
        value: totalAwards.toString(), 
        delta: 'Recognitions', 
        deltaClass: 'positive', 
        fill: '100%', 
        iconBg: '#fffbeb', 
        iconColor: '#f59e0b', 
        iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' 
      }
    ];
  }, [activeViolationsCount, topStudents]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/analytics/summary');
        const data = response.data || {};
        
        if (data.chart_data) setChartData(data.chart_data);
        setTopStudents(data.top_students || []);
        setDeanViolations(data.recent_violations || []);
        setPendingApprovalsCount(data.pending_approvals || 0);
        setActiveViolationsCount(data.active_violations || 0);
      } catch (err) {
        console.error('Failed to fetch dean analytics:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-home">
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-bg-shape shape-2"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow"><span className="eyebrow-dot"></span>Academic Year 2026-2027 · 2nd Semester</p>
            <h2 className="hero-greeting">{greeting} 👋</h2>
            <p className="hero-desc">You have <strong>{pendingApprovalsCount} pending approvals</strong> and <strong>{activeViolationsCount} student violations</strong> requiring attention this week.</p>
            <div className="hero-actions">
              <button className="hero-btn-primary">Pending Approvals <span className="hero-btn-badge">{pendingApprovalsCount}</span></button>
              <button className="hero-btn-ghost">Generate Report</button>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-stat-card"><span className="hsc-label">This Week</span><span className="hsc-value">{activeViolationsCount + pendingApprovalsCount}</span><span className="hsc-sub">Activities logged</span></div>
            <div className="hero-stat-card accent"><span className="hsc-label">Pending</span><span className="hsc-value">{pendingApprovalsCount}</span><span className="hsc-sub">Awaiting review</span></div>
          </div>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div 
              key={stat.label} 
              className={`stat-card ${stat.route ? 'clickable' : ''}`}
              onClick={stat.route ? () => window.location.href = stat.route : undefined}
            >
              <div className="stat-top">
                <span className="stat-label">{stat.label}</span>
                <div className="stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                  <svg viewBox="0 0 18 18" fill="none" dangerouslySetInnerHTML={{ __html: stat.iconPath }}></svg>
                </div>
              </div>
              <div className="stat-bottom">
                <span className="stat-value">{stat.value}</span>
                <span className={`stat-delta ${stat.deltaClass}`}>{stat.delta}</span>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: stat.fill, background: stat.iconColor }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bottom-grid">
        <div className="card chart-card">
          <div className="card-header">
            <div><h3 className="card-title">Academic Performance Trends</h3><p className="card-sub">Average GWA per semester</p></div>
            <a href="#" className="card-link">Full report →</a>
          </div>
          <div className="chart-bars">
            {chartData.map((bar, i) => (
              <div key={i} className="chart-bar-col">
                <div className="chart-bar-wrap">
                  <div className={`chart-bar-fill ${i === chartData.length - 1 ? 'current' : ''}`} style={{ height: bar.pct + '%' }}>
                    <span className="chart-tooltip">{bar.sem}: {bar.gwa}</span>
                  </div>
                </div>
                <span className="chart-bar-label">{bar.sem}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-dot current"></span><span className="legend-text">Current sem</span>
            <span className="legend-dot"></span><span className="legend-text">Previous</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><h3 className="card-title">Top Performing Students</h3><p className="card-sub">Ranked by GWA · current semester</p></div>
            <a href="#" className="card-link">View all →</a>
          </div>
          <div className="student-list">
            {topStudents.map((s, i) => (
              <div key={i} className="student-row">
                <span className="rank">{i + 1}</span>
                <div className="student-avatar" style={{ background: s.color }}>{s.name.charAt(0)}</div>
                <div className="student-info"><p className="student-name">{s.name}</p><p className="student-course">{s.course}</p></div>
                <span className={`student-tag ${s.tagClass}`}>{s.tag}</span>
                <span className="student-gwa">{s.gwa}</span>
              </div>
            ))}
            {topStudents.length === 0 && <div className="empty-state-msg">No top performing students recorded yet.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><h3 className="card-title">Student Violations</h3><p className="card-sub">Active cases this semester</p></div>
            <a href="#" className="card-link">View all →</a>
          </div>
          <div className="violation-list">
            {deanViolations.map((v, i) => (
              <div key={i} className="violation-row">
                <div className="violation-avatar" style={{ background: v.color }}>{v.name.charAt(0)}</div>
                <div className="violation-info"><p className="violation-name">{v.name}</p><p className="violation-type">{v.type}</p></div>
                <span className={`violation-badge ${v.severityClass}`}>{v.severity}</span>
              </div>
            ))}
            {deanViolations.length === 0 && <div className="empty-state-msg">No active student violations.</div>}
          </div>
          {activeViolationsCount > 2 && (
            <div className="violation-alert">
              <svg viewBox="0 0 16 16" fill="none"><path d="M8 5v4M8 11.5v.5M2.5 14h11a1 1 0 00.87-1.5l-5.5-9.5a1 1 0 00-1.74 0l-5.5 9.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              <span>{activeViolationsCount - 2} more cases need review</span>
              <button onClick={() => window.location.href = '/violations'}>Review Now →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}