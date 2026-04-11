import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import '../../styles/Dean/StudentManagement.css';

const COLORS = ['#FF6B1A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const PROGRAMS = ['BSCS', 'BSIT', 'BSIS'];
const YEARS = ['1', '2', '3', '4'];

export default function StudentManagement() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const isSecretary = role === ROLES.SECRETARY;
  const isDeanOrChair = role === ROLES.DEAN || role === ROLES.CHAIR;
  const isChair = role === ROLES.CHAIR;

  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);

  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [viewingStudent, setViewingStudent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  const [form, setForm] = useState({
    first_name: '', last_name: '', student_number: '',
    email: '', course: '', year_level: '', section_id: '',
    guardian_first_name: '', guardian_last_name: '',
    guardian_relationship: '', guardian_contact_number: ''
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
      const student = students.find(s => s.id == id);
      if (student) setViewingStudent(student);
    } else {
      setViewingStudent(null);
    }
  }, [id, students]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const mockStudents = [
        { id: 1, first_name: 'John', last_name: 'Doe', middle_name: 'M', student_number: '2024-00001', email: 'john.doe@school.edu.ph', course: 'BSCS', year_level: 1, section: 'BSCS 1-A', status: 'active', gwa: 1.5, violations_count: 0, created_at: 'Jan 15, 2024', color: '#FF6B1A', guardian: null, skills: [], organizations: [] },
        { id: 2, first_name: 'Jane', last_name: 'Smith', middle_name: 'A', student_number: '2024-00002', email: 'jane.smith@school.edu.ph', course: 'BSIT', year_level: 2, section: 'BSIT 2-B', status: 'active', gwa: 1.25, violations_count: 2, created_at: 'Jan 15, 2024', color: '#3b82f6', guardian: { first_name: 'Mary', last_name: 'Smith', relationship: 'Mother', contact_number: '09123456789' }, skills: [], organizations: [] },
        { id: 3, first_name: 'Bob', last_name: 'Johnson', middle_name: 'K', student_number: '2025-00001', email: 'bob.johnson@school.edu.ph', course: 'BSCS', year_level: 1, section: 'BSCS 1-A', status: 'pending', gwa: null, violations_count: 0, created_at: 'Jan 10, 2025', color: '#10b981', guardian: null, skills: [], organizations: [] },
      ].map((s, idx) => ({
        ...s,
        color: s.color || COLORS[idx % COLORS.length],
        user: { email: s.email, status: s.status, student_number: s.student_number }
      }));

      setStudents(mockStudents);
      setSections([
        { id: 1, section_name: 'BSCS 1-A', program: { program_code: 'BSCS' }, year_level: 1 },
        { id: 2, section_name: 'BSCS 1-B', program: { program_code: 'BSCS' }, year_level: 1 },
        { id: 3, section_name: 'BSIT 2-A', program: { program_code: 'BSIT' }, year_level: 2 },
        { id: 4, section_name: 'BSIT 2-B', program: { program_code: 'BSIT' }, year_level: 2 },
      ]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractSectionLetter = (section) => {
    if (!section) return '';
    const match = section.match(/[- ](\w)$/i);
    return match ? match[1] : section;
  };

  const formatYearSection = (student) => {
    if (!student.year_level || !student.section) return 'No Section';
    return `${student.year_level}-${extractSectionLetter(student.section)}`;
  };

  const getResendCount = (studentId) => resendCounts[studentId] || 0;

  const miniStats = useMemo(() => [
    { label: 'Total Students', value: students.length, color: '#FF6B1A' },
    { label: 'Active', value: students.filter(s => s.status === 'active').length, color: '#16a34a' },
    { label: 'Pending Setup', value: students.filter(s => s.status === 'pending').length, color: '#f59e0b' },
    { label: 'BSCS', value: students.filter(s => s.course === 'BSCS').length, color: '#8b5cf6' },
    { label: 'BSIT', value: students.filter(s => s.course === 'BSIT').length, color: '#3b82f6' }
  ], [students]);

  const availableSections = useMemo(() => {
    const secs = students.map(s => s.section).filter(Boolean);
    return [...new Set(secs)].sort();
  }, [students]);

  const filteredFormSections = useMemo(() => {
    if (!form.course || !form.year_level) return [];
    return sections.filter(sec => {
      return sec.program?.program_code === form.course && sec.year_level == form.year_level;
    });
  }, [sections, form.course, form.year_level]);

  const formatSectionName = (name) => {
    if (!name) return '';
    const programPrefix = form.course + ' ';
    if (name.startsWith(programPrefix)) {
      return name.replace(programPrefix, '');
    }
    return name;
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName = `${s.last_name}, ${s.first_name} ${s.middle_name}`.toLowerCase();
      const matchSearch = !search || fullName.includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.student_number.toLowerCase().includes(search.toLowerCase());
      const matchCourse = !filterCourse || s.course === filterCourse;
      const matchYear = !filterYear || s.year_level == filterYear;
      const matchSection = !filterSection || s.section === filterSection;
      const matchStatus = !filterStatus || s.status === filterStatus;
      return matchSearch && matchCourse && matchYear && matchSection && matchStatus;
    }).sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      const lastCompare = a.last_name.localeCompare(b.last_name);
      if (lastCompare !== 0) return lastCompare;
      const firstCompare = a.first_name.localeCompare(b.first_name);
      if (firstCompare !== 0) return firstCompare;
      return (a.middle_name || '').localeCompare(b.middle_name || '');
    });
  }, [students, search, filterCourse, filterYear, filterSection, filterStatus]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const validateField = (field) => {
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
    } else if (field === 'course' || field === 'year_level') {
      setForm(prev => ({ ...prev, section_id: '' }));
      const newErrors = { ...formErrors };
      delete newErrors.section_id;
      setFormErrors(newErrors);
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

  const viewDetails = (student) => {
    navigate(`/${getBasePath()}/student-accounts/${student.id}`);
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormErrors({});
    setForm({
      first_name: '', last_name: '', student_number: '', email: '', course: '', year_level: '', section_id: '',
      guardian_first_name: '', guardian_last_name: '', guardian_relationship: '', guardian_contact_number: ''
    });
    setShowCreateModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormErrors({});
    const foundSection = sections.find(sec => sec.section_name === student.section);
    setForm({
      ...student,
      year_level: student.year_level.toString(),
      section_id: foundSection?.id || '',
      guardian_first_name: student.guardian?.first_name || '',
      guardian_last_name: student.guardian?.last_name || '',
      guardian_relationship: student.guardian?.relationship || '',
      guardian_contact_number: student.guardian?.contact_number || ''
    });
    setShowCreateModal(true);
  };

  const openEditFromView = (student) => {
    setViewingStudent(null);
    openEditModal(student);
  };

  const confirmDelete = (student) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };

  const deleteStudent = async () => {
    if (!deletingStudent) return;
    try {
      setShowDeleteModal(false);
      setViewingStudent(null);
      alert('Student account archived successfully.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive student.');
    }
  };

  const resendSetup = async (student) => {
    const count = getResendCount(student.id);
    if (count >= 3) return;
    try {
      setResendCounts(prev => ({ ...prev, [student.id]: count + 1 }));
      alert(`Setup email resent to ${student.email}. (${count + 1}/3 resends used)`);
    } catch (err) {
      alert('Failed to resend setup email.');
    }
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingImport(true);
    try {
      alert('Students imported successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to import students.');
    } finally {
      setLoadingImport(false);
    }
  };

  const saveStudent = async () => {
    const newErrors = {};
    if (!form.first_name) newErrors.first_name = 'Required';
    if (!form.last_name) newErrors.last_name = 'Required';
    if (!form.student_number) newErrors.student_number = 'Required';
    if (!form.email) newErrors.email = 'Required';
    if (!form.course) newErrors.course = 'Required';
    if (!form.year_level) newErrors.year_level = 'Required';
    if (!form.section_id) newErrors.section_id = 'Required';
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      setShowCreateModal(false);
      fetchData();
      alert(editingStudent ? 'Student account updated successfully.' : 'Student account created successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save student account.');
    } finally {
      setSaving(false);
    }
  };

  const closeViewModal = () => {
    setViewingStudent(null);
    navigate(`/${getBasePath()}/student-accounts`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Student Management</h2>
          <p className="page-sub">View and manage student profiles and accounts.</p>
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
            <input id="csvInput" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
            <button className="primary-btn" onClick={openCreateModal}>
              <svg viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Create Account
            </button>
          </div>
        )}
      </div>

      <div className="mini-stats">
        {miniStats.map((stat, idx) => (
          <div className={`mini-stat stat-${['blue', 'green', 'purple', 'orange', 'green'][idx]}`} key={idx}>
            <div className="mini-stat-icon" style={{ background: ['#eff6ff', '#f0fdf4', '#f5f3ff', '#fff5ef', '#f0fdf4'][idx], color: stat.color }}>
              <svg viewBox="0 0 20 20" fill="none">
                {idx === 0 && <path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
                {idx === 1 && <path d="M16 5L7.75 13.25 4 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                {idx === 2 && <><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>}
                {idx === 3 && <path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
                {idx === 4 && <path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
              </svg>
            </div>
            <div className="mini-stat-info">
              <span className="mini-stat-value" style={{ color: stat.color }}>{stat.value}</span>
              <span className="mini-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="table-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 18 18" fill="none"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search by name, email, or student number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="">All Programs</option>
            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}{y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th'} Year</option>)}
          </select>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {availableSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
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
            <p>Fetching students...</p>
          </div>
        )}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>STUDENT NO.</th>
                <th>PROGRAM</th>
                <th>YEAR</th>
                <th>GWA</th>
                <th>VIOLATIONS</th>
                <th>STATUS</th>
                {(isSecretary || isDeanOrChair) && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map(student => (
                <tr key={student.id} onClick={() => viewDetails(student)} className="clickable-row">
                  <td>
                    <div className="student-cell">
                      <div className="s-avatar" style={{ background: student.color }}>{student.first_name.charAt(0)}</div>
                      <div>
                        <p className="s-name">{student.last_name}, {student.first_name} {student.middle_name}</p>
                        <p className="s-sub">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`code-badge ${student.course === 'BSIT' ? 'badge-bsit' : 'badge-bscs'}`}>{student.student_number.replace('-', '')}</span></td>
                  <td>{student.course}</td>
                  <td>{student.year_level}-{extractSectionLetter(student.section) || '—'}</td>
                  <td><span className={`gwa-val ${student.gwa <= 1.75 ? 'gwa-good' : 'gwa-ok'}`}>{student.gwa || 'N/A'}</span></td>
                  <td><span className={`v-count ${student.violations_count > 0 ? 'v-danger' : 'v-clear'}`}>{student.violations_count || 0}</span></td>
                  <td>
                    <span className={`status-badge ${student.status === 'active' ? 'st-active' : 'st-pending'}`}>
                      {student.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  {(isSecretary || isDeanOrChair) && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-btns">
                        {isChair && (
                          <button className="action-btn edit" onClick={() => openEditModal(student)} title="Edit Student">
                            <svg viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2M2 14l2-2 8.5-8.5-2-2-8.5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                        {student.status === 'pending' && isSecretary && (
                          <button className="action-btn resend" onClick={() => resendSetup(student)} title="Resend setup email">
                            <svg viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                        <button className="action-btn delete" onClick={() => confirmDelete(student)} title="Archive">
                          <svg viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedStudents.length === 0 && !loading && (
                <tr>
                  <td colSpan={isSecretary || isDeanOrChair ? 8 : 7} className="empty-row">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > pageSize && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong> students
            </div>
            <div className="pagination-btns">
              <button className="pag-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className="pag-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`pag-page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
              </div>
              <button className="pag-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {viewingStudent && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-student-meta">
                <div className="s-avatar lg" style={{ background: viewingStudent.color }}>
                  {viewingStudent.first_name.charAt(0)}
                </div>
                <div>
                  <h3>{viewingStudent.last_name}, {viewingStudent.first_name} {viewingStudent.middle_name}</h3>
                  <p className="modal-sub">{viewingStudent.student_number.replace('-', '')} · {viewingStudent.course} · {formatYearSection(viewingStudent)}</p>
                </div>
              </div>
              <button className="close-btn" onClick={closeViewModal}>×</button>
            </div>

            <div className="modal-body profile-body">
              <div className="profile-section">
                <h4 className="section-title">Personal Information</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-key">Full Name</span>
                    <span className="detail-val">{viewingStudent.last_name}, {viewingStudent.first_name} {viewingStudent.middle_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Email Address</span>
                    <span className="detail-val">{viewingStudent.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Student Number</span>
                    <span className="detail-val"><span className="code-badge">{viewingStudent.student_number.replace('-', '')}</span></span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Academic Information</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-key">Program</span>
                    <span className="detail-val">{viewingStudent.course}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Year & Section</span>
                    <span className="detail-val">{viewingStudent.year_level}-{extractSectionLetter(viewingStudent.section) || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Status</span>
                    <span className="detail-val">
                      <span className={`status-badge ${viewingStudent.status === 'active' ? 'st-active' : 'st-pending'}`}>
                        {viewingStudent.status.toUpperCase()}
                      </span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Date Created</span>
                    <span className="detail-val">{viewingStudent.created_at}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Guardian Information</h4>
                {viewingStudent.guardian ? (
                  <div className="detail-rows">
                    <div className="detail-row">
                      <span className="detail-key">Guardian Name</span>
                      <span className="detail-val">{viewingStudent.guardian.first_name} {viewingStudent.guardian.last_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Relationship</span>
                      <span className="detail-val">{viewingStudent.guardian.relationship}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Contact Number</span>
                      <span className="detail-val">{viewingStudent.guardian.contact_number}</span>
                    </div>
                  </div>
                ) : (
                  <div className="detail-rows">
                    <div className="detail-row">
                      <span className="detail-val" style={{ textAlign: 'left', color: '#b89f90', fontStyle: 'italic' }}>No guardian information provided.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h4 className="section-title">Affiliations</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-val" style={{ textAlign: 'left', color: '#b89f90', fontStyle: 'italic' }}>No affiliations recorded.</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Skills</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-val" style={{ textAlign: 'left', color: '#b89f90', fontStyle: 'italic' }}>No skills recorded.</span>
                  </div>
                </div>
              </div>

              {viewingStudent.status === 'pending' && isSecretary && (
                <div className="resend-row">
                  <div className="resend-info">
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    <span>Setup email <strong>resent {getResendCount(viewingStudent.id)}/3 times</strong></span>
                  </div>
                  <button className="resend-btn" onClick={() => resendSetup(viewingStudent)} disabled={getResendCount(viewingStudent.id) >= 3}>
                    {getResendCount(viewingStudent.id) >= 3 ? 'Limit Reached' : 'Resend Email'}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="ghost-btn" onClick={closeViewModal}>Close</button>
              {isChair && (
                <button className="secondary-btn" onClick={() => openEditFromView(viewingStudent)}>
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M11.5 2.5l2 2M2 14l2-2 8.5-8.5-2-2-8.5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Edit
                </button>
              )}
              {(isSecretary || isDeanOrChair) && (
                <button className="danger-btn" onClick={() => confirmDelete(viewingStudent)}>
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  Archive
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {(isSecretary || isChair) && showCreateModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Edit Student Account' : 'Create Student Account'}</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)} disabled={saving}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name <span className="req">*</span></label>
                  <input name="first_name" value={form.first_name} onChange={handleInputChange} type="text" placeholder="First name" disabled={saving} className={formErrors.first_name ? 'error-input' : ''} onBlur={() => validateField('first_name')} />
                  {formErrors.first_name && <span className="field-error">{formErrors.first_name}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name <span className="req">*</span></label>
                  <input name="last_name" value={form.last_name} onChange={handleInputChange} type="text" placeholder="Last name" disabled={saving} className={formErrors.last_name ? 'error-input' : ''} onBlur={() => validateField('last_name')} />
                  {formErrors.last_name && <span className="field-error">{formErrors.last_name}</span>}
                </div>
                <div className="form-group">
                  <label>Student Number <span className="req">*</span></label>
                  <input name="student_number" value={form.student_number} onChange={handleInputChange} type="text" placeholder="e.g. 2024-00001" disabled={saving} className={formErrors.student_number ? 'error-input' : ''} onBlur={() => validateField('student_number')} />
                  {formErrors.student_number && <span className="field-error">{formErrors.student_number}</span>}
                </div>
                <div className="form-group">
                  <label>Email Address <span className="req">*</span></label>
                  <input name="email" value={form.email} onChange={handleInputChange} type="email" placeholder="student@school.edu.ph" disabled={saving || !!editingStudent} className={formErrors.email ? 'error-input' : ''} onBlur={() => validateField('email')} />
                  {formErrors.email && <span className="field-error">{formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Program <span className="req">*</span></label>
                  <select name="course" value={form.course} onChange={handleInputChange} disabled={saving} className={formErrors.course ? 'error-input' : ''} onBlur={() => validateField('course')}>
                    <option value="">Select Program</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {formErrors.course && <span className="field-error">{formErrors.course}</span>}
                </div>
                <div className="form-group">
                  <label>Year Level <span className="req">*</span></label>
                  <select name="year_level" value={form.year_level} onChange={handleInputChange} disabled={saving} className={formErrors.year_level ? 'error-input' : ''} onBlur={() => validateField('year_level')}>
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}{y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th'} Year</option>)}
                  </select>
                  {formErrors.year_level && <span className="field-error">{formErrors.year_level}</span>}
                </div>
                <div className="form-group full-span">
                  <label>Section <span className="req">*</span></label>
                  <select name="section_id" value={form.section_id} onChange={handleInputChange} disabled={saving || !form.course || !form.year_level} className={formErrors.section_id ? 'error-input' : ''} onBlur={() => validateField('section_id')}>
                    <option value="">{form.course && form.year_level ? 'Select Section' : 'Please select Program and Year Level first'}</option>
                    {filteredFormSections.map(sec => <option key={sec.id} value={sec.id}>{formatSectionName(sec.section_name)}</option>)}
                  </select>
                  {formErrors.section_id && <span className="field-error">{formErrors.section_id}</span>}
                </div>

                <div className="form-divider full-span">Guardian Information</div>
                <div className="form-group">
                  <label>Guardian First Name</label>
                  <input name="guardian_first_name" value={form.guardian_first_name} onChange={handleInputChange} type="text" placeholder="First name" disabled={saving} />
                </div>
                <div className="form-group">
                  <label>Guardian Last Name</label>
                  <input name="guardian_last_name" value={form.guardian_last_name} onChange={handleInputChange} type="text" placeholder="Last name" disabled={saving} />
                </div>
                <div className="form-group">
                  <label>Relationship</label>
                  <input name="guardian_relationship" value={form.guardian_relationship} onChange={handleInputChange} type="text" placeholder="e.g. Mother, Father" disabled={saving} />
                </div>
                <div className="form-group">
                  <label>Guardian Contact Number</label>
                  <input name="guardian_contact_number" value={form.guardian_contact_number} onChange={handleInputChange} type="text" placeholder="Contact number" disabled={saving} />
                </div>
              </div>
              {!editingStudent && (
                <div className="modal-notice">
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  A password setup link will be sent to the student's email after account creation.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="ghost-btn" onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</button>
              <button className="primary-btn" onClick={saveStudent} disabled={saving}>
                {saving && <span className="spinner-sm"></span>}
                {saving ? 'Saving...' : editingStudent ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isSecretary || isDeanOrChair) && showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Archive Student Account</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="delete-msg">
                Are you sure you want to archive the account of
                <strong> {deletingStudent?.last_name}, {deletingStudent?.first_name} {deletingStudent?.middle_name}</strong>?
                The account will be moved to the archive and can be recovered by the Dean.
              </p>
            </div>
            <div className="modal-footer">
              <button className="ghost-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="danger-btn" onClick={deleteStudent}>Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}