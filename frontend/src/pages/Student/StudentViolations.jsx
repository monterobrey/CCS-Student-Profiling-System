import { useState, useEffect } from 'react'
import '../../styles/Student/StudentViolations.css'


const ViolationRecords = () => {
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(false)

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const fetchViolations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/student/violations')
      const data = await res.json()
      const mapped = data.map((v) => ({
        ...v,
        type: v.violationType,
        date: formatDate(v.dateReported),
        severityClass: 'sev-' + v.severity.toLowerCase(),
        resolved: v.status === 'resolved',
      }))
      setViolations(mapped)
    } catch (err) {
      console.error('Failed to fetch violations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchViolations()
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Violation Records</h2>
          <p className="page-sub">Your disciplinary history this academic year.</p>
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching your records...</p>
            </div>
          ) : violations.length === 0 ? (
            <div className="empty-clean">
              <div className="clean-icon">
                <svg viewBox="0 0 48 48" fill="none" style={{ width: 48, height: 48 }}>
                  <circle cx="24" cy="24" r="20" stroke="#10b981" strokeWidth="2" />
                  <path
                    d="M16 24l6 6 10-10"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="clean-title">No violations on record.</p>
              <p className="clean-sub">Keep up the great behavior!</p>
            </div>
          ) : (
            <div className="violation-list">
              {violations.map((v) => (
                <div className="violation-row" key={v.type + v.date}>
                  <div className="v-avatar">!</div>
                  <div className="v-info">
                    <p className="v-type">{v.type}</p>
                    <p className="v-date">{v.date}</p>
                  </div>
                  <div className="v-right">
                    <span className={`sev-badge ${v.severityClass}`}>{v.severity}</span>
                    <span className={`v-status ${v.resolved ? 'resolved' : 'pending'}`}>
                      {v.resolved ? 'Resolved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViolationRecords