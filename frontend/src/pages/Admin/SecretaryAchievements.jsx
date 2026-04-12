import { useState, useMemo } from 'react'
import '../../styles/Admin/SecretaryAchievements.css'

const INITIAL_ACHIEVEMENTS = [
  { id: 1, award: "Dean's List Nomination",    student: 'Aira Mae Reyes',     course: 'BSCS 3-A', category: 'Academic',    submittedBy: 'Dr. R. Villanueva', date: 'Mar 10, 2026', status: 'pending',  color: '#f59e0b' },
  { id: 2, award: 'Best Research Paper',        student: 'Jose Miguel Cruz',   course: 'BSIT 3-A', category: 'Research',    submittedBy: 'Prof. A. Reyes',    date: 'Mar 11, 2026', status: 'pending',  color: '#3b82f6' },
  { id: 3, award: 'Leadership Award',           student: 'Katrina Villanueva', course: 'BSCS 2-B', category: 'Leadership',  submittedBy: 'Prof. L. Garcia',   date: 'Mar 12, 2026', status: 'pending',  color: '#10b981' },
  { id: 4, award: "Dean's List Nomination",    student: 'Mark Dela Cruz',     course: 'BSCS 4-A', category: 'Academic',    submittedBy: 'Dr. J. Cruz',       date: 'Mar 13, 2026', status: 'pending',  color: '#f59e0b' },
  { id: 5, award: 'Outstanding Student Leader', student: 'Paolo Reyes',        course: 'BSIT 2-A', category: 'Leadership',  submittedBy: 'Prof. A. Reyes',    date: 'Mar 5, 2026',  status: 'approved', color: '#8b5cf6' },
  { id: 6, award: 'Best Thesis Proposal',       student: 'Carla Santos',       course: 'BSCS 4-B', category: 'Research',    submittedBy: 'Dr. R. Villanueva', date: 'Mar 3, 2026',  status: 'rejected', color: '#ef4444' },
]

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

const SecretaryAchievements = () => {
  const [achievements, setAchievements] = useState(INITIAL_ACHIEVEMENTS)
  const [activeTab, setActiveTab]       = useState('pending')

  const updateStatus = (id, status) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
  }

  const filteredAchievements = useMemo(() => {
    if (activeTab === 'all') return achievements
    return achievements.filter((a) => a.status === activeTab)
  }, [achievements, activeTab])

  const miniStats = useMemo(() => [
    { label: 'Total Submitted', value: achievements.length,                                      color: '#FF6B1A' },
    { label: 'Pending',         value: achievements.filter((a) => a.status === 'pending').length,  color: '#f59e0b' },
    { label: 'Approved',        value: achievements.filter((a) => a.status === 'approved').length, color: '#16a34a' },
    { label: 'Rejected',        value: achievements.filter((a) => a.status === 'rejected').length, color: '#ef4444' },
  ], [achievements])

  const pendingCount = achievements.filter((a) => a.status === 'pending').length

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Achievement Verification</h2>
          <p className="page-sub">Review and verify student award nominations submitted by faculty.</p>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="mini-stats">
        {miniStats.map((s) => (
          <div className="mini-stat" key={s.label}>
            <span className="mini-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="mini-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`filter-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="tab-count">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Achievement Cards */}
      <div className="achievements-list">
        {filteredAchievements.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 40, height: 40 }}>
              <path d="M24 4l4.5 13.5H43l-11.5 8.5 4.5 13.5L24 31.5l-12 8 4.5-13.5L5 17.5h14.5L24 4z"
                stroke="#f0e8e0" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <p>No achievements in this category.</p>
          </div>
        ) : (
          filteredAchievements.map((ach) => (
            <div className="ach-card" key={ach.id}>
              {/* Left */}
              <div className="ach-left">
                <div className="ach-icon" style={{ background: ach.color + '18', color: ach.color }}>
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M10 2l2 6h6l-5 3.5 2 6L10 14.5l-5 3.5 2-6L2 8h6l2-6z"
                      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ach-info">
                  <p className="ach-title">{ach.award}</p>
                  <p className="ach-student">{ach.student} · {ach.course}</p>
                  <p className="ach-meta">Submitted by {ach.submittedBy} · {ach.date}</p>
                </div>
              </div>

              {/* Right */}
              <div className="ach-right">
                <span className="category-badge" style={{ background: ach.color + '18', color: ach.color }}>
                  {ach.category}
                </span>
                <span className={`ach-status ach-${ach.status}`}>{ach.status}</span>

                {ach.status === 'pending' ? (
                  <div className="ach-actions">
                    <button className="approve-btn" onClick={() => updateStatus(ach.id, 'approved')}>
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Approve
                    </button>
                    <button className="reject-btn" onClick={() => updateStatus(ach.id, 'rejected')}>
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="ach-resolved">
                    {ach.status === 'approved' ? (
                      <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="#16a34a" strokeWidth="1.3" />
                        <path d="M5 8l2 2 4-4" stroke="#16a34a" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="1.3" />
                        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    <span>{ach.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SecretaryAchievements