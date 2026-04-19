import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import '../../styles/Student/StudentViolations.css'
import { studentService } from '../../services'

const ViolationRecords = () => {
  const [selectedViolation, setSelectedViolation] = useState(null)

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
        rawDate: v.dateReported,
        severityClass: 'sev-' + v.severity.toLowerCase(),
        resolved: (v.status || '').toLowerCase() === 'resolved',
      }))
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const renderedViolations = useMemo(() => violations, [violations])

  return (
    <div className="page student-violations-page">
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
            <div className="violation-table-wrap">
              <table className="violation-table">
                <thead>
                  <tr>
                    <th>Violation Type</th>
                    <th>Severity</th>
                    <th>Date Reported</th>
                    <th>Status</th>
                    <th>Action Taken By</th>
                  </tr>
                </thead>
                <tbody>
                  {renderedViolations.map((v) => (
                    <tr key={v.id} className="v-row-clickable" onClick={() => setSelectedViolation(v)}>
                      <td>{v.type}</td>
                      <td><span className={`sev-badge ${v.severityClass}`}>{v.severity}</span></td>
                      <td>{v.date}</td>
                      <td>
                        <span className={`v-status ${v.resolved ? 'resolved' : 'pending'}`}>
                          {v.status || (v.resolved ? 'Resolved' : 'Pending')}
                        </span>
                      </td>
                      <td>{v.action_by_user?.name || v.action_by_user?.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedViolation && (
        <div className="student-v-modal-overlay" onClick={() => setSelectedViolation(null)}>
          <div className="student-v-modal" onClick={(e) => e.stopPropagation()}>
            <div className="student-v-modal-header">
              <h3>Violation Details</h3>
              <button onClick={() => setSelectedViolation(null)}>×</button>
            </div>
            <div className="student-v-modal-body">
              <div className="student-v-detail-row"><span>Violation Type</span><strong>{selectedViolation.type}</strong></div>
              <div className="student-v-detail-row"><span>Severity</span><strong>{selectedViolation.severity}</strong></div>
              <div className="student-v-detail-row"><span>Date Reported</span><strong>{formatDate(selectedViolation.rawDate)}</strong></div>
              <div className="student-v-detail-row"><span>Status</span><strong>{selectedViolation.status || 'Pending'}</strong></div>
              <div className="student-v-detail-row"><span>Reported By</span><strong>{selectedViolation.faculty ? `${selectedViolation.faculty.first_name} ${selectedViolation.faculty.last_name}` : '—'}</strong></div>
              <div className="student-v-detail-row"><span>Course</span><strong>{selectedViolation.course ? `${selectedViolation.course.course_code} - ${selectedViolation.course.course_name}` : '—'}</strong></div>
              <div className="student-v-detail-row"><span>Location</span><strong>{selectedViolation.location || 'Not specified'}</strong></div>
              <div className="student-v-detail-row"><span>Action Taken By</span><strong>{selectedViolation.action_by_user?.name || selectedViolation.action_by_user?.email || 'Not yet set'}</strong></div>
              <div className="student-v-block">
                <span>Description</span>
                <p>{selectedViolation.description || 'No description provided.'}</p>
              </div>
              <div className="student-v-block">
                <span>Action Taken</span>
                <p>{selectedViolation.action_taken || 'No action taken yet.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViolationRecords