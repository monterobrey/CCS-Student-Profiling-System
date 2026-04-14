import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Faculty/FacultyDashboard.css';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facultyStats, setFacultyStats] = useState({ totalSubjects: 0, totalStudents: 0 });
  const [scheduleToday, setScheduleToday] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [pendingActions, setPendingActions] = useState([
    { label: 'Grades to submit', count: 0, color: '#FF6B1A' },
    { label: 'Award recommendations', count: 0, color: '#f59e0b' },
    { label: 'Violation reports', count: 0, color: '#ef4444' }
  ]);
  const [subjects, setSubjects] = useState([]);
  
  const [stats, setStats] = useState([
    { label: 'My Subjects', value: '0', delta: 'This semester', deltaClass: 'positive', fill: '0%', iconBg: '#fff5ef', iconColor: '#FF6B1A', route: '/faculty/subjects', iconPath: <><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h8M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
    { label: 'Total Students', value: '0', delta: 'Enrolled', deltaClass: 'positive', fill: '0%', iconBg: '#eff6ff', iconColor: '#3b82f6', route: '/faculty/students', iconPath: <><path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
    { label: 'Avg Class GWA', value: 'N/A', delta: 'All classes', deltaClass: 'positive', fill: '0%', iconBg: '#f5f3ff', iconColor: '#8b5cf6', iconPath: <path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/> },
    { label: 'Violations Filed', value: '0', delta: 'This semester', deltaClass: 'negative', fill: '0%', iconBg: '#fff1f2', iconColor: '#ef4444', route: '/faculty/violations', iconPath: <path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/> },
    { label: 'Awards Given', value: '0', delta: 'Recommended', deltaClass: 'positive', fill: '0%', iconBg: '#fffbeb', iconColor: '#f59e0b', route: '/faculty/awards', iconPath: <path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/> }
  ]);

  const todayLabel = useMemo(() => 
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), 
  []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/analytics/faculty');
        const data = response.data;

        setFacultyStats({ totalSubjects: data.total_subjects, totalStudents: data.total_students });
        setScheduleToday(data.today_schedule || []);
        setTopStudents(data.top_students || []);
        setSubjects(data.subjects || []);

        setStats(prev => {
          const updated = [...prev];
          updated[0].value = data.total_subjects.toString();
          updated[1].value = data.total_students.toString();
          return updated;
        });
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-home">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow"><span className="eyebrow-dot"></span>Academic Year 2026-2027 · 2nd Semester</p>
            <h2 className="hero-greeting">Good morning, {user?.name || user?.first_name || 'Professor'} 👋</h2>
            <p className="hero-desc">You have <strong>{facultyStats.totalSubjects} subjects</strong> this semester with <strong>{facultyStats.totalStudents} enrolled students</strong> across all your classes.</p>
            <div className="hero-actions">
              <Link to="/faculty/schedule" className="hero-btn-primary">My Schedule</Link>
              <Link to="/faculty/students" className="hero-btn-ghost">View My Students</Link>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-stat-card">
              <span className="hsc-label">Subjects</span>
              <span className="hsc-value">{facultyStats.totalSubjects}</span>
              <span className="hsc-sub">This semester</span>
            </div>
            <div className="hero-stat-card">
              <span className="hsc-label">Students</span>
              <span className="hsc-value">{facultyStats.totalStudents}</span>
              <span className="hsc-sub">Enrolled</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Column Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card" onClick={() => stat.route && navigate(stat.route)}>
            <div className="stat-top">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                <svg viewBox="0 0 18 18" fill="none">{stat.iconPath}</svg>
              </div>
            </div>
            <div className="stat-bottom">
              <span className="stat-value">{stat.value}</span>
              <span className={`stat-delta ${stat.deltaClass}`}>{stat.delta}</span>
            </div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: stat.fill, background: stat.iconColor }}></div></div>
          </div>
        ))}
      </div>

      <div className="bottom-grid">
        {/* Today's Schedule */}
        <div className="card">
          <div className="card-header">
            <div><h3 className="card-title">Today's Teaching Schedule</h3><p className="card-sub">{todayLabel}</p></div>
            <Link to="/faculty/schedule" className="card-link">View all →</Link>
          </div>
          <div className="schedule-list">
            {scheduleToday.length === 0 ? <div className="empty-small">No classes today.</div> : 
              scheduleToday.map((cls, i) => (/* Mapping logic here */ null))
            }
          </div>
        </div>

        {/* Student Performance & Pending Actions (Center Column) */}
        <div className="card">
          <div className="card-header">
            <div><h3 className="card-title">Student Performance</h3><p className="card-sub">Top students across my classes</p></div>
            <Link to="/faculty/students" className="card-link">View all →</Link>
          </div>
          
          <div className="violations-mini">
            <div className="vm-header"><span className="vm-label">Pending Actions</span></div>
            <div className="pending-actions-list">
              {pendingActions.map((action, i) => (
                <div className="pending-action-row" key={i}>
                  <div className="pending-dot" style={{ background: action.color }}></div>
                  <span className="pending-text">{action.label}</span>
                  <div className="pending-arrow-box">
                     <span className="pending-badge" style={{ color: action.color }}>{action.count}</span>
                     <span className="arrow-icon">›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courses I Teach */}
        <div className="card">
          <div className="card-header">
            <div><h3 className="card-title">Courses I Teach</h3><p className="card-sub">Current semester workload</p></div>
            <Link to="/faculty/subjects" className="card-link">View all →</Link>
          </div>
          <div className="faculty-subjects-list">
            {subjects.length === 0 ? <div className="empty-small">No courses assigned.</div> : 
              subjects.map((subj, i) => (/* Mapping logic here */ null))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;