import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import './FacultyManagement.css';

const COLORS = ['#FF6B1A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const POSITIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Instructor'];

export default function FacultyManagement() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isSecretary = role === ROLES.SECRETARY;
  const isDeanOrChair = role === ROLES.DEAN || role === ROLES.CHAIR;

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [csvInput, setCsvInput] = useState(null);

  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [viewingFaculty, setViewingFaculty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [archivingFaculty, setArchivingFaculty] = useState(null);

  const [form, setForm] = useState({
    title: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    department_id: '',
    position: 'Instructor'
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [resendCounts, setResendCounts] = useState({});

  const getBasePath = () => {
    if (role === ROLES.DEAN) return 'dean';
    if (role === ROLES.CHAIR) return 'department-chair';
    if (role === ROLES.SECRETARY) return 'secretary';
    return 'dean';
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      const f = faculty.find(fac => fac.id == id);
      if (f) setViewingFaculty(f);
    } else {
      setViewingFaculty(null);
    }
  }, [id, faculty]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // In a real app, these would be API calls
      // const [facultyRes, sectionsRes] = await Promise.all([
      //   axios.get('/faculty'),
      //   axios.get('/sections')
      // ]);
      
      // Mock data for now
      const mockFaculty = [
        { id: 1, first_name: 'John', last_name: 'Doe', middle_name: 'M', title: 'Dr.', email: 'john.doe@school.edu.ph', department_id: 1, department_name: 'College of Computing Studies', position: 'Professor', status: 'active', load: 12, color: '#FF6B1A', created_at: '2024-01-15', expertise: [], schedules: [] },
        { id: 2, first_name: 'Jane', last_name: 'Smith', middle_name: 'A', title: 'Dr.', email: 'jane.smith@school.edu.ph', department_id: 1, department_name: 'College of Computing Studies', position: 'Associate Professor', status: 'active', load: 9, color: '#3b82f6', created_at: '2024-02-20', expertise: [], schedules: [] },
        { id: 3, first_name: 'Bob', last_name: 'Johnson', middle_name: 'K', email: 'bob.johnson@school.edu.ph', department_id: 1, department_name: 'College of Computing Studies', position: 'Assistant Professor', status: 'pending', load: 0, color: '#10b981', created_at: '2025-01-10', expertise: [], schedules: [] },
      ].map((f, idx) => ({
        ...f,
        color: f.color || COLORS[idx % COLORS.length],
        user: { email: f.email, status: f.status }
      }));

      setFaculty(mockFaculty);
      setDepartments([{ id: 1, department_name: 'College of Computing Studies' }]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateLoad = (f) => {
    if (!f.schedules || !f.schedules.length) return 0;
    const uniqueClasses = new Set();
    let totalUnits = 0;
    f.schedules.forEach(s => {
      const classKey = `${s.course_id}-${s.section_id}`;
      if (!uniqueClasses.has(classKey)) {
        uniqueClasses.add(classKey);
        totalUnits += s.course?.units || 0;
      }
    });
    return totalUnits;
  };

  const getResendCount = (facultyId) => resendCounts[facultyId] || 0;

  const miniStats = useMemo(() => [
    { label: 'TOTAL STUDENTS', value: faculty.length, color: '#3b82f6', icon: 'users', iconBg: '#eff6ff', iconColor: '#3b82f6' },
    { label: 'ACTIVE', value: faculty.filter(f => f.status === 'active').length, color: '#16a34a', icon: 'check', iconBg: '#f0fdf4', iconColor: '#16a34a' },
    { label: 'PENDING SETUP', value: faculty.filter(f => f.status === 'pending').length, color: '#6b7280', icon: 'clock', iconBg: '#f3f4f6', iconColor: '#f97316' },
    { label: 'BSCS', value: faculty.filter(f => f.department_name?.includes('Computing')).length, color: '#8b5cf6', icon: 'users', iconBg: '#fef2f2', iconColor: '#f97316' },
    { label: 'BSIT', value: 20, color: '#f97316', icon: 'users', iconBg: '#f0fdf4', iconColor: '#22c55e' }
  ], [faculty]);

  const filteredFaculty = useMemo(() => {
    return faculty.filter(f => {
      const fullName = `${f.last_name}, ${f.first_name} ${f.middle_name || ''}`.toLowerCase();
      const matchSearch = !search || fullName.includes(search.toLowerCase()) || f.email?.toLowerCase().includes(search.toLowerCase());
      const matchDept = !filterDept || f.department_id == filterDept;
      const matchPosition = !filterPosition || f.position === filterPosition;
      const matchStatus = !filterStatus || f.status === filterStatus;
      return matchSearch && matchDept && matchPosition && matchStatus;
    }).sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      const lastCompare = a.last_name.localeCompare(b.last_name);
      if (lastCompare !== 0) return lastCompare;
      const firstCompare = a.first_name.localeCompare(b.first_name);
      if (firstCompare !== 0) return firstCompare;
      return (a.middle_name || '').localeCompare(b.middle_name || '');
    });
  }, [faculty, search, filterDept, filterPosition, filterStatus]);

  const totalPages = Math.ceil(filteredFaculty.length / pageSize);
  const paginatedFaculty = filteredFaculty.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleValidateField = (field) => {
    const val = form[field];
    if (!val || (typeof val === 'string' && !val.trim())) {
      setFormErrors(prev => ({ ...prev, [field]: 'Required' }));
    } else if (field === 'email') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(val)) {
        setFormErrors(prev => ({ ...prev, [field]: 'Invalid email format' }));
      } else {
        const newErrors = { ...formErrors };
        delete newErrors[field];
        setFormErrors(newErrors);
      }
    } else {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const viewDetails = (f) => {
    navigate(`/${getBasePath()}/faculty-accounts/${f.id}`);
  };

  const openCreateModal = () => {
    setEditingFaculty(null);
    setFormErrors({});
    setForm({
      title: '',
      first_name: '',
      last_name: '',
      middle_name: '',
      email: '',
      department_id: departments[0]?.id || '',
      position: 'Instructor'
    });
    setShowModal(true);
  };

  const openEditModal = (f) => {
    setEditingFaculty(f);
    setFormErrors({});
    setForm({
      title: f.title || '',
      first_name: f.first_name,
      last_name: f.last_name,
      middle_name: f.middle_name || '',
      email: f.email,
      department_id: f.department_id,
      position: f.position
    });
    setShowModal(true);
  };

  const openEditFromView = () => {
    if (viewingFaculty) {
      setViewingFaculty(null);
      openEditModal(viewingFaculty);
    }
  };

  const confirmArchive = (f) => {
    setArchivingFaculty(f);
    setShowArchiveModal(true);
  };

  const saveFaculty = async () => {
    const newErrors = {};
    if (!form.first_name) newErrors.first_name = 'Required';
    if (!form.last_name) newErrors.last_name = 'Required';
    if (!form.email) newErrors.email = 'Required';
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      // In a real app, this would be an API call
      // if (editingFaculty) {
      //   await axios.put(`/secretary/faculty/${editingFaculty.id}`, form);
      // } else {
      //   await axios.post('/secretary/faculty', form);
      // }
      
      setShowModal(false);
      fetchData();
      alert(editingFaculty ? 'Faculty account updated successfully.' : 'Faculty account created successfully. Setup email sent.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save faculty.');
    } finally {
      setSaving(false);
    }
  };

  const archiveFaculty = async () => {
    if (!archivingFaculty) return;
    try {
      // await axios.delete(`/secretary/faculty/${archivingFaculty.id}`);
      setShowArchiveModal(false);
      setViewingFaculty(null);
      alert('Faculty account archived successfully.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive faculty.');
    }
  };

  const resendSetup = async (f) => {
    const count = getResendCount(f.id);
    if (count >= 3) return;
    try {
      // await axios.post(`/secretary/faculty/${f.id}/resend-setup`);
      setResendCounts(prev => ({ ...prev, [f.id]: count + 1 }));
      alert(`Setup email resent to ${f.email}. (${count + 1}/3 resends used)`);
    } catch (err) {
      alert('Failed to resend setup email.');
    }
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoadingImport(true);
    try {
      // const response = await axios.post('/secretary/faculty/import', formData);
      alert('CSV imported successfully.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to import CSV.');
    } finally {
      setLoadingImport(false);
      if (csvInput) csvInput.value = '';
    }
  };

  const closeViewModal = () => {
    setViewingFaculty(null);
    navigate(`/${getBasePath()}/faculty-accounts`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Faculty Management</h2>
          <p className="page-sub">View and manage faculty accounts, departments, and teaching loads.</p>
        </div>
        {isSecretary && (
          <div className="header-actions">
            <button className="ghost-btn" onClick={() => document.getElementById('csvInput')?.click()} disabled={loadingImport}>
              {loadingImport ? (
                <svg className="spinner-sm" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5"></circle></svg>
              ) : (
                <svg viewBox="0 0 18 18" fill="none"><path d="M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1M9 2v9M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {loadingImport ? 'Importing...' : 'Import CSV'}
            </button>
            <input id="csvInput" ref={setCsvInput} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
            <button className="primary-btn" onClick={openCreateModal}>
              <svg viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Create Account
            </button>
          </div>
        )}
      </div>

      <div className="mini-stats">
        {miniStats.map((s, idx) => (
          <div className="mini-stat-card" key={idx}>
            <div className="mini-stat-border" style={{ background: s.color }}></div>
            <div className="mini-stat-content">
              <div className="mini-stat-icon" style={{ background: s.iconBg }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ color: s.iconColor }}>
                  {s.icon === 'users' && (
                    <>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  )}
                  {s.icon === 'check' && (
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                  {s.icon === 'clock' && (
                    <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>
                  )}
                </svg>
              </div>
              <div className="mini-stat-info">
                <span className="mini-stat-value" style={{ color: s.color }}>{s.value}</span>
                <span className="mini-stat-label">{s.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 18 18" fill="none"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.department_name}</option>
            ))}
          </select>
          <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}>
            <option value="">All Positions</option>
            {POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner-lg"></div>
            <p>Fetching faculty...</p>
          </div>
        )}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>FACULTY</th>
                <th>DEPARTMENT</th>
                <th>POSITION</th>
                <th>WORKLOAD</th>
                <th>STATUS</th>
                {(isSecretary || isDeanOrChair) && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedFaculty.map(f => (
                <tr key={f.id} onClick={() => viewDetails(f)} className="clickable-row">
                  <td>
                    <div className="student-cell">
                      <div className="s-avatar" style={{ background: f.color }}>{f.first_name.charAt(0)}</div>
                      <div>
                        <p className="s-name">
                          {f.title && <span className="title-label">{f.title}</span>}
                          {f.last_name}, {f.first_name} {f.middle_name || ''}
                        </p>
                        <p className="s-sub">{f.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{f.department_name}</td>
                  <td><span className="program-badge-table">{f.position}</span></td>
                  <td>
                    <div className="units-breakdown">
                      <span className="total-units-badge">{f.load || 0} hrs</span>
                      <div className="wl-bar-sm"><div className="wl-fill-sm" style={{ width: Math.min((f.load || 0) / 50 * 100, 100) + '%' }}></div></div>
                    </div>
                  </td>
                  <td><span className={`status-badge ${f.status === 'active' ? 'st-active' : 'st-pending'}`}>{f.status === 'active' ? 'Active' : 'Pending'}</span></td>
                  {(isSecretary || isDeanOrChair) && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-btns">
                        {f.status === 'pending' && isSecretary && (
                          <button className="action-btn resend" onClick={() => resendSetup(f)} title="Resend setup email">
                            <svg viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                        <button className="action-btn delete" onClick={() => confirmArchive(f)} title="Archive Account">
                          <svg viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedFaculty.length === 0 && !loading && (
                <tr>
                  <td colSpan={isSecretary || isDeanOrChair ? 6 : 5} className="empty-row">No faculty members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredFaculty.length > pageSize && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredFaculty.length)}</strong> of <strong>{filteredFaculty.length}</strong> members
            </div>
            <div className="pagination-btns">
              <button className="pag-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className="pag-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`pag-page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <button className="pag-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {viewingFaculty && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-student-meta">
                <div className="s-avatar lg" style={{ background: viewingFaculty.color }}>
                  {viewingFaculty.first_name.charAt(0)}
                </div>
                <div>
                  <h3>
                    {viewingFaculty.title && <span className="title-label">{viewingFaculty.title}</span>}
                    {viewingFaculty.last_name}, {viewingFaculty.first_name} {viewingFaculty.middle_name || ''}
                  </h3>
                  <p className="modal-sub">{viewingFaculty.position} · {viewingFaculty.department_name}</p>
                </div>
              </div>
              <button className="close-btn" onClick={closeViewModal}>×</button>
            </div>

            <div className="modal-body profile-body">
              <div className="profile-section">
                <h4 className="section-title">Personal Information</h4>
                <div className="detail-rows">
                  {viewingFaculty.title && (
                    <div className="detail-row">
                      <span className="detail-key">Title</span>
                      <span className="detail-val">{viewingFaculty.title}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-key">Full Name</span>
                    <span className="detail-val">{viewingFaculty.last_name}, {viewingFaculty.first_name} {viewingFaculty.middle_name || ''}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Email Address</span>
                    <span className="detail-val">{viewingFaculty.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Position</span>
                    <span className="detail-val">
                      <span className="code-badge">{viewingFaculty.position}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Employment Information</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-key">Department</span>
                    <span className="detail-val">{viewingFaculty.department_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Workload Status</span>
                    <span className="detail-val">
                      <div className="units-breakdown" style={{ justifyContent: 'flex-end' }}>
                        <span className="total-units-badge">{viewingFaculty.load || 0} hrs</span>
                        <div className="wl-bar-sm" style={{ width: '60px' }}><div className="wl-fill-sm" style={{ width: Math.min((viewingFaculty.load || 0) / 50 * 100, 100) + '%' }}></div></div>
                      </div>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Status</span>
                    <span className="detail-val">
                      <span className={`status-badge ${viewingFaculty.status === 'active' ? 'st-active' : 'st-pending'}`}>
                        {viewingFaculty.status.toUpperCase()}
                      </span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Date Joined</span>
                    <span className="detail-val">{new Date(viewingFaculty.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Expertise</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-val" style={{ textAlign: 'left', color: '#b89f90', fontStyle: 'italic' }}>No expertise recorded.</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Courses Handled</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-val" style={{ textAlign: 'left', color: '#b89f90', fontStyle: 'italic' }}>No courses assigned.</span>
                  </div>
                </div>
              </div>

              {viewingFaculty.status === 'pending' && isSecretary && (
                <div className="resend-row">
                  <div className="resend-info">
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    <span>
                      Setup email <strong>resent {getResendCount(viewingFaculty.id)}/3 times</strong>
                    </span>
                  </div>
                  <button
                    className="resend-btn"
                    onClick={() => resendSetup(viewingFaculty)}
                    disabled={getResendCount(viewingFaculty.id) >= 3}
                    title={getResendCount(viewingFaculty.id) >= 3 ? 'Maximum resend limit reached' : 'Resend setup email'}
                  >
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    {getResendCount(viewingFaculty.id) >= 3 ? 'Limit Reached' : 'Resend Email'}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="ghost-btn" onClick={closeViewModal}>Close</button>
              {isSecretary && (
                <button className="ghost-btn" onClick={openEditFromView}>
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Edit Account
                </button>
              )}
              {(isSecretary || isDeanOrChair) && (
                <button className="danger-btn" onClick={() => confirmArchive(viewingFaculty)}>
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Archive Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isSecretary && showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFaculty ? 'Edit Faculty Account' : 'Create Faculty Account'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)} disabled={saving}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title (Optional)</label>
                  <input name="title" value={form.title} onChange={handleInputChange} type="text" placeholder="e.g. Dr., Engr., Ms." disabled={saving} />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input name="first_name" value={form.first_name} onChange={handleInputChange} type="text" placeholder="First name" disabled={!!editingFaculty || saving} className={formErrors.first_name ? 'error-input' : ''} onBlur={() => handleValidateField('first_name')} />
                  {formErrors.first_name && <span className="field-error">{formErrors.first_name}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input name="last_name" value={form.last_name} onChange={handleInputChange} type="text" placeholder="Last name" disabled={!!editingFaculty || saving} className={formErrors.last_name ? 'error-input' : ''} onBlur={() => handleValidateField('last_name')} />
                  {formErrors.last_name && <span className="field-error">{formErrors.last_name}</span>}
                </div>
                <div className="form-group">
                  <label>Middle Name (Optional)</label>
                  <input name="middle_name" value={form.middle_name} onChange={handleInputChange} type="text" placeholder="Middle name" disabled={!!editingFaculty || saving} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input name="email" value={form.email} onChange={handleInputChange} type="email" placeholder="faculty@school.edu.ph" disabled={!!editingFaculty || saving} className={formErrors.email ? 'error-input' : ''} onBlur={() => handleValidateField('email')} />
                  {formErrors.email && <span className="field-error">{formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select name="department_id" value={form.department_id} onChange={handleInputChange} disabled={saving}>
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <select name="position" value={form.position} onChange={handleInputChange} disabled={saving}>
                    {POSITIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              {!editingFaculty && (
                <div className="modal-notice">
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  A password setup link will be sent to the faculty's email after account creation.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="ghost-btn" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="primary-btn" onClick={saveFaculty} disabled={saving}>
                {saving && <span className="spinner-sm"></span>}
                {saving ? 'Saving...' : editingFaculty ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isSecretary || isDeanOrChair) && showArchiveModal && (
        <div className="modal-overlay" onClick={() => setShowArchiveModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Archive Faculty Account</h3>
              <button className="close-btn" onClick={() => setShowArchiveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="delete-msg">
                Are you sure you want to archive the account of
                <strong> {archivingFaculty?.last_name}, {archivingFaculty?.first_name} {archivingFaculty?.middle_name || ''}</strong>?
                The account will be moved to the archive and can be recovered by the Dean.
              </p>
            </div>
            <div className="modal-footer">
              <button className="ghost-btn" onClick={() => setShowArchiveModal(false)}>Cancel</button>
              <button className="danger-btn" onClick={archiveFaculty}>Archive Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}