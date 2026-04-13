import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import '../../styles/Student/StudentViolations.css'
import { studentService } from '../../services'

const ViolationRecords = () => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const { data: violations = [], isLoading: loading } = useQuery({
    queryKey: ['student-violations'],
    queryFn: async () => {
      const res = await studentService.getViolations()
      const data = res?.ok ? (res.data || []) : []
      return data.map((v) => ({
        ...v,
        type: v.violationType,
        date: formatDate(v.dateReported),
        severityClass: 'sev-' + v.severity.toLowerCase(),
        resolved: (v.status || '').toLowerCase() === 'resolved',
      }))
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const renderedViolations = useMemo(() => violations, [violations])

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
          ) : renderedViolations.length === 0 ? (
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
              {renderedViolations.map((v) => (
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