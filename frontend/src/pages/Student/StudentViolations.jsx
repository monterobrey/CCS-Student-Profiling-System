import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import '../../styles/Student/StudentViolations.css'
import { studentService } from '../../services'

const SevIcon = ({ severity }) => {
  if (severity === 'Major')
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  if (severity === 'Moderate')
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const getInitials = (name = '') =>
  name.split(' ').filter(w => w && w.length > 0).slice(-2).map(w => w[0].toUpperCase()).join('')

const FILTERS = ['All', 'Pending', 'Resolved', 'Major']

const getStatusClass = (status = '') => {
  const normalized = status.toLowerCase().replace(/\s+/g, '-')
  if (normalized === 'resolved') return 'resolved'
  if (normalized === 'under-review') return 'under-review'
  if (normalized === 'dismissed') return 'dismissed'
  if (normalized === 'sanctioned') return 'sanctioned'
  return 'pending'
}

const ViolationRecords = () => {
  const [selectedViolation, setSelectedViolation] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
        statusClass: getStatusClass(v.status),
      }))
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const filteredViolations = useMemo(() => {
    if (activeFilter === 'All') return violations
    if (activeFilter === 'Pending') return violations.filter(v => (v.status || '').toLowerCase() === 'pending')
    if (activeFilter === 'Resolved') return violations.filter(v => (v.status || '').toLowerCase() === 'resolved')
    if (activeFilter === 'Major') return violations.filter(v => v.severity?.toLowerCase() === 'major')
    return violations
  }, [violations, activeFilter])

  return (
    <div className="page student-violations-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Violation Records</h2>
          <p className="page-sub">Your disciplinary history this academic year.</p>
        </div>
        {!loading && violations.length > 0 && (
          <div className="record-count-badge">
            <span className="record-count-dot" />
            {violations.length} violation{violations.length !== 1 ? 's' : ''} on record
          </div>
        )}
      </div>

      <div className="pcard">
        {!loading && violations.length > 0 && (
          <div className="table-toolbar">
            <span className="toolbar-label">All records</span>
            <div className="filter-pills">
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`filter-pill${activeFilter === f ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pcard-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Fetching your records…</p>
            </div>
          ) : violations.length === 0 ? (
            <div className="empty-clean">
              <div className="clean-icon">
                <svg viewBox="0 0 48 48" fill="none" style={{ width: 48, height: 48 }}>
                  <circle cx="24" cy="24" r="20" stroke="#10b981" strokeWidth="2" />
                  <path d="M16 24l6 6 10-10" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
                    <th>Violation type</th>
                    <th>Severity</th>
                    <th>Date reported</th>
                    <th>Status</th>
                    <th>Action taken by</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredViolations.map((v) => (
                    <tr key={v.id} className="v-row-clickable" onClick={() => setSelectedViolation(v)}>
                      <td>
                        <div className="v-type-cell">
                          <div className={`v-row-icon sev-icon-${v.severity?.toLowerCase()}`}>
                            <SevIcon severity={v.severity} />
                          </div>
                          <span className="v-type-name">{v.type}</span>
                        </div>
                      </td>
                      <td><span className={`sev-badge ${v.severityClass}`}>{v.severity}</span></td>
                      <td className="v-date-col">{v.date}</td>
                      <td>
                        <span className={`v-status ${v.statusClass}`}>
                          {v.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="actor-cell">
                          <div className="actor-avatar">
                            {getInitials(v.action_by_user?.name || v.action_by_user?.email || '')}
                          </div>
                          <span className="actor-name">
                            {v.action_by_user?.name || v.action_by_user?.email || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="v-chevron">›</td>
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
              <div className={`modal-header-icon sev-icon-${selectedViolation.severity?.toLowerCase()}`}>
                <SevIcon severity={selectedViolation.severity} />
              </div>
              <div className="modal-header-text">
                <h3 className="modal-header-title">{selectedViolation.type}</h3>
                <p className="modal-header-sub">
                  Violation Details
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedViolation(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="student-v-modal-body">
              <div className="modal-section">
                <p className="modal-section-label">Violation details</p>
                <div className="modal-detail-grid">
                  <div className="modal-detail-item">
                    <span className="detail-key">Severity</span>
                    <span className={`sev-badge ${selectedViolation.severityClass}`}>{selectedViolation.severity}</span>
                  </div>
                  <div className="modal-detail-item">
                    <span className="detail-key">Status</span>
                    <span className={`v-status ${selectedViolation.statusClass}`}>
                      {selectedViolation.status || 'Pending'}
                    </span>
                  </div>
                  <div className="modal-detail-item">
                    <span className="detail-key">Date reported</span>
                    <span className="detail-val">{formatDate(selectedViolation.rawDate)}</span>
                  </div>
                  <div className="modal-detail-item">
                    <span className="detail-key">Location</span>
                    <span className="detail-val">{selectedViolation.location || 'Not specified'}</span>
                  </div>
                  <div className="modal-detail-item">
                    <span className="detail-key">Reported by</span>
                    <span className="detail-val">
                      {selectedViolation.faculty
                        ? `${selectedViolation.faculty.first_name} ${selectedViolation.faculty.last_name}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <p className="modal-section-label">Description</p>
                <div className="modal-prose-block">
                  {selectedViolation.description || 'No description provided.'}
                </div>
              </div>

              <div className="modal-section">
                <p className="modal-section-label">Action taken</p>
                <div className="modal-prose-block">
                  {selectedViolation.action_taken || 'No action taken yet.'}
                </div>
                <p className="modal-action-by">
                  Action by:{' '}
                  <strong>
                    {selectedViolation.action_by_user?.name ||
                      selectedViolation.action_by_user?.email ||
                      'Not yet assigned'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="student-v-modal-footer">
              <button className="modal-btn-close" onClick={() => setSelectedViolation(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default ViolationRecords