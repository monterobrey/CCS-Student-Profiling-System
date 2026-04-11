import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import '../../styles/Dean/ViolationsList.css';

const STATS_CONFIG = [
  { label: 'Total Reports', color: '#FF6B1A', bg: '#fff5ef', icon: 'users' },
  { label: 'Major', color: '#ef4444', bg: '#fef2f2', icon: 'alert' },
  { label: 'Pending Review', color: '#f59e0b', bg: '#fffbeb', icon: 'clock' },
  { label: 'Resolved', color: '#10b981', bg: '#f0fdf4', icon: 'check' }
];

const ICONS = {
  users: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6"></path><path d="M23 11h-6"></path></g>,
  alert: <g stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></g>,
  clock: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></g>,
  check: <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></g>
};

export default function ViolationsList() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const isDeanOrChair = role === ROLES.DEAN || role === ROLES.CHAIR;

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewingViolation, setViewingViolation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editForm, setEditForm] = useState({ status: '', action_taken: '' });

  const getBasePath = () => {
    if (role === ROLES.DEAN) return 'dean';
    if (role === ROLES.CHAIR) return 'department-chair';
    if (role === ROLES.SECRETARY) return 'secretary';
    return 'dean';
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    setLoading(true);
    setCases([
      { id: 1, student: { first_name: 'John', last_name: 'Doe', user: { student_number: '2024-00001' }, section: { section_name: 'BSCS 3-A' }, program: { program_code: 'BSCS' } }, faculty: { first_name: 'Jane', last_name: 'Smith', position: 'Professor' }, violationType: 'Academic Dishonesty', severity: 'Major', status: 'Pending', dateReported: '2024-01-15', location: 'Room 301', description: 'Student was caught cheating during the midterm exam.' },
      { id: 2, student: { first_name: 'Alice', last_name: 'Johnson', user: { student_number: '2024-00002' }, section: { section_name: 'BSIT 2-B' }, program: { program_code: 'BSIT' } }, faculty: { first_name: 'Bob', last_name: 'Williams', position: 'Instructor' }, violationType: 'Dress Code Violation', severity: 'Minor', status: 'Resolved', dateReported: '2024-01-10', location: 'Main Building', description: 'Student was not wearing the required uniform.' },
      { id: 3, student: { first_name: 'Mark', last_name: 'Davis', user: { student_number: '2023-00015' }, section: { section_name: 'BSCS 4-A' }, program: { program_code: 'BSCS' } }, faculty: { first_name: 'Sarah', last_name: 'Brown', position: 'Associate Professor' }, violationType: 'Disrespectful Behavior', severity: 'Moderate', status: 'Under Review', dateReported: '2024-01-20', location: 'Faculty Office', description: 'Student was disrespectful to a faculty member.' },
    ]);
    setLoading(false);
  };

  const filteredCases = useMemo(() => {
    return cases.filter(v => {
      const name = `${v.student?.first_name} ${v.student?.last_name}`.toLowerCase();
      const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || v.violationType?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = severityFilter ? v.severity === severityFilter : true;
      const matchStatus = statusFilter ? v.status === statusFilter : true;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [cases, searchQuery, severityFilter, statusFilter]);

  const stats = useMemo(() => [
    { value: cases.length },
    { value: cases.filter(v => v.severity === 'Major').length },
    { value: cases.filter(v => v.status === 'Pending').length },
    { value: cases.filter(v => v.status === 'Resolved').length }
  ], [cases]);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (id) {
      const v = cases.find(c => c.id == id);
      if (v) {
        setViewingViolation(v);
        setEditForm({ status: v.status || 'Pending', action_taken: v.action_taken || '' });
      }
    } else {
      setViewingViolation(null);
    }
  }, [id, cases]);

  const handleViewViolation = (v) => navigate(`/${getBasePath()}/violations/${v.id}`);
  const handleUpdateViolation = async () => {
    setSaving(true);
    setTimeout(() => {
      setViewingViolation(null);
      alert('Violation updated successfully!');
      setSaving(false);
    }, 500);
  };
  const handleCloseModal = () => {
    setViewingViolation(null);
    navigate(`/${getBasePath()}/violations`);
  };

  return (
    <div className="violations-page">
      <div className="violations-header">
        <h2 className="violations-title">University Violations</h2>
        <p className="violations-subtitle">Monitor all disciplinary reports and take administrative action as needed.</p>
      </div>

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

      <div className="violations-toolbar">
        <div className="search-box">
          <svg viewBox="0 0 18 18" fill="none" stroke="#b89f90" strokeWidth="1.5"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4"/></svg>
          <input type="text" placeholder="Search student, violation, or reporter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-box">
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

      <div className="violations-table-card">
        {loading && <div className="loading-spinner"><div className="spinner"></div><p>Loading violations...</p></div>}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>VIOLATION</th>
                <th>REPORTER</th>
                <th>DATE FILED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(v => (
                <tr key={v.id} onClick={() => handleViewViolation(v)} className="clickable">
                  <td>
                    <div className="student-info">
                      <div className="avatar">{v.student?.first_name?.charAt(0)}</div>
                      <div><p className="name">{v.student?.first_name} {v.student?.last_name}</p><p className="number">{v.student?.user?.student_number}</p></div>
                    </div>
                  </td>
                  <td><p className="violation-name">{v.violationType}</p><span className={`severity ${v.severity?.toLowerCase()}`}>{v.severity}</span></td>
                  <td><p className="reporter-name">{v.faculty?.first_name} {v.faculty?.last_name}</p><p className="reporter-pos">{v.faculty?.position}</p></td>
                  <td>{formatDate(v.dateReported)}</td>
                  <td><span className={`status ${v.status?.toLowerCase().replace(' ', '-')}`}>{v.status}</span></td>
                </tr>
              ))}
              {filteredCases.length === 0 && !loading && <tr><td colSpan="5" className="empty">No violations found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {viewingViolation && (
        <div className="modal-overlay" onClick={(e) => !saving && e.target === e.currentTarget && handleCloseModal()}>
          <div className="violations-modal">
            <div className="modal-header">
              <h3>Violation Case Details</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-box"><h4>Reported Student</h4><p className="info-name">{viewingViolation.student?.first_name} {viewingViolation.student?.last_name}</p><p className="info-detail">{viewingViolation.student?.user?.student_number}</p><p className="info-detail">{viewingViolation.student?.section?.section_name} | {viewingViolation.student?.program?.program_code}</p></div>
                <div className="info-box"><h4>Reporting Faculty</h4><p className="info-name">{viewingViolation.faculty?.first_name} {viewingViolation.faculty?.last_name}</p><p className="info-detail">{viewingViolation.faculty?.position}</p></div>
              </div>
              <div className="detail-section"><h4>Incident Information</h4><div className="detail-rows"><div className="detail-row"><span>Type & Severity</span><span><span className="incident-type">{viewingViolation.violationType}</span><span className={`severity ${viewingViolation.severity?.toLowerCase()}`}>{viewingViolation.severity}</span></span></div><div className="detail-row"><span>Date & Time</span><span>{formatDate(viewingViolation.dateReported)}</span></div><div className="detail-row"><span>Location</span><span>{viewingViolation.location || 'Not specified'}</span></div><div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}><span>Faculty Description</span><p className="description">{viewingViolation.description}</p></div></div></div>
              {isDeanOrChair && (
                <div className="action-section">
                  <h4>Administrative Action</h4>
                  <div className="action-form">
                    <div className="form-field"><label>Update Case Status</label><select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} disabled={saving}><option value="Pending">Pending</option><option value="Under Review">Under Review</option><option value="Resolved">Resolved</option><option value="Dismissed">Dismissed</option><option value="Sanctioned">Sanctioned</option></select></div>
                    <div className="form-field"><label>Action Taken / Remarks</label><textarea value={editForm.action_taken} onChange={(e) => setEditForm({ ...editForm, action_taken: e.target.value })} rows="3" placeholder="Input actions taken..." disabled={saving}></textarea></div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={handleCloseModal} disabled={saving}>Cancel</button>
              {isDeanOrChair && <button className="btn-primary" onClick={handleUpdateViolation} disabled={saving}>{saving ? 'Saving...' : 'Update Record'}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}