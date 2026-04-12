import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../styles/Admin/SecretaryDashboard.css'

const INITIAL_STATS = {
  totalStudents: 0,
  totalFaculty: 0,
  pendingAccounts: 0,
  pendingVerifications: 0,
}

const INITIAL_ACCOUNT_REQUESTS = [

]

const INITIAL_FACULTY_WORKLOAD = [

]

const INITIAL_PENDING_ACHIEVEMENTS = [

]

const buildStats = (s) => [
  { label: 'Total Students',   value: s.totalStudents.toString(),        delta: 'Enrolled',     deltaClass: 'positive', fill: '100%', iconBg: '#fff5ef', iconColor: '#FF6B1A', route: '/secretary/student-accounts', iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
  { label: 'Total Faculty',    value: s.totalFaculty.toString(),         delta: 'Active',       deltaClass: 'positive', fill: '100%', iconBg: '#eff6ff', iconColor: '#3b82f6', route: '/secretary/faculty-accounts', iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1M6 13v-3a1 1 0 011-1h4a1 1 0 011-1v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
  { label: 'Pending Accounts', value: s.pendingAccounts.toString(),      delta: 'To create',    deltaClass: 'warning',  fill: s.pendingAccounts > 0 ? '30%' : '0%',      iconBg: '#f5f3ff', iconColor: '#8b5cf6', route: '/secretary/student-accounts', iconPath: '<path d="M9 1v10M9 1L6 4M9 1l3 3M2 13h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' },
  { label: 'Pending Verify',   value: s.pendingVerifications.toString(), delta: 'Achievements', deltaClass: 'warning',  fill: s.pendingVerifications > 0 ? '40%' : '0%', iconBg: '#fffbeb', iconColor: '#f59e0b', route: '/secretary/achievements',     iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' },
  { label: 'Dept Reports',     value: '0',                                delta: 'Generated',    deltaClass: 'positive', fill: '0%',  iconBg: '#fff1f2', iconColor: '#ef4444', route: '/secretary/reports',          iconPath: '<path d="M4 15V9m4 6V5m4 10v-4m4 4V7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
]

const SecretaryDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [secStats,               setSecStats]               = useState(INITIAL_STATS)
  const [accountRequests,        setAccountRequests]        = useState(INITIAL_ACCOUNT_REQUESTS)
  const [facultyWorkload,        setFacultyWorkload]        = useState(INITIAL_FACULTY_WORKLOAD)
  const [pendingAchievements,    setPendingAchievements]    = useState(INITIAL_PENDING_ACHIEVEMENTS)
  const [stats,                  setStats]                  = useState(() => buildStats(INITIAL_STATS))

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    let timeMsg = 'morning'
    if (hour >= 12 && hour < 18) timeMsg = 'afternoon'
    else if (hour >= 18 || hour < 5) timeMsg = 'evening'
    const lastName = user?.name?.split(' ').slice(-1)[0] ?? 'Secretary'
    return `Good ${timeMsg}, ${lastName}`
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res  = await fetch('/analytics/summary')
        const data = await res.json()

        const newStats = {
          totalStudents:        data.total_students,
          totalFaculty:         data.total_faculty,
          pendingAccounts:      data.pending_accounts,
          pendingVerifications: data.pending_verifications,
        }

        setSecStats(newStats)
        setAccountRequests(data.account_requests)
        setFacultyWorkload(data.faculty_workload)
        setPendingAchievements(data.pending_achievements)
        setStats(buildStats(newStats))
      } catch (err) {
        console.error('Failed to fetch secretary summary:', err)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="sd-dashboard-home">

      {/* ── Hero Banner ── */}
      <div className="sd-hero-banner">
        <div className="sd-hero-bg-shape sd-shape-1"></div>
        <div className="sd-hero-bg-shape sd-shape-2"></div>
        <div className="sd-hero-body">

          {/* Left */}
          <div className="sd-hero-left">
            <p className="sd-hero-eyebrow">
              <span className="sd-eyebrow-dot"></span>
              Academic Year 2026–2027 · 2nd Semester
            </p>
            <h2 className="sd-hero-greeting">{greeting} 👋</h2>
            <p className="sd-hero-desc">
              There are <strong>{secStats.pendingAccounts} pending account requests</strong> and{' '}
              <strong>{secStats.pendingVerifications} achievements</strong> awaiting verification today.
            </p>
            <div className="sd-hero-actions">
              <Link to="/secretary/student-accounts" className="sd-hero-btn-primary">
                <svg viewBox="0 0 18 18" fill="none" style={{ width: 14, height: 14 }}>
                  <path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0"
                    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Student Accounts
              </Link>
              <Link to="/secretary/reports" className="sd-hero-btn-ghost">Generate Report</Link>
            </div>
          </div>

          {/* Right */}
          <div className="sd-hero-right">
            <div className="sd-hero-stat-card">
              <span className="sd-hsc-label">Total Students</span>
              <span className="sd-hsc-value">{secStats.totalStudents}</span>
              <span className="sd-hsc-sub">Enrolled</span>
            </div>
            <div className="sd-hero-stat-card sd-accent">
              <span className="sd-hsc-label">Pending</span>
              <span className="sd-hsc-value">{secStats.pendingAccounts}</span>
              <span className="sd-hsc-sub">Account requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="sd-stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`sd-stat-card${stat.route ? ' sd-clickable' : ''}`}
            onClick={() => stat.route && navigate(stat.route)}
          >
            <div className="sd-stat-top">
              <span className="sd-stat-label">{stat.label}</span>
              <div className="sd-stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                <svg viewBox="0 0 18 18" fill="none" dangerouslySetInnerHTML={{ __html: stat.iconPath }} />
              </div>
            </div>
            <div className="sd-stat-bottom">
              <span className="sd-stat-value">{stat.value}</span>
              <span className={`sd-stat-delta ${stat.deltaClass}`}>{stat.delta}</span>
            </div>
            <div className="sd-stat-bar">
              <div className="sd-stat-bar-fill" style={{ width: stat.fill, background: stat.iconColor }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Grid ── */}
      <div className="sd-bottom-grid">

        {/* Recent Account Requests */}
        <div className="sd-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title">Recent Account Requests</h3>
              <p className="sd-card-sub">Pending student & faculty accounts</p>
            </div>
            <Link to="/secretary/student-accounts" className="sd-card-link">View all →</Link>
          </div>
          <div className="sd-student-list">
            {accountRequests.map((req) => (
              <div className="sd-student-row" key={req.name}>
                <div className="sd-student-avatar" style={{ background: req.color }}>
                  {req.name.charAt(0)}
                </div>
                <div className="sd-student-info">
                  <p className="sd-student-name">{req.name}</p>
                  <p className="sd-student-course">{req.type} · {req.course}</p>
                </div>
                <span className="sd-student-tag sd-tag-orange">{req.status}</span>
              </div>
            ))}
          </div>
          <div className="sd-alert">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v4M8 11h.01"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>{secStats.pendingAccounts} accounts awaiting creation</span>
            <button>Create Now →</button>
          </div>
        </div>

        {/* Faculty Workload */}
        <div className="sd-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title">Faculty Workload</h3>
              <p className="sd-card-sub">Schedules & course loads</p>
            </div>
            <Link to="/secretary/faculty-accounts" className="sd-card-link">View all →</Link>
          </div>
          <div className="sd-faculty-list">
            {facultyWorkload.map((f) => (
              <div className="sd-faculty-row" key={f.name}>
                <div className="sd-fsubj-left">
                  <div className="sd-fsubj-icon" style={{ background: f.color + '18', color: f.color }}>
                    <svg viewBox="0 0 18 18" fill="none">
                      <path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0"
                        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="sd-fsubj-info">
                    <p className="sd-fsubj-code">{f.name}</p>
                    <p className="sd-fsubj-name">{f.department}</p>
                  </div>
                </div>
                <div className="sd-fsubj-right">
                  <span className="sd-fsubj-section">{f.subjects} courses</span>
                  <span className="sd-fsubj-enrolled">{f.students} students</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Verification */}
        <div className="sd-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title">Achievement Verification</h3>
              <p className="sd-card-sub">Pending awards to verify</p>
            </div>
            <Link to="/secretary/achievements" className="sd-card-link">View all →</Link>
          </div>
          <div className="sd-student-list">
            {pendingAchievements.map((ach) => (
              <div className="sd-student-row" key={ach.student}>
                <div className="sd-student-avatar" style={{ background: ach.color }}>
                  {ach.student.charAt(0)}
                </div>
                <div className="sd-student-info">
                  <p className="sd-student-name">{ach.student}</p>
                  <p className="sd-student-course">{ach.achievement}</p>
                </div>
                <span className="sd-student-tag sd-tag-orange">Pending</span>
              </div>
            ))}
          </div>
          <div className="sd-alert">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 1l1.5 4.5H14l-4 2.9 1.5 4.6L8 10.2 4.5 13l1.5-4.6-4-2.9h4.5L8 1z"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{secStats.pendingVerifications} achievements need verification</span>
            <button>Verify Now →</button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SecretaryDashboard