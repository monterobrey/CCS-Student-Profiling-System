import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Secretary/SecretaryDashboard.css';

export default function SecretaryDashboard() {
  const { user } = useAuth();

  const { data: summary = {}, isLoading } = useQuery({
    queryKey: ['secretary-summary'],
    queryFn: async () => {
      const res = await analyticsService.getDeanSummary();
      return res.ok ? (res.data ?? {}) : {};
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    total_students = 0,
    total_faculty = 0,
    total_awards = 0,
    pending_awards = 0,
    faculty_present_today = 0,
    top_students = [],
    faculty_workload = [],
    recent_awards = [],
  } = summary;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const prefix = hour >= 12 && hour < 18
      ? 'Good afternoon, '
      : (hour >= 18 || hour < 5)
        ? 'Good evening, '
        : 'Good morning, ';
    const name = (user?.name || 'Secretary').trim();
    return `${prefix}${name}`;
  }, [user?.name]);

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
      label: 'Faculty Present',
      value: faculty_present_today.toString(),
      delta: 'Today',
      deltaClass: faculty_present_today > 0 ? 'positive' : 'warning',
      fill: total_faculty > 0 ? Math.min(100, (faculty_present_today / total_faculty) * 100) + '%' : '0%',
      iconBg: '#ecfeff', iconColor: '#0891b2',
      iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M6 10h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    },
    {
      label: 'Pending Awards',
      value: pending_awards.toString(),
      delta: 'For approval',
      deltaClass: pending_awards > 0 ? 'warning' : 'positive',
      fill: pending_awards > 0 ? '60%' : '0%',
      iconBg: '#fff7ed', iconColor: '#f97316',
      iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
      label: 'Awards Logged',
      value: total_awards.toString(),
      delta: 'Recognitions',
      deltaClass: 'positive',
      fill: total_awards > 0 ? '100%' : '0%',
      iconBg: '#fffbeb', iconColor: '#f59e0b',
      iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    },
  ], [total_students, total_faculty, faculty_present_today, pending_awards, total_awards]);

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
    <div className="dashboard-home secretary-dashboard-home">
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-bg-shape shape-2"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow">
              <span className="eyebrow-dot"></span>
              Academic Year 2026-2027 · 2nd Semester
            </p>
            <h2 className="hero-greeting">{greeting}</h2>
            <p className="secretary-hero-desc">
              You have <strong>{pending_awards} pending awards</strong> for approval and{' '}
              <strong>{faculty_present_today} faculty members</strong> with schedules today.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary">
                Pending Awards <span className="hero-btn-badge">{pending_awards}</span>
              </button>
              <button className="hero-btn-ghost">Generate Report</button>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-stat-card">
              <span className="hsc-label">This Week</span>
              <span className="hsc-value">{pending_awards}</span>
              <span className="hsc-sub">Activities logged</span>
            </div>
            <div className="hero-stat-card accent">
              <span className="hsc-label">Pending</span>
              <span className="hsc-value">{pending_awards}</span>
              <span className="hsc-sub">Awards to approve</span>
            </div>
          </div>
        </div>
      </div>

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

      <div className="bottom-grid">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Faculty Workload</h3>
              <p className="card-sub">Quick overview of teaching load</p>
            </div>
            <a href="/secretary/faculty-workload" className="card-link">View all →</a>
          </div>
          <div className="distribution-list">
            {faculty_workload.length === 0 ? (
              <p style={{ color: '#b89f90', fontStyle: 'italic', fontSize: 13 }}>No workload data available.</p>
            ) : faculty_workload.map((f, i) => (
              <div key={i} className="dist-item">
                <div className="dist-item-meta" style={{ width: 170 }}>
                  <span className="dist-item-range">{f.name}</span>
                  <span className="dist-item-desc">{f.department}</span>
                </div>
                <div className="dist-item-bar-wrap">
                  <div className="dist-item-bar">
                    <div
                      className="dist-item-fill"
                      style={{ width: Math.min(100, (Number(f.subjects) || 0) / 10 * 100) + '%', background: '#FF6B1A' }}
                    />
                  </div>
                </div>
                <div className="dist-item-stats" style={{ width: 72 }}>
                  <span style={{ color: '#FF6B1A', fontWeight: 700 }}>{f.subjects}</span>
                  <span className="dist-item-pct">{f.students} std</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Performing Students</h3>
              <p className="card-sub">Ranked by GWA · current semester</p>
            </div>
            <a href="/secretary/student-accounts" className="card-link">View all →</a>
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

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Awards & Recognition</h3>
              <p className="card-sub">Recently approved recognitions</p>
            </div>
            <a href="/secretary/awards" className="card-link">View all →</a>
          </div>
          <div className="student-list">
            {recent_awards.map((a, i) => (
              <div key={i} className="student-row">
                <div className="student-avatar" style={{ background: a.color }}>
                  {a.student.charAt(0)}
                </div>
                <div className="student-info">
                  <p className="student-name">{a.student}</p>
                  <p className="student-course">{a.award}</p>
                </div>
                <span className="student-tag tag-green">Approved</span>
              </div>
            ))}
            {recent_awards.length === 0 && (
              <div className="empty-state-msg">No recent approved awards yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

