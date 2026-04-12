import { useState, useMemo } from 'react'
import '../../styles/Admin/SecretaryWorkLoad.css'

const SecretaryFacultyWorkload = () => {
  const [faculty] = useState([])

  const miniStats = useMemo(() => [
    { label: 'Total Faculty',  value: faculty.length,                                                          color: '#FF6B1A' },
    { label: 'Full Load',      value: faculty.filter((f) => f.units >= 18).length,                             color: '#ef4444' },
    { label: 'Normal Load',    value: faculty.filter((f) => f.units >= 12 && f.units < 18).length,             color: '#f59e0b' },
    { label: 'Light Load',     value: faculty.filter((f) => f.units < 12).length,                              color: '#16a34a' },
    { label: 'Total Subjects', value: faculty.reduce((a, f) => a + (f.subjects?.length || 0), 0),              color: '#8b5cf6' },
  ], [faculty])

  const getLoadClass  = (units) => units >= 18 ? 'load-full'   : units >= 12 ? 'load-mid'    : 'load-low'
  const getBadgeClass = (units) => units >= 18 ? 'wl-full'     : units >= 12 ? 'wl-normal'   : 'wl-light'
  const getBadgeLabel = (units) => units >= 18 ? 'Full Load'   : units >= 12 ? 'Normal Load' : 'Light Load'

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Faculty Workload & Schedules</h2>
          <p className="page-sub">Overview of faculty subject loads and teaching schedules.</p>
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

      {/* Faculty Cards */}
      <div className="faculty-grid">
        {faculty.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 40, height: 40 }}>
              <path d="M24 8a8 8 0 100 16 8 8 0 000-16zM8 40c0-8.8 7.2-16 16-16s16 7.2 16 16"
                stroke="#f0e8e0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p>No faculty workload data available.</p>
          </div>
        ) : (
          faculty.map((f) => (
            <div className="faculty-card" key={f.id}>
              {/* Card Header */}
              <div className="fc-header">
                <div className="fc-avatar" style={{ background: f.color }}>
                  {f.name.charAt(0)}
                </div>
                <div className="fc-info">
                  <p className="fc-name">{f.name}</p>
                  <p className="fc-dept">{f.department}</p>
                  <p className="fc-pos">{f.position}</p>
                </div>
                <div className={`fc-load ${getLoadClass(f.units)}`}>
                  <span className="load-num">{f.units}</span>
                  <span className="load-label">units</span>
                </div>
              </div>

              {/* Subjects */}
              <div className="fc-subjects">
                {f.subjects?.map((subj) => (
                  <div className="fc-subject-row" key={subj.code}>
                    <span className="subj-code">{subj.code}</span>
                    <span className="subj-name">{subj.name}</span>
                    <span className="subj-section">{subj.section}</span>
                    <span className="subj-sched">{subj.schedule}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="fc-footer">
                <span className="fc-students">{f.totalStudents} students total</span>
                <span className={`workload-badge ${getBadgeClass(f.units)}`}>
                  {getBadgeLabel(f.units)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SecretaryFacultyWorkload