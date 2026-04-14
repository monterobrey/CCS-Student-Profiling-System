import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services';
import '../../styles/Dean/DeanDashboard.css';

export default function DeanDashboard() {

  // ── Cached query — staleTime: Infinity, never auto-refetches ──
  const { data: summary = {}, isLoading } = useQuery({
    queryKey: ['dean-summary'],
    queryFn: async () => {
      const res = await analyticsService.getDeanSummary();
      return res.ok ? (res.data ?? {}) : {};
    },
    staleTime: Infinity,
  });

  // Reuse the dean-report cache for GWA distribution (shares cache with Reports Overview)
  const { data: report = {} } = useQuery({
    queryKey: ['dean-report'],
    queryFn: async () => {
      const res = await analyticsService.getDeanReport();
      return res.ok ? (res.data ?? {}) : {};
    },
    staleTime: Infinity,
  });

  const distribution = useMemo(() => report.distribution ?? [], [report]);

  const {
    total_students      = 0,
    total_faculty       = 0,
    active_violations   = 0,
    total_awards        = 0,
    dept_avg_gwa        = 0,
    top_students        = [],
    recent_violations   = [],
    chart_data          = [],
    pending_accounts    = 0,
    pending_verifications = 0,
  } = summary;

  // pending_approvals = pending accounts + pending verifications
  const pendingApprovalsCount = pending_accounts + pending_verifications;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) return 'Good afternoon, Dean';
    if (hour >= 18 || hour < 5)  return 'Good evening, Dean';
    return 'Good morning, Dean';
  }, []);

  const stats = useMemo(() => [
    {
      label: 'Total Students',
      value: total_students.toString(),
      delta: 'Real-time sync',
      deltaClass: 'positive',
      fill: '100%',
      iconBg: '#fff5ef', iconColor: '#FF6B1A',
      iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    },
    {
      label: 'Total Faculty',
      value: total_faculty.toString(),
      delta: 'Active members',
      deltaClass: 'positive',
      fill: '100%',
      iconBg: '#eff6ff', iconColor: '#3b82f6',
      iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    },
    {
      label: 'Dept. Avg GWA',
      value: dept_avg_gwa > 0 ? Number(dept_avg_gwa).toFixed(2) : 'N/A',
      delta: 'Target: 1.75',
      deltaClass: dept_avg_gwa > 0 && dept_avg_gwa <= 1.75 ? 'positive' : 'warning',
      fill: dept_avg_gwa > 0 ? Math.max(0, Math.min(100, (3 - dept_avg_gwa) / (3 - 1) * 100)) + '%' : '0%',
      iconBg: '#f5f3ff', iconColor: '#8b5cf6',
      iconPath: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
      label: 'With Violations',
      value: active_violations.toString(),
      delta: 'Active cases',
      deltaClass: 'negative',
      fill: total_students > 0 ? Math.min(100, (active_violations / total_students) * 100) + '%' : '0%',
      iconBg: '#fff1f2', iconColor: '#ef4444',
      iconPath: '<path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    },
    {
      label: 'Awards Logged',
      value: total_awards.toString(),
      delta: 'Recognitions',
      deltaClass: 'positive',
      fill: '100%',
      iconBg: '#fffbeb', iconColor: '#f59e0b',
      iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    },
  ], [total_students, total_faculty, dept_avg_gwa, active_violations, total_awards]);

  if (isLoading) {
    return (
      <div className="dashboard-home">
        <div className="dash-loading">
          <div className="spinner-lg"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">

      {/* HERO BANNER */}
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-bg-shape shape-2"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow">
              <span className="eyebrow-dot"></span>
              Academic Year 2026-2027 · 2nd Semester
            </p>
            <h2 className="hero-greeting">{greeting} 👋</h2>
            <p className="dean-hero-desc">
              You have <strong>{pendingApprovalsCount} pending approvals</strong> and{' '}
              <strong>{active_violations} student violations</strong> requiring attention this week.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary">
                Pending Approvals <span className="hero-btn-badge">{pendingApprovalsCount}</span>
              </button>
              <button className="hero-btn-ghost">Generate Report</button>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-stat-card">
              <span className="hsc-label">This Week</span>
              <span className="hsc-value">{active_violations + pendingApprovalsCount}</span>
              <span className="hsc-sub">Activities logged</span>
            </div>
            <div className="hero-stat-card accent">
              <span className="hsc-label">Pending</span>
              <span className="hsc-value">{pendingApprovalsCount}</span>
              <span className="hsc-sub">Awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="dean-stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="dean-stat-card"
            style={{ borderTop: `3px solid ${stat.iconColor}` }}
          >
            <div className="dean-stat-top">
              <div className="dean-stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                <svg viewBox="0 0 18 18" fill="none" dangerouslySetInnerHTML={{ __html: stat.iconPath }} />
              </div>
            </div>
            <div className="dean-stat-bottom">
              <span className="dean-stat-value">{stat.value}</span>
              <span className={`dean-stat-delta ${stat.deltaClass}`}>{stat.delta}</span>
            </div>
            <span className="dean-stat-label">{stat.label}</span>
            <div className="dean-stat-bar">
              <div className="dean-stat-bar-fill" style={{ width: stat.fill, background: stat.iconColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM GRID */}
      <div className="bottom-grid">

        {/* GWA DISTRIBUTION */}
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">GWA Distribution</h3>
              <p className="card-sub">Students per GWA bracket</p>
            </div>
            <a href="/dean/performance" className="card-link">Full report →</a>
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

        {/* TOP STUDENTS */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Performing Students</h3>
              <p className="card-sub">Ranked by GWA · current semester</p>
            </div>
            <a href="#" className="card-link">View all →</a>
          </div>
          <div className="student-list">
            {top_students.map((s, i) => (
              <div key={i} className="student-row">
                <span className="rank">{i + 1}</span>
                <div className="student-avatar" style={{ background: s.color }}>
                  {s.name.charAt(0)}
                </div>
                <div className="student-info">
                  <p className="student-name">{s.name}</p>
                  <p className="student-course">{s.course}</p>
                </div>
                <span className={`student-tag ${s.tagClass}`}>{s.tag}</span>
                <span className="student-gwa">{s.gwa}</span>
              </div>
            ))}
            {top_students.length === 0 && (
              <div className="empty-state-msg">No top performing students recorded yet.</div>
            )}
          </div>
        </div>

        {/* VIOLATIONS */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Student Violations</h3>
              <p className="card-sub">Active cases this semester</p>
            </div>
            <a href="#" className="card-link">View all →</a>
          </div>
          <div className="violation-list">
            {recent_violations.map((v, i) => (
              <div key={i} className="violation-row">
                <div className="violation-avatar" style={{ background: v.color }}>
                  {v.name.charAt(0)}
                </div>
                <div className="violation-info">
                  <p className="violation-name">{v.name}</p>
                  <p className="violation-type">{v.type}</p>
                </div>
                <span className={`violation-badge ${v.severityClass}`}>{v.severity}</span>
              </div>
            ))}
            {recent_violations.length === 0 && (
              <div className="empty-state-msg">No active student violations.</div>
            )}
          </div>
          {active_violations > 2 && (
            <div className="violation-alert">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M8 5v4M8 11.5v.5M2.5 14h11a1 1 0 00.87-1.5l-5.5-9.5a1 1 0 00-1.74 0l-5.5 9.5A1 1 0 002.5 14z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>{active_violations - 2} more cases need review</span>
              <button onClick={() => window.location.href = '/violations'}>Review Now →</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
