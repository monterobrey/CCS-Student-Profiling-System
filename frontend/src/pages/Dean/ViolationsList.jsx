import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, ROLES } from '../../context/AuthContext';
import { violationService } from '../../services';
import '../../styles/Dean/ViolationsList.css';

const STATS_CONFIG = [
  { label: 'Total Reports',  color: '#FF6B1A', bg: '#fff5ef', icon: 'users'  },
  { label: 'Major',          color: '#ef4444', bg: '#fef2f2', icon: 'alert'  },
  { label: 'Pending Review', color: '#f59e0b', bg: '#fffbeb', icon: 'clock'  },
  { label: 'Resolved',       color: '#10b981', bg: '#f0fdf4', icon: 'check'  },
];

const ICONS = {
  users: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></g>,
  alert: <g stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></g>,
  clock: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></g>,
  check: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></g>,
};

export default function ViolationsList() {
  const { role } = useAuth();
  const navigate  = useNavigate();
  const { id }    = useParams();
  const queryClient = useQueryClient();

  const isDeanOrChair = role === ROLES.DEAN || role === ROLES.CHAIR;

  const [searchQuery,    setSearchQuery]    = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [saving,         setSaving]         = useState(false);
  const [editForm,       setEditForm]       = useState({ status: '', action_taken: '' });
  const [toast,          setToast]          = useState(null);

  /* ===========================
     CACHED QUERY
  =========================== */

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: async () => {
      const res = await violationService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  /* ===========================
     HELPERS
  =========================== */

  const getBasePath = () => {
    if (role === ROLES.DEAN)      return 'dean';
    if (role === ROLES.CHAIR)     return 'department-chair';
    if (role === ROLES.SECRETARY) return 'secretary';
    return 'dean';
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Derive viewingViolation from cache + URL param — survives navigation
  const viewingViolation = id ? cases.find(c => c.id == id) ?? null : null;

  // Sync editForm when viewingViolation changes
  const openViolation = (v) => {
    setEditForm({ status: v.status || 'Pending', action_taken: v.action_taken || '' });
    navigate(`/${getBasePath()}/violations/${v.id}`);
  };

  const closeModal = () => navigate(`/${getBasePath()}/violations`);

  /* ===========================
     FILTERED LIST
  =========================== */

  const filteredCases = useMemo(() => {
    return cases.filter(v => {
      const name = `${v.student?.first_name} ${v.student?.last_name}`.toLowerCase();
      const matchSearch   = !searchQuery    || name.includes(searchQuery.toLowerCase()) || v.violationType?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = !severityFilter || v.severity === severityFilter;
      const matchStatus   = !statusFilter   || v.status   === statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [cases, searchQuery, severityFilter, statusFilter]);

  /* ===========================
     STATS
  =========================== */

  const stats = useMemo(() => [
    { value: cases.length },
    { value: cases.filter(v => v.severity === 'Major').length },
    { value: cases.filter(v => v.status === 'Pending').length },
    { value: cases.filter(v => v.status === 'Resolved').length },
  ], [cases]);

  /* ===========================
     UPDATE — setQueryData, no refetch
  =========================== */

  const handleUpdateViolation = async () => {
    if (!viewingViolation) return;
    setSaving(true);
    try {
      const res = await violationService.update(viewingViolation.id, editForm);
      if (res.ok) {
        // Patch the cache directly
        queryClient.setQueryData(['violations'], (old = []) =>
          old.map(v => v.id === res.data.id ? res.data : v)
        );
        // Also invalidate dean-summary so dashboard violation count refreshes
        queryClient.invalidateQueries({ queryKey: ['dean-summary'] });
        showToast('success', 'Violation updated successfully.');
        closeModal();
      } else {
        showToast('error', res.message || 'Failed to update violation.');
      }
    } catch {
      showToast('error', 'Failed to update violation.');
    } finally {
      setSaving(false);
    }
  };

  /* ===========================
     JSX
  =========================== */

  return (
    <div className="violations-page">

      {/* TOAST */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER */}
      <div className="violations-header">
        <h2 className="violations-title">Student Violations</h2>
        <p className="violations-subtitle">Monitor all disciplinary reports and take administrative action as needed.</p>
      </div>

      {/* STATS */}
      <div className="violations-stats">
        {STATS_CONFIG.map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ borderTopColor: stat.color }}>
            <div className="stat-icon-wrapper" style={{ background: stat.bg }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                {ICONS[stat.icon]}
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number" style={{ color: stat.color }}>{stats[idx].value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="violations-toolbar">
        <div className="search-box">
          <svg viewBox="0 0 18 18" fill="none" stroke="#b89f90" strokeWidth="1.5">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4"/>
          </svg>
          <input
            type="text"
            placeholder="Search student or violation type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
            <option value="">All Severity</option>
            <option value="Major">Major</option>
            <option value="Moderate">Moderate</option>
            <option value="Minor">Minor</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
            <option value="Sanctioned">Sanctioned</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="violations-table-card">
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading violations...</p>
          </div>
        )}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>VIOLATION</th>
                <th>REPORTED BY</th>
                <th>DATE FILED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(v => (
                <tr key={v.id} onClick={() => openViolation(v)} className="clickable">
                  <td>
                    <div className="student-info">
                      <div className="avatar">{v.student?.first_name?.charAt(0)}</div>
                      <div>
                        <p className="name">{v.student?.first_name} {v.student?.last_name}</p>
                        <p className="number">{v.student?.user?.student_number}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="violation-name">{v.violationType}</p>
                    <span className={`severity ${v.severity?.toLowerCase()}`}>{v.severity}</span>
                  </td>
                  <td>
                    <p className="reporter-name">{v.faculty?.first_name} {v.faculty?.last_name}</p>
                    <p className="reporter-pos">{v.faculty?.position}</p>
                  </td>
                  <td>{formatDate(v.dateReported)}</td>
                  <td>
                    <span className={`status ${v.status?.toLowerCase().replace(' ', '-')}`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && !isLoading && (
                <tr><td colSpan="5" className="empty">No violations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL / EDIT MODAL */}
      {viewingViolation && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && closeModal()}>
          <div className="violations-modal">
            <div className="modal-header">
              <h3>Violation Case Details</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Student + Faculty */}
              <div className="info-grid">
                <div className="info-box">
                  <h4>Reported Student</h4>
                  <p className="info-name">{viewingViolation.student?.first_name} {viewingViolation.student?.last_name}</p>
                  <p className="info-detail">{viewingViolation.student?.user?.student_number}</p>
                  <p className="info-detail">
                    {viewingViolation.student?.section?.section_name} · {viewingViolation.student?.program?.program_code}
                  </p>
                </div>
                <div className="info-box">
                  <h4>Reporting Faculty</h4>
                  <p className="info-name">{viewingViolation.faculty?.first_name} {viewingViolation.faculty?.last_name}</p>
                  <p className="info-detail">{viewingViolation.faculty?.position}</p>
                </div>
              </div>

              {/* Incident details */}
              <div className="detail-section">
                <h4>Incident Information</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span>Type & Severity</span>
                    <span>
                      <span className="incident-type">{viewingViolation.violationType}</span>
                      <span className={`severity ${viewingViolation.severity?.toLowerCase()}`}>{viewingViolation.severity}</span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Date Filed</span>
                    <span>{formatDate(viewingViolation.dateReported)}</span>
                  </div>
                  {viewingViolation.incident_time && (
                    <div className="detail-row">
                      <span>Time</span>
                      <span>{viewingViolation.incident_time}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span>Location</span>
                    <span>{viewingViolation.location || 'Not specified'}</span>
                  </div>
                  {viewingViolation.course && (
                    <div className="detail-row">
                      <span>Course</span>
                      <span>{viewingViolation.course.course_code} — {viewingViolation.course.course_name}</span>
                    </div>
                  )}
                  <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <span>Description</span>
                    <p className="description">{viewingViolation.description}</p>
                  </div>
                  {viewingViolation.action_taken && (
                    <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <span>Previous Action Taken</span>
                      <p className="description">{viewingViolation.action_taken}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin action — Dean and Chair only */}
              {isDeanOrChair && (
                <div className="action-section">
                  <h4>Administrative Action</h4>
                  <div className="action-form">
                    <div className="form-field">
                      <label>Update Case Status</label>
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        disabled={saving}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Dismissed">Dismissed</option>
                        <option value="Sanctioned">Sanctioned</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Action Taken / Remarks</label>
                      <textarea
                        value={editForm.action_taken}
                        onChange={e => setEditForm({ ...editForm, action_taken: e.target.value })}
                        rows="3"
                        placeholder="Describe the action taken..."
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              {isDeanOrChair && (
                <button className="btn-primary" onClick={handleUpdateViolation} disabled={saving}>
                  {saving ? 'Saving...' : 'Update Record'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
