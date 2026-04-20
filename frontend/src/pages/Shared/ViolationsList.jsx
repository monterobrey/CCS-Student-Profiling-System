import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, ROLES } from '../../context/AuthContext';
import { violationService } from '../../services';
import styles from '../../styles/Shared/ViolationsList.module.css';

const STATS_CONFIG = [
  { label: 'Total Reports', color: '#FF6B1A', bg: '#fff5ef', icon: 'users' },
  { label: 'Major', color: '#ef4444', bg: '#fef2f2', icon: 'alert' },
  { label: 'Pending Review', color: '#f59e0b', bg: '#fffbeb', icon: 'clock' },
  { label: 'Resolved', color: '#10b981', bg: '#f0fdf4', icon: 'check' },
];

const ICONS = {
  users: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></g>,
  alert: <g stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></g>,
  clock: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></g>,
  check: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></g>,
};

export default function ViolationsList() {
  const cx = (...classKeys) => classKeys.filter(Boolean).map((k) => styles[k]).filter(Boolean).join(' ');

  const { role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const isDeanOrChair = role === ROLES.DEAN || role === ROLES.CHAIR;

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', action_taken: '' });
  const [toast, setToast] = useState(null);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['violations', role],
    queryFn: async () => {
      const res = await violationService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const getBasePath = () => {
    if (role === ROLES.DEAN) return 'dean';
    if (role === ROLES.CHAIR) return 'department-chair';
    if (role === ROLES.SECRETARY) return 'secretary';
    return 'dean';
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getActionByLabel = (violation) => {
    if (!violation?.action_by_user) return 'Not yet set';
    const actorName = violation.action_by_user.name || violation.action_by_user.email || `User #${violation.action_by_user.id}`;
    return actorName;
  };

  const viewingViolation = id ? cases.find((c) => String(c.id) === String(id)) ?? null : null;
  const isResolvedCase = (viewingViolation?.status || '').toLowerCase() === 'resolved';

  const openViolation = (v) => {
    setEditForm({ status: v.status || 'Pending', action_taken: v.action_taken || '' });
    navigate(`/${getBasePath()}/violations/${v.id}`);
  };

  const closeModal = () => navigate(`/${getBasePath()}/violations`);

  const filteredCases = useMemo(() => {
    return cases.filter((v) => {
      const name = `${v.student?.first_name} ${v.student?.last_name}`.toLowerCase();
      const lowerSearch = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || name.includes(lowerSearch) || v.violationType?.toLowerCase().includes(lowerSearch);
      const matchSeverity = !severityFilter || v.severity === severityFilter;
      const matchStatus = !statusFilter || v.status === statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [cases, searchQuery, severityFilter, statusFilter]);

  const stats = useMemo(() => [
    { value: cases.length },
    { value: cases.filter((v) => v.severity === 'Major').length },
    { value: cases.filter((v) => v.status === 'Pending').length },
    { value: cases.filter((v) => v.status === 'Resolved').length },
  ], [cases]);

  const handleUpdateViolation = async () => {
    if (!viewingViolation || isResolvedCase) return;
    setSaving(true);
    try {
      const res = await violationService.update(viewingViolation.id, editForm);
      if (res.ok) {
        queryClient.setQueryData(['violations', role], (old = []) =>
          old.map((v) => (v.id === res.data.id ? res.data : v))
        );
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

  return (
    <div className={styles['violations-page']}>
      {toast && <div className={cx('toast', `toast-${toast.type}`)}>{toast.message}</div>}

      <div className={styles['violations-header']}>
        <h2 className={styles['violations-title']}>Student Violations</h2>
        <p className={styles['violations-subtitle']}>Monitor all disciplinary reports and take administrative action as needed.</p>
      </div>

      <div className={styles['violations-stats']}>
        {STATS_CONFIG.map((stat, idx) => (
          <div key={idx} className={styles['stat-card']} style={{ borderTopColor: stat.color }}>
            <div className={styles['stat-icon-wrapper']} style={{ background: stat.bg }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                {ICONS[stat.icon]}
              </svg>
            </div>
            <div className={styles['stat-info']}>
              <span className={styles['stat-number']} style={{ color: stat.color }}>{stats[idx].value}</span>
              <span className={styles['stat-label']}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles['violations-toolbar']}>
        <div className={styles['search-box']}>
          <svg viewBox="0 0 18 18" fill="none" stroke="#b89f90" strokeWidth="1.5">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" />
          </svg>
          <input
            type="text"
            placeholder="Search student or violation type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles['filter-box']}>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All Severity</option>
            <option value="Major">Major</option>
            <option value="Moderate">Moderate</option>
            <option value="Minor">Minor</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
            <option value="Sanctioned">Sanctioned</option>
          </select>
        </div>
      </div>

      <div className={styles['violations-table-card']}>
        {isLoading && (
          <div className={styles['loading-spinner']}>
            <div className={styles.spinner}></div>
            <p>Loading violations...</p>
          </div>
        )}
        <div className={styles['table-scroll']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>VIOLATION</th>
                <th>REPORTED BY</th>
                <th>DATE FILED</th>
                <th>ACTION TAKEN BY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((v) => (
                <tr key={v.id} onClick={() => openViolation(v)} className={styles.clickable}>
                  <td>
                    <div className={styles['student-info']}>
                      <div className={styles.avatar}>{v.student?.first_name?.charAt(0)}</div>
                      <div>
                        <p className={styles.name}>{v.student?.first_name} {v.student?.last_name}</p>
                        <p className={styles.number}>{v.student?.user?.student_number}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className={styles['violation-name']}>{v.violationType}</p>
                    <span className={cx('severity', v.severity?.toLowerCase())}>{v.severity}</span>
                  </td>
                  <td>
                    <p className={styles['reporter-name']}>{v.faculty?.first_name} {v.faculty?.last_name}</p>
                    <p className={styles['reporter-pos']}>{v.faculty?.position}</p>
                  </td>
                  <td>{formatDate(v.dateReported)}</td>
                  <td>{getActionByLabel(v)}</td>
                  <td>
                    <span className={cx('status', v.status?.toLowerCase().replace(' ', '-'))}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && !isLoading && (
                <tr><td colSpan="6" className={styles.empty}>No violations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingViolation && (
        <div className={styles['modal-overlay']} onClick={(e) => !saving && e.target === e.currentTarget && closeModal()}>
          <div className={styles['violations-modal']}>
            <div className={styles['modal-header']}>
              <h3>Violation Case Details</h3>
              <button className={styles['close-btn']} onClick={closeModal}>×</button>
            </div>

            <div className={styles['modal-body']}>
              <div className={styles['info-grid']}>
                <div className={styles['info-box']}>
                  <h4>Reported Student</h4>
                  <p className={styles['info-name']}>{viewingViolation.student?.first_name} {viewingViolation.student?.last_name}</p>
                  <p className={styles['info-detail']}>{viewingViolation.student?.user?.student_number}</p>
                  <p className={styles['info-detail']}>
                    {viewingViolation.student?.section?.section_name} · {viewingViolation.student?.program?.program_code}
                  </p>
                </div>
                <div className={styles['info-box']}>
                  <h4>Reporting Faculty</h4>
                  <p className={styles['info-name']}>{viewingViolation.faculty?.first_name} {viewingViolation.faculty?.last_name}</p>
                  <p className={styles['info-detail']}>{viewingViolation.faculty?.position}</p>
                </div>
              </div>

              <div className={styles['detail-section']}>
                <h4>Incident Information</h4>
                <div className={styles['detail-rows']}>
                  <div className={styles['detail-row']}>
                    <span>Type & Severity</span>
                    <span>
                      <span className={styles['incident-type']}>{viewingViolation.violationType}</span>
                      <span className={cx('severity', viewingViolation.severity?.toLowerCase())}>{viewingViolation.severity}</span>
                    </span>
                  </div>
                  <div className={styles['detail-row']}>
                    <span>Date Filed</span>
                    <span>{formatDate(viewingViolation.dateReported)}</span>
                  </div>
                  {viewingViolation.incident_time && (
                    <div className={styles['detail-row']}>
                      <span>Time</span>
                      <span>{viewingViolation.incident_time}</span>
                    </div>
                  )}
                  <div className={styles['detail-row']}>
                    <span>Location</span>
                    <span>{viewingViolation.location || 'Not specified'}</span>
                  </div>
                  <div className={styles['detail-row']}>
                    <span>Action By</span>
                    <span>{getActionByLabel(viewingViolation)}</span>
                  </div>
                  <div className={styles['detail-row']} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <span>Description</span>
                    <p className={styles.description}>{viewingViolation.description}</p>
                  </div>
                  {viewingViolation.action_taken && (
                    <div className={styles['detail-row']} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <span>Previous Action Taken</span>
                      <p className={styles.description}>{viewingViolation.action_taken}</p>
                    </div>
                  )}
                </div>
              </div>

              {isDeanOrChair && (
                <div className={styles['action-section']}>
                  <h4>Administrative Action</h4>
                  {isResolvedCase && (
                    <p className={styles['info-detail']}>This case is already resolved and can no longer be edited.</p>
                  )}
                  <div className={styles['action-form']}>
                    <div className={styles['form-field']}>
                      <label>Update Case Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        disabled={saving || isResolvedCase}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Dismissed">Dismissed</option>
                        <option value="Sanctioned">Sanctioned</option>
                      </select>
                    </div>
                    <div className={styles['form-field']}>
                      <label>Action Taken / Remarks</label>
                      <textarea
                        value={editForm.action_taken}
                        onChange={(e) => setEditForm({ ...editForm, action_taken: e.target.value })}
                        rows="3"
                        placeholder="Describe the action taken..."
                        disabled={saving || isResolvedCase}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles['modal-footer']}>
              <button className={styles['btn-ghost']} onClick={closeModal} disabled={saving}>Cancel</button>
              {isDeanOrChair && !isResolvedCase && (
                <button className={styles['btn-primary']} onClick={handleUpdateViolation} disabled={saving}>
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
