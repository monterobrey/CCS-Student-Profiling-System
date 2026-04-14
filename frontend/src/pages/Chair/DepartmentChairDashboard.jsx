import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services';
import '../../styles/Chair/DepartmentChairDashboard.css';

const ChairDashboard = () => {
  const navigate = useNavigate();

  const { data: summaryData = {}, isLoading } = useQuery({
    queryKey: ['dean-summary'],
    queryFn: async () => {
      const res = await analyticsService.getDeanSummary();
      return res.ok ? (res.data ?? {}) : {};
    },
    staleTime: Infinity,
  });

  // GWA distribution scoped to chair's program (reuses academic-performance cache)
  const { data: perfData = {} } = useQuery({
    queryKey: ['academic-performance'],
    queryFn: async () => {
      const res = await analyticsService.getAcademicPerformance();
      return res.ok ? (res.data ?? {}) : {};
    },
    staleTime: Infinity,
  });

  const distribution = useMemo(() => perfData.distribution ?? [], [perfData]);

  const chairStats = useMemo(() => ({
    totalStudents:    summaryData.total_students      ?? 0,
    totalFaculty:     summaryData.total_faculty       ?? 0,
    avgGwa:           summaryData.dept_avg_gwa ? Number(summaryData.dept_avg_gwa).toFixed(2) : '0.00',
    activeViolations: summaryData.active_violations   ?? 0,
    pendingAwards:    summaryData.pending_verifications ?? 0,
  }), [summaryData]);

  const chairTopStudents  = useMemo(() => summaryData.top_students ?? [], [summaryData]);
  const chairPendingAwards = useMemo(() =>
    (summaryData.pending_achievements ?? []).map(a => ({
      student: a.student, award: a.achievement, color: a.color,
    })), [summaryData]);

  const stats = useMemo(() => [
    { label: 'Total Students',    value: chairStats.totalStudents.toString(),    delta: 'Enrolled',      deltaClass: 'positive', fill: '100%', iconBg: '#fff5ef', iconColor: '#FF6B1A', route: '/students',        iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
    { label: 'Total Faculty',     value: chairStats.totalFaculty.toString(),     delta: 'Active',        deltaClass: 'positive', fill: '100%', iconBg: '#eff6ff', iconColor: '#3b82f6', route: '/faculty',         iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
    { label: 'Dept Avg GWA',      value: chairStats.avgGwa,                      delta: 'This semester', deltaClass: 'positive', fill: '75%',  iconBg: '#f5f3ff', iconColor: '#8b5cf6', route: '/chair/performance',iconPath: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' },
    { label: 'Active Violations', value: chairStats.activeViolations.toString(), delta: 'This semester', deltaClass: 'negative', fill: '20%',  iconBg: '#fff1f2', iconColor: '#ef4444', route: '/chair/violations', iconPath: '<path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
    { label: 'Pending Awards',    value: chairStats.pendingAwards.toString(),    delta: 'To approve',   deltaClass: 'warning',  fill: '35%',  iconBg: '#fffbeb', iconColor: '#f59e0b', route: '/chair/awards',     iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' },
  ], [chairStats]);

  if (isLoading) return <div className="faculty-page"><div className="dash-loading"><div className="spinner-lg"></div><p>Loading dashboard...</p></div></div>;

  return (
    <div className="faculty-page">
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-bg-shape shape-2"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow"><span className="eyebrow-dot"></span>Academic Year 2026-2027 · 2nd Semester</p>
            <h2 className="hero-greeting">Good morning, Chair 👋</h2>
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
              <Link to="/department-chair/performance" className="hero-btn-ghost">Generate Report</Link>
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
              <span className="stat-number">{stat.value}</span>
              <span className={`stat-delta ${stat.deltaClass}`}>{stat.delta}</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: stat.fill, background: stat.iconColor }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-grid">
        {/* GWA DISTRIBUTION — scoped to chair's program */}
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">GWA Distribution</h3>
              <p className="card-sub">Students per GWA bracket · your program</p>
            </div>
            <Link to="/department-chair/performance" className="card-link">Full report →</Link>
          </div>
          <div className="distribution-list">
            {distribution.length === 0 ? (
              <p style={{ color: '#b89f90', fontStyle: 'italic', fontSize: 13 }}>No GWA data recorded yet.</p>
            ) : distribution.map((d, i) => (
              <div key={i} className="dist-item">
                <div className="dist-item-meta">
                  <span className="dist-item-range">{d.range}</span>
                  <span className="dist-item-desc">{d.desc}</span>
                </div>
                <div className="dist-item-bar-wrap">
                  <div className="dist-item-bar">
                    <div className="dist-item-fill" style={{ width: d.pct + '%', background: d.color }} />
                  </div>
                </div>
                <div className="dist-item-stats">
                  <span style={{ color: d.color, fontWeight: 700 }}>{d.count}</span>
                  <span className="dist-item-pct">{d.pct}%</span>
                </div>
              </div>
            ))}
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