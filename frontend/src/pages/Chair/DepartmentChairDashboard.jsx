import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Chair/DepartmentChairDashboard.css';

const ChairDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState({ name: 'Chair' });

  const [loading, setLoading] = useState(true);

  const [chairStats, setChairStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    avgGwa: '0.00',
    activeViolations: 0,
    pendingAwards: 0
  });

  const [chairTopStudents, setChairTopStudents] = useState([]);

  const [chairPendingAwards, setChairPendingAwards] = useState([]);

  const [chairChartData, setChairChartData] = useState([]);

  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/analytics/summary');
        const data = response.data;
        
        setChairStats({
          totalStudents: data.total_students,
          totalFaculty: data.total_faculty,
          avgGwa: data.dept_avg_gwa.toFixed(2),
          activeViolations: data.active_violations,
          pendingAwards: data.pending_verifications
        });

        setChairTopStudents(data.top_students);
        setChairPendingAwards(data.pending_achievements.map(a => ({
          student: a.student,
          award: a.achievement,
          color: a.color
        })));
        setChairChartData(data.chart_data);

        setStats([
          { label: 'Total Students', value: data.total_students.toString(), delta: 'Enrolled', deltaClass: 'positive', fill: '100%', iconBg: '#fff5ef', iconColor: '#FF6B1A', route: '/students', iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
          { label: 'Total Faculty', value: data.total_faculty.toString(), delta: 'Active', deltaClass: 'positive', fill: '100%', iconBg: '#eff6ff', iconColor: '#3b82f6', route: '/faculty', iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1M6 13v-3a1 1 0 011-1h4a1 1 0 011-1v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
          { label: 'Dept Avg GWA', value: data.dept_avg_gwa.toFixed(2), delta: 'This semester', deltaClass: 'positive', fill: '75%', iconBg: '#f5f3ff', iconColor: '#8b5cf6', route: '/chair/performance', iconPath: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' },
          { label: 'Active Violations', value: data.active_violations.toString(), delta: 'This semester', deltaClass: 'negative', fill: '20%', iconBg: '#fff1f2', iconColor: '#ef4444', route: '/chair/violations', iconPath: '<path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
          { label: 'Pending Awards', value: data.pending_verifications.toString(), delta: 'To approve', deltaClass: 'warning', fill: '35%', iconBg: '#fffbeb', iconColor: '#f59e0b', route: '/chair/awards', iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' }
        ]);
      } catch (err) {
        console.error('Failed to fetch chair summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="dashboard-home">Loading...</div>;
  }

  return (
    <div className="dashboard-home">
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-bg-shape shape-2"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow"><span className="eyebrow-dot"></span>Academic Year 2026-2027 · 2nd Semester</p>
            <h2 className="hero-greeting">Good morning, {user.name} 👋</h2>
            <p className="hero-desc">
              Department avg GWA is <strong>{chairStats.avgGwa}</strong>. 
              You have <strong>{chairStats.pendingAwards} awards</strong> awaiting approval and <strong>{chairStats.activeViolations} active violations</strong> this semester.
            </p>
            <div className="hero-actions">
              <Link to="/students" className="hero-btn-primary">
                <svg viewBox="0 0 18 18" fill="none" style={{ width: '14px', height: '14px' }}>
                  <path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                View Students
              </Link>
              <Link to="/chair/reports" className="hero-btn-ghost">Generate Report</Link>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-stat-card">
              <span className="hsc-label">Total Students</span>
              <span className="hsc-value">{chairStats.totalStudents}</span>
              <span className="hsc-sub">Enrolled</span>
            </div>
            <div className="hero-stat-card accent">
              <span className="hsc-label">Avg GWA</span>
              <span className="hsc-value">{chairStats.avgGwa}</span>
              <span className="hsc-sub">Department</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className={`stat-card ${stat.route ? 'clickable' : ''}`}
            onClick={() => stat.route && navigate(stat.route)}
          >
            <div className="stat-top">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                <svg viewBox="0 0 18 18" fill="none" dangerouslySetInnerHTML={{ __html: stat.iconPath }} />
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

      <div className="bottom-grid">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Academic Performance Trends</h3>
              <p className="card-sub">Department avg GWA per semester</p>
            </div>
            <Link to="/chair/performance" className="card-link">Full report →</Link>
          </div>
          <div className="chart-bars">
            {chairChartData.map((bar, i) => (
              <div className="chart-bar-col" key={i}>
                <div className="chart-bar-wrap">
                  <div 
                    className={`chart-bar-fill ${i === chairChartData.length - 1 ? 'current' : ''}`} 
                    style={{ height: `${bar.pct}%` }}
                  >
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
            <Link to="/students" className="card-link">View all →</Link>
          </div>
          <div className="student-list">
            {chairTopStudents.map((s, i) => (
              <div className="student-row" key={i}>
                <span className="rank">{i + 1}</span>
                <div className="student-avatar" style={{ background: s.color }}>{s.name.charAt(0)}</div>
                <div className="student-info">
                  <p className="student-name">{s.name}</p>
                  <p className="student-course">{s.course}</p>
                </div>
                <span className="student-tag tag-green">{s.tag}</span>
                <span className="student-gwa">{s.gwa}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><h3 className="card-title">Pending Award Approvals</h3><p className="card-sub">Awaiting your review</p></div>
            <Link to="/chair/awards" className="card-link">View all →</Link>
          </div>
          <div className="student-list">
            {chairPendingAwards.map((ach) => (
              <div className="student-row" key={ach.award + ach.student}>
                <div className="student-avatar" style={{ background: ach.color }}>{ach.student.charAt(0)}</div>
                <div className="student-info">
                  <p className="student-name">{ach.student}</p>
                  <p className="student-course">{ach.award}</p>
                </div>
                <span className="student-tag tag-orange">Pending</span>
              </div>
            ))}
          </div>
          <div className="violation-alert">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 1l1.5 4.5H14l-4 2.9 1.5 4.6L8 10.2 4.5 13l1.5-4.6-4-2.9h4.5L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{chairStats.pendingAwards} awards need your approval</span>
            <Link to="/chair/awards" className="approve-now-link">Approve Now →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChairDashboard;