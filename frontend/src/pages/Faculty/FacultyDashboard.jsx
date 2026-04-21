import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Faculty/FacultyDashboard.css';

const statIcons = {
  subjects: (
    <>
      <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 6h8M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  students: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  gwa: <path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />,
  violations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  awards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  ),
};

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: summary = {}, isLoading, isError } = useQuery({
    queryKey: ['faculty-dashboard-summary'],
    queryFn: async () => {
      const res = await analyticsService.getFacultySummary();
      if (!res.ok) throw new Error(res.message || 'Failed to load dashboard');
      return res.data ?? {};
    },
    staleTime: 60_000,
  });

  const {
    total_subjects: totalSubjects = 0,
    total_students: totalStudents = 0,
    avg_gwa: avgGwa = null,
    today_schedule: scheduleToday = [],
    top_students: topStudents = [],
    subjects = [],
    pending_actions: pendingActions = [
      { label: 'Grades to submit', count: 0, color: '#FF6B1A' },
      { label: 'Award recommendations', count: 0, color: '#f59e0b' },
      { label: 'Violation reports', count: 0, color: '#ef4444' },
    ],
  } = summary;

  const violationCount = pendingActions.find((a) => a.label === 'Violation reports')?.count ?? 0;
  const awardsPendingCount = pendingActions.find((a) => a.label === 'Award recommendations')?.count ?? 0;

  const uniqueSubjects = useMemo(() => {
    const seen = new Set();
    return subjects.filter((s) => {
      const key = `${s.code}|${s.section}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [subjects]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const name = user?.first_name || (user?.name ? user.name.split(' ')[0] : 'Professor');
    return `${prefix}, ${name}`;
  }, [user]);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    []
  );

  const stats = useMemo(() => {
    const gwaVal = avgGwa != null ? Number(avgGwa).toFixed(2) : 'N/A';
    const gwaFill =
      avgGwa != null ? `${Math.max(0, Math.min(100, ((3 - Number(avgGwa)) / 2) * 100))}%` : '0%';
    const subjFill = totalSubjects > 0 ? `${Math.min(100, totalSubjects * 15)}%` : '0%';
    const studFill = totalStudents > 0 ? `${Math.min(100, (totalStudents / 120) * 100)}%` : '0%';
    const violFill = totalStudents > 0 ? `${Math.min(100, (violationCount / totalStudents) * 100)}%` : violationCount > 0 ? '40%' : '0%';
    const awardFill = awardsPendingCount > 0 ? `${Math.min(100, awardsPendingCount * 20)}%` : '0%';

    return [
      {
        label: 'My Subjects',
        value: String(totalSubjects),
        delta: 'This semester',
        deltaClass: 'positive',
        fill: subjFill,
        iconBg: '#fff5ef',
        iconColor: '#FF6B1A',
        route: '/faculty/subjects',
        iconPath: statIcons.subjects,
      },
      {
        label: 'Total Students',
        value: String(totalStudents),
        delta: 'Enrolled',
        deltaClass: 'positive',
        fill: studFill,
        iconBg: '#eff6ff',
        iconColor: '#3b82f6',
        route: '/faculty/students',
        iconPath: statIcons.students,
      },
      {
        label: 'Avg Class GWA',
        value: gwaVal,
        delta: 'All classes',
        deltaClass: avgGwa != null && Number(avgGwa) <= 1.75 ? 'positive' : avgGwa != null ? 'warning' : 'positive',
        fill: gwaFill,
        iconBg: '#f5f3ff',
        iconColor: '#8b5cf6',
        iconPath: statIcons.gwa,
      },
      {
        label: 'Violations Filed',
        value: String(violationCount),
        delta: 'Active',
        deltaClass: 'negative',
        fill: violFill,
        iconBg: '#fff1f2',
        iconColor: '#ef4444',
        route: '/faculty/violations',
        iconPath: statIcons.violations,
      },
      {
        label: 'Awards Pending',
        value: String(awardsPendingCount),
        delta: 'Recommendations',
        deltaClass: 'positive',
        fill: awardFill,
        iconBg: '#fffbeb',
        iconColor: '#f59e0b',
        route: '/faculty/awards',
        iconPath: statIcons.awards,
      },
    ];
  }, [totalSubjects, totalStudents, avgGwa, violationCount, awardsPendingCount]);

  const pendingRoute = (label) => {
    if (label === 'Award recommendations') return '/faculty/awards';
    if (label === 'Violation reports') return '/faculty/violations';
    return '/faculty/subjects';
  };

  return (
    <div className="faculty-dashboard-home">
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow">
              <span className="eyebrow-dot"></span>Academic Year 2026-2027 · 2nd Semester
            </p>
            <h2 className="hero-greeting">{greeting} 👋</h2>
            <p className="faculty-hero-desc">
              {isLoading && 'Loading your dashboard…'}
              {isError && !isLoading && 'Could not load dashboard data. Please refresh or try again later.'}
              {!isLoading && !isError && (
                <>
                  You have <strong>{totalSubjects} subjects</strong> this semester with{' '}
                  <strong>{totalStudents} enrolled students</strong> across all your classes.
                </>
              )}
            </p>
            <div className="hero-actions">
              <Link to="/faculty/schedule" className="hero-btn-primary">
                My Schedule
              </Link>
              <Link to="/faculty/students" className="hero-btn-ghost">
                View My Students
              </Link>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-stat-card">
              <span className="hsc-label">Subjects</span>
              <span className="hsc-value">{isLoading ? '—' : totalSubjects}</span>
              <span className="hsc-sub">This semester</span>
            </div>
            <div className="hero-stat-card">
              <span className="hsc-label">Students</span>
              <span className="hsc-value">{isLoading ? '—' : totalStudents}</span>
              <span className="hsc-sub">Enrolled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="faculty-stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="faculty-stat-card"
            onClick={() => stat.route && navigate(stat.route)}
          >
            <div className="faculty-stat-border" style={{ background: stat.iconColor }} />
            <div className="faculty-stat-card-content">
              <div className="faculty-stat-top">
                <div className="faculty-stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                  <svg viewBox="0 0 18 18" fill="none">
                    {stat.iconPath}
                  </svg>
                </div>
              </div>
              <div className="faculty-stat-bottom">
                <span className="faculty-stat-value" style={{ color: stat.iconColor }}>{isLoading ? '—' : stat.value}</span>
                <span className={`faculty-stat-delta ${stat.deltaClass}`}>{stat.delta}</span>
              </div>
              <span className="faculty-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Today's Teaching Schedule</h3>
              <p className="card-sub">{todayLabel}</p>
            </div>
            <Link to="/faculty/schedule" className="card-link">
              View all →
            </Link>
          </div>
          <div className="schedule-list">
            {scheduleToday.length === 0 ? (
              <div className="empty-small">{isLoading ? 'Loading…' : 'No classes today.'}</div>
            ) : (
              scheduleToday.map((cls, i) => (
                <div key={`${cls.time}-${cls.section}-${i}`} className="fd-schedule-row">
                  <div className="fd-schedule-time-col">
                    <span className="fd-time">{cls.time}</span>
                    <span className="fd-duration">{cls.duration}</span>
                  </div>
                  <div className="fd-schedule-dot" style={{ background: cls.color }} />
                  <div className="fd-schedule-body">
                    <div className="fd-schedule-title">{cls.subject}</div>
                    <div className="fd-schedule-meta">
                      {cls.section} · {cls.room} · {cls.enrolled} enrolled
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Student Performance</h3>
              <p className="card-sub">Top students across my classes (by GWA)</p>
            </div>
            <Link to="/faculty/students" className="card-link">
              View all →
            </Link>
          </div>

          <div className="fd-top-students">
            {topStudents.length === 0 ? (
              <div className="empty-small" style={{ padding: '16px 0' }}>
                {isLoading ? 'Loading…' : 'No GWA records for students in your sections yet.'}
              </div>
            ) : (
              topStudents.map((stu, i) => (
                <div key={`${stu.name}-${i}`} className="fd-student-row">
                  <div className="fd-stu-av" style={{ background: stu.color }}>
                    {stu.name?.charAt(0) || '?'}
                  </div>
                  <div className="fd-stu-info">
                    <div className="fd-stu-name">{stu.name}</div>
                    <div className="fd-stu-meta">{stu.subject}</div>
                  </div>
                  <span className="fd-stu-grade">{stu.grade}</span>
                </div>
              ))
            )}
          </div>

          <div className="violations-mini">
            <div className="vm-header">
              <span className="vm-label">Pending Actions</span>
            </div>
            <div className="pending-actions-list">
              {pendingActions.map((action) => (
                <div
                  className="pending-action-row"
                  key={action.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(pendingRoute(action.label))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(pendingRoute(action.label));
                    }
                  }}
                >
                  <div className="pending-dot" style={{ background: action.color }}></div>
                  <span className="pending-text">{action.label}</span>
                  <div className="pending-arrow-box">
                    <span className="pending-badge" style={{ color: action.color }}>
                      {action.count}
                    </span>
                    <span className="arrow-icon">›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Courses I Teach</h3>
              <p className="card-sub">Current semester workload</p>
            </div>
            <Link to="/faculty/subjects" className="card-link">
              View all →
            </Link>
          </div>
          <div className="faculty-subjects-list">
            {uniqueSubjects.length === 0 ? (
              <div className="empty-small">{isLoading ? 'Loading…' : 'No courses assigned.'}</div>
            ) : (
              uniqueSubjects.map((subj, i) => (
                <div key={`${subj.code}-${subj.section}-${i}`} className="fd-subject-row">
                  <div className="fd-subj-code" style={{ borderColor: subj.color, color: subj.color }}>
                    {subj.code}
                  </div>
                  <div className="fd-subj-body">
                    <div className="fd-subj-name">{subj.name}</div>
                    <div className="fd-subj-meta">
                      {subj.section} · {subj.enrolled} students
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
