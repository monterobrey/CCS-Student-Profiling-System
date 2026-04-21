import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, ROLES } from '../../context/AuthContext';
import { studentService } from '../../services';
import { httpClient } from '../../services/httpClient';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import styles from '../../styles/Shared/StudentManagement.module.css';

const COLORS = ['#FF6B1A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const EMPTY_FORM = {
  first_name: '', last_name: '', middle_name: '', student_number: '',
  email: '', program_id: '', year_level: '', section_id: '',
  guardian_first_name: '', guardian_last_name: '',
  guardian_relationship: '', guardian_contact_number: '',
};

export default function StudentManagement() {
  const cx = (...names) => names.filter(Boolean).map(n => styles[n]).filter(Boolean).join(' ');

  const { role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const queryClient = useQueryClient();

  const isSecretary   = role === ROLES.SECRETARY;
  const isDeanOrChair = role === ROLES.DEAN || role === ROLES.CHAIR;
  const isChair       = role === ROLES.CHAIR;

  // ── Cached queries (staleTime: Infinity — never auto-refetch) ──
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await studentService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.SECTIONS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.PROGRAMS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const loading = loadingStudents;

  const [loadingImport, setLoadingImport] = useState(false);
  const [saving,        setSaving]        = useState(false);

  const [search,         setSearch]         = useState('');
  const [filterProgram,  setFilterProgram]  = useState('');
  const [filterYear,     setFilterYear]     = useState('');
  const [filterSection,  setFilterSection]  = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStudent,  setEditingStudent]  = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [toast,      setToast]      = useState(null);
  const [resendCounts, setResendCounts] = useState({});

  /* ===========================
     HELPERS
  =========================== */

  const getBasePath = () => {
    if (role === ROLES.DEAN)      return 'dean';
    if (role === ROLES.CHAIR)     return 'department-chair';
    if (role === ROLES.SECRETARY) return 'secretary';
    return 'dean';
  };

  // derived from cached students + url param
  const viewingStudent = id ? students.find(s => String(s.id) === String(id)) ?? null : null;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const getColor = (id) => COLORS[id % COLORS.length];

  const extractSectionLetter = (sectionName) => {
    if (!sectionName) return '';
    const match = sectionName.match(/[- ](\w)$/i);
    return match ? match[1] : sectionName;
  };

  const formatYearSection = (student) => {
    if (!student.year_level || !student.section) return 'No Section';
    return `${student.year_level}-${extractSectionLetter(student.section?.section_name)}`;
  };

  const getResendCount = (studentId) => resendCounts[studentId] || 0;

  /* ===========================
     DERIVED DATA
  =========================== */

  const miniStats = useMemo(() => [
    { label: 'Total Students', value: students.length,                                                 color: '#3b82f6', iconBg: '#eff6ff'  },
    { label: 'Active',         value: students.filter(s => s.user?.status === 'active').length,        color: '#16a34a', iconBg: '#f0fdf4'  },
    { label: 'Pending Setup',  value: students.filter(s => s.user?.status === 'pending').length,       color: '#f97316', iconBg: '#fff7ed'  },
    { label: 'BSCS',           value: students.filter(s => s.program?.program_code === 'BSCS').length, color: '#8b5cf6', iconBg: '#f5f3ff'  },
    { label: 'BSIT',           value: students.filter(s => s.program?.program_code === 'BSIT').length, color: '#0891b2', iconBg: '#ecfeff'  },
  ], [students]);

  const availableSections = useMemo(() => {
    return students
      .filter(s => {
        const matchProgram = !filterProgram || s.program?.program_code === filterProgram;
        const matchYear    = !filterYear    || String(s.year_level) === String(filterYear);
        return matchProgram && matchYear;
      })
      .map(s => s.section?.section_name)
      .filter(Boolean);
  }, [students, filterProgram, filterYear]);

  const uniqueSections = useMemo(() => [...new Set(availableSections)].sort(), [availableSections]);

  const filteredFormSections = useMemo(() => {
    if (!form.program_id || !form.year_level) return [];
    return sections.filter(sec =>
      String(sec.program_id) === String(form.program_id) && String(sec.year_level) === String(form.year_level)
    );
  }, [sections, form.program_id, form.year_level]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName   = `${s.last_name}, ${s.first_name} ${s.middle_name || ''}`.toLowerCase();
      const email      = s.user?.email?.toLowerCase() || '';
      const studNum    = s.user?.student_number?.toLowerCase() || '';
      const progCode   = s.program?.program_code || '';
      const secName    = s.section?.section_name || '';
      const status     = s.user?.status || '';

      const matchSearch  = !search        || fullName.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || studNum.includes(search.toLowerCase());
      const matchProgram = !filterProgram || progCode === filterProgram;
      const matchYear    = !filterYear    || String(s.year_level) === String(filterYear);
      const matchSection = !filterSection || secName === filterSection;
      const matchStatus  = !filterStatus  || status === filterStatus;

      return matchSearch && matchProgram && matchYear && matchSection && matchStatus;
    }).sort((a, b) => {
      if (a.user?.status === 'pending' && b.user?.status !== 'pending') return -1;
      if (a.user?.status !== 'pending' && b.user?.status === 'pending') return 1;
      const last = a.last_name.localeCompare(b.last_name);
      if (last !== 0) return last;
      return a.first_name.localeCompare(b.first_name);
    });
  }, [students, search, filterProgram, filterYear, filterSection, filterStatus]);

  const totalPages      = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /* ===========================
     MODAL ACTIONS
  =========================== */

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormErrors({});
    setForm(EMPTY_FORM);
    setShowCreateModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormErrors({});
    setForm({
      first_name:               student.first_name,
      last_name:                student.last_name,
      middle_name:              student.middle_name || '',
      student_number:           student.user?.student_number || '',
      email:                    student.user?.email || '',
      program_id:               student.program_id?.toString() || '',
      year_level:               student.year_level?.toString() || '',
      section_id:               student.section_id?.toString() || '',
      guardian_first_name:      student.guardian?.first_name || '',
      guardian_last_name:       student.guardian?.last_name || '',
      guardian_relationship:    student.guardian?.relationship || '',
      guardian_contact_number:  student.guardian?.contact_number || '',
    });
    setShowCreateModal(true);
  };

  const openEditFromView = (student) => {
    navigate(`/${getBasePath()}/student-accounts`);
    openEditModal(student);
  };

  const viewDetails = (student) => {
    navigate(`/${getBasePath()}/student-accounts/${student.id}`);
  };

  const closeViewModal = () => {
    navigate(`/${getBasePath()}/student-accounts`);
  };

  const confirmDelete = (student) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };

  /* ===========================
     SAVE
  =========================== */

  const saveStudent = async () => {
    const errors = {};
    if (!form.first_name)     errors.first_name     = 'Required';
    if (!form.last_name)      errors.last_name      = 'Required';
    if (!form.student_number) errors.student_number = 'Required';
    if (!form.email)          errors.email          = 'Required';
    if (!form.program_id)     errors.program_id     = 'Required';
    if (!form.year_level)     errors.year_level     = 'Required';
    if (!form.section_id)     errors.section_id     = 'Required';

    // Check for duplicate student number (excluding current student if editing)
    const duplicateStudentNumber = students.some(s => 
      s.user?.student_number?.toLowerCase() === form.student_number.toLowerCase() &&
      (!editingStudent || s.id !== editingStudent.id)
    );
    if (duplicateStudentNumber) {
      errors.student_number = 'Student number is already taken';
    }

    // Check for duplicate email (excluding current student if editing)
    const duplicateEmail = students.some(s => 
      s.user?.email?.toLowerCase() === form.email.toLowerCase() &&
      (!editingStudent || s.id !== editingStudent.id)
    );
    if (duplicateEmail) {
      errors.email = 'Email is already taken';
    }

    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSaving(true);
    try {
      const payload = {
        first_name:     form.first_name,
        last_name:      form.last_name,
        middle_name:    form.middle_name || null,
        student_number: form.student_number,
        email:          form.email,
        program_id:     form.program_id,
        year_level:     parseInt(form.year_level),
        section_id:     form.section_id,
        guardian: (form.guardian_first_name || form.guardian_last_name) ? {
          first_name:      form.guardian_first_name,
          last_name:       form.guardian_last_name,
          relationship:    form.guardian_relationship,
          contact_number:  form.guardian_contact_number,
        } : null,
      };

      const res = editingStudent
        ? await studentService.update(editingStudent.id, payload)
        : await studentService.create(payload);

      if (res.ok) {
        showToast('success', res.message || (editingStudent ? 'Student updated.' : 'Student created.'));
        setShowCreateModal(false);

        // Update cache directly — no refetch
        queryClient.setQueryData(['students'], (old = []) => {
          if (editingStudent) {
            return old.map(s => s.id === res.data.id ? res.data : s);
          }
          return [...old, res.data];
        });
      } else {
        const firstError = res.errors ? Object.values(res.errors)[0]?.[0] : null;
        showToast('error', firstError || res.message || 'Failed to save student.');
      }
    } catch {
      showToast('error', 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  /* ===========================
     DELETE / ARCHIVE
  =========================== */

  const deleteStudent = async () => {
    if (!deletingStudent) return;
    try {
      const res = await studentService.delete(deletingStudent.id);
      if (res.ok) {
        showToast('success', 'Student archived successfully.');
        setShowDeleteModal(false);
        // Remove from cache directly — no refetch
        queryClient.setQueryData(['students'], (old = []) =>
          old.filter(s => s.id !== deletingStudent.id)
        );
      } else {
        showToast('error', res.message || 'Failed to archive student.');
      }
    } catch {
      showToast('error', 'Failed to archive student.');
    }
  };

  /* ===========================
     RESEND SETUP EMAIL
  =========================== */

  const resendSetup = async (student) => {
    const count = getResendCount(student.id);
    if (count >= 3) return;
    try {
      const res = await studentService.resendSetup(student.id);
      if (res.ok) {
        setResendCounts(prev => ({ ...prev, [student.id]: count + 1 }));
        showToast('success', `Setup email resent to ${student.user?.email}. (${count + 1}/3)`);
      } else {
        showToast('error', res.message || 'Failed to resend setup email.');
      }
    } catch {
      showToast('error', 'Failed to resend setup email.');
    }
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingImport(true);
    try {
      const res = await studentService.importFromCSV(file);
      if (res.success) {
        showToast('success', `${res.data?.imported ?? 0} students imported.`);
        // Full refetch needed here — we don't know what was imported
        queryClient.invalidateQueries({ queryKey: ['students'] });
      } else {
        showToast('error', res.message || 'Import failed.');
      }
    } catch {
      showToast('error', 'Import failed.');
    } finally {
      setLoadingImport(false);
      e.target.value = '';
    }
  };

  /* ===========================
     JSX
  =========================== */

  return (
    <div className={styles.page}>

      {/* TOAST */}
      {toast && <div className={cx('toast', `toast-${toast.type}`)}>{toast.message}</div>}

      {/* HEADER */}
      <div className={styles['page-header']}>
        <div>
          <h2 className={styles['page-title']}>Student Management</h2>
          <p className={styles['page-sub']}>View and manage student profiles and accounts.</p>
        </div>
        {isSecretary && (
          <div className={styles['header-actions']}>
            <button className={styles['ghost-btn']} onClick={() => document.getElementById('csvInput')?.click()} disabled={loadingImport}>
              {loadingImport
                ? <svg className={styles['spinner-sm']} viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5"/></svg>
                : <svg viewBox="0 0 18 18" fill="none"><path d="M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1M9 2v9M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
              {loadingImport ? 'Importing...' : 'Import CSV'}
            </button>
            <input id="csvInput" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
            <button className={styles['primary-btn']} onClick={openCreateModal}>
              <svg viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Create Account
            </button>
          </div>
        )}
      </div>

      {/* MINI STATS */}
      <div className={styles['mini-stats']}>
        {miniStats.map((s, idx) => (
          <div className={styles['mini-stat-card']} key={idx}>
            <div className={styles['mini-stat-border']} style={{ background: s.color }}></div>
            <div className={styles['mini-stat-content']}>
              <div className={styles['mini-stat-icon']} style={{ background: s.iconBg, color: s.color }}>
                <svg viewBox="0 0 24 24" fill="none">
                  {idx === 0 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></>}
                  {idx === 1 && <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                  {idx === 2 && <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>}
                  {idx === 3 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></>}
                  {idx === 4 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></>}
                </svg>
              </div>
              <div className={styles['mini-stat-info']}>
                <span className={styles['mini-stat-value']} style={{ color: s.color }}>{s.value}</span>
                <span className={styles['mini-stat-label']}>{s.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className={styles['table-toolbar']}>
        <div className={styles['search-wrap']}>
          <svg viewBox="0 0 18 18" fill="none"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search by name, email, or student number..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles['filter-group']}>
          <select value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterSection(''); setFilterYear(''); }}>
            <option value="">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.program_code}>{p.program_code}</option>)}
          </select>
          <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterSection(''); }}>
            <option value="">All Years</option>
            {['1','2','3','4'].map(y => <option key={y} value={y}>{y}{y==='1'?'st':y==='2'?'nd':y==='3'?'rd':'th'} Year</option>)}
          </select>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {uniqueSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className={styles['table-card']}>
        {loading && (
          <div className={styles['loading-overlay']}>
            <div className={styles['spinner-lg']}></div>
            <p>Fetching students...</p>
          </div>
        )}
        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
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
              {paginatedStudents.map(student => {
                const status    = student.user?.status || 'pending';
                const progCode  = student.program?.program_code || '—';
                const studNum   = student.user?.student_number || '—';
                const email     = student.user?.email || '—';
                const secLetter = extractSectionLetter(student.section?.section_name);
                const color     = getColor(student.id);

                return (
                  <tr key={student.id} onClick={() => viewDetails(student)} className={styles['clickable-row']}>
                    <td>
                      <div className={styles['student-cell']}>
                        <div className={styles['s-avatar']} style={{ background: color }}>{student.first_name.charAt(0)}</div>
                        <div>
                          <p className={styles['s-name']}>{student.last_name}, {student.first_name} {student.middle_name}</p>
                          <p className={styles['s-sub']}>{email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={cx('code-badge', progCode === 'BSIT' ? 'badge-bsit' : 'badge-bscs')}>{studNum}</span></td>
                    <td>{progCode}</td>
                    <td>{student.year_level}-{secLetter || '—'}</td>
                    <td><span className={cx('gwa-val', student.gwa && student.gwa <= 1.75 ? 'gwa-good' : 'gwa-ok')}>{student.gwa || 'N/A'}</span></td>
                    <td><span className={cx('v-count', (student.violations?.length || 0) > 0 ? 'v-danger' : 'v-clear')}>{student.violations?.length || 0}</span></td>
                    <td>
                      <span className={cx('status-badge', status === 'active' ? 'st-active' : 'st-pending')}>
                        {status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    {(isSecretary || isDeanOrChair) && (
                      <td onClick={e => e.stopPropagation()}>
                        <div className={styles['action-btns']}>
                          {isChair && (
                            <button className={cx('action-btn', 'edit')} onClick={() => openEditModal(student)} title="Edit">
                              <svg viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2M2 14l2-2 8.5-8.5-2-2-8.5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          {status === 'pending' && isSecretary && (
                            <button className={cx('action-btn', 'resend')} onClick={() => resendSetup(student)} title="Resend setup email">
                              <svg viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          <button className={cx('action-btn', 'delete')} onClick={() => confirmDelete(student)} title="Archive">
                            <svg viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {paginatedStudents.length === 0 && !loading && (
                <tr><td colSpan={isSecretary || isDeanOrChair ? 8 : 7} className={styles['empty-row']}>No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > pageSize && (
          <div className={styles['pagination-bar']}>
            <div className={styles['pagination-info']}>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong> students
            </div>
            <div className={styles['pagination-btns']}>
              <button className={styles['pag-btn']} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={styles['pag-pages']}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={cx('pag-page-btn', currentPage === p ? 'active' : '')} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
              </div>
              <button className={styles['pag-btn']} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>


      {/* VIEW MODAL */}
      {viewingStudent && (() => {
        const status   = viewingStudent.user?.status || 'pending';
        const progCode = viewingStudent.program?.program_code || '—';
        const studNum  = viewingStudent.user?.student_number || '—';
        const email    = viewingStudent.user?.email || '—';
        const color    = getColor(viewingStudent.id);
        return (
          <div className={styles['modal-overlay']} onClick={closeViewModal}>
            <div className={cx('modal', 'modal-lg')} onClick={e => e.stopPropagation()}>
              <div className={styles['modal-header']}>
                <div className={styles['modal-student-meta']}>
                  <div className={cx('s-avatar', 'lg')} style={{ background: color }}>{viewingStudent.first_name.charAt(0)}</div>
                  <div>
                    <h3>{viewingStudent.last_name}, {viewingStudent.first_name} {viewingStudent.middle_name}</h3>
                    <p className={styles['modal-sub']}>{studNum} · {progCode} · {formatYearSection(viewingStudent)}</p>
                  </div>
                </div>
                <button className={styles['close-btn']} onClick={closeViewModal}>×</button>
              </div>

              <div className={cx('modal-body', 'profile-body')}>
                <div className={styles['profile-section']}>
                  <h4 className={styles['section-title']}>Personal Information</h4>
                  <div className={styles['detail-rows']}>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Full Name</span><span className={styles['detail-val']}>{viewingStudent.last_name}, {viewingStudent.first_name} {viewingStudent.middle_name}</span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Email Address</span><span className={styles['detail-val']}>{email}</span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Student Number</span><span className={styles['detail-val']}><span className={styles['code-badge']}>{studNum}</span></span></div>
                  </div>
                </div>

                <div className={styles['profile-section']}>
                  <h4 className={styles['section-title']}>Academic Information</h4>
                  <div className={styles['detail-rows']}>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Program</span><span className={styles['detail-val']}>{progCode}</span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Year & Section</span><span className={styles['detail-val']}>{formatYearSection(viewingStudent)}</span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Status</span><span className={styles['detail-val']}><span className={cx('status-badge', status === 'active' ? 'st-active' : 'st-pending')}>{status.toUpperCase()}</span></span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>GWA</span><span className={styles['detail-val']}>{viewingStudent.gwa || 'N/A'}</span></div>
                  </div>
                </div>

                <div className={styles['profile-section']}>
                  <h4 className={styles['section-title']}>Guardian Information</h4>
                  {viewingStudent.guardian ? (
                    <div className={styles['detail-rows']}>
                      <div className={styles['detail-row']}><span className={styles['detail-key']}>Guardian Name</span><span className={styles['detail-val']}>{viewingStudent.guardian.first_name} {viewingStudent.guardian.last_name}</span></div>
                      <div className={styles['detail-row']}><span className={styles['detail-key']}>Relationship</span><span className={styles['detail-val']}>{viewingStudent.guardian.relationship}</span></div>
                      <div className={styles['detail-row']}><span className={styles['detail-key']}>Contact Number</span><span className={styles['detail-val']}>{viewingStudent.guardian.contact_number}</span></div>
                    </div>
                  ) : (
                    <div className={styles['detail-rows']}><div className={styles['detail-row']}><span className={styles['detail-val']} style={{ color: '#b89f90', fontStyle: 'italic' }}>No guardian information provided.</span></div></div>
                  )}
                </div>

                {status === 'pending' && isSecretary && (
                  <div className={styles['resend-row']}>
                    <div className={styles['resend-info']}>
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      <span>Setup email <strong>resent {getResendCount(viewingStudent.id)}/3 times</strong></span>
                    </div>
                    <button className={styles['resend-btn']} onClick={() => resendSetup(viewingStudent)} disabled={getResendCount(viewingStudent.id) >= 3}>
                      {getResendCount(viewingStudent.id) >= 3 ? 'Limit Reached' : 'Resend Email'}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles['modal-footer']}>
                <button className={styles['ghost-btn']} onClick={closeViewModal}>Close</button>
                {isChair && (
                  <button className={styles['secondary-btn']} onClick={() => openEditFromView(viewingStudent)}>
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M11.5 2.5l2 2M2 14l2-2 8.5-8.5-2-2-8.5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Edit
                  </button>
                )}
                {(isSecretary || isDeanOrChair) && (
                  <button className={styles['danger-btn']} onClick={() => confirmDelete(viewingStudent)}>
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Archive
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CREATE / EDIT MODAL */}
      {(isSecretary || isChair) && showCreateModal && (
        <div className={styles['modal-overlay']} onClick={() => !saving && setShowCreateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>{editingStudent ? 'Edit Student Account' : 'Create Student Account'}</h3>
              <button className={styles['close-btn']} onClick={() => setShowCreateModal(false)} disabled={saving}>×</button>
            </div>
            <div className={styles['modal-body']}>
              <div className={styles['form-grid']}>
                <div className={styles['form-group']}>
                  <label>First Name <span className={styles.req}>*</span></label>
                  <input name="first_name" value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} placeholder="First name" disabled={saving} className={formErrors.first_name ? styles['error-input'] : ''} />
                  {formErrors.first_name && <span className={styles['field-error']}>{formErrors.first_name}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Last Name <span className={styles.req}>*</span></label>
                  <input name="last_name" value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} placeholder="Last name" disabled={saving} className={formErrors.last_name ? styles['error-input'] : ''} />
                  {formErrors.last_name && <span className={styles['field-error']}>{formErrors.last_name}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Middle Name</label>
                  <input name="middle_name" value={form.middle_name} onChange={e => setForm(p => ({...p, middle_name: e.target.value}))} placeholder="Middle name" disabled={saving} />
                </div>
                <div className={styles['form-group']}>
                  <label>Student Number <span className={styles.req}>*</span></label>
                  <input name="student_number" value={form.student_number} onChange={e => setForm(p => ({...p, student_number: e.target.value}))} placeholder="e.g. 2024-00001" disabled={saving} className={formErrors.student_number ? styles['error-input'] : ''} />
                  {formErrors.student_number && <span className={styles['field-error']}>{formErrors.student_number}</span>}
                </div>
                <div className={cx('form-group', 'full-span')}>
                  <label>Email Address <span className={styles.req}>*</span></label>
                  <input name="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} type="email" placeholder="student@school.edu.ph" disabled={saving || !!editingStudent} className={formErrors.email ? styles['error-input'] : ''} />
                  {formErrors.email && <span className={styles['field-error']}>{formErrors.email}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Program <span className={styles.req}>*</span></label>
                  <select value={form.program_id} onChange={e => setForm(p => ({...p, program_id: e.target.value, section_id: ''}))} disabled={saving} className={formErrors.program_id ? styles['error-input'] : ''}>
                    <option value="">Select Program</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.program_code}</option>)}
                  </select>
                  {formErrors.program_id && <span className={styles['field-error']}>{formErrors.program_id}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Year Level <span className={styles.req}>*</span></label>
                  <select value={form.year_level} onChange={e => setForm(p => ({...p, year_level: e.target.value, section_id: ''}))} disabled={saving} className={formErrors.year_level ? styles['error-input'] : ''}>
                    <option value="">Select Year</option>
                    {['1','2','3','4'].map(y => <option key={y} value={y}>{y}{y==='1'?'st':y==='2'?'nd':y==='3'?'rd':'th'} Year</option>)}
                  </select>
                  {formErrors.year_level && <span className={styles['field-error']}>{formErrors.year_level}</span>}
                </div>
                <div className={cx('form-group', 'full-span')}>
                  <label>Section <span className={styles.req}>*</span></label>
                  <select value={form.section_id} onChange={e => setForm(p => ({...p, section_id: e.target.value}))} disabled={saving || !form.program_id || !form.year_level} className={formErrors.section_id ? styles['error-input'] : ''}>
                    <option value="">{form.program_id && form.year_level ? 'Select Section' : 'Select Program and Year Level first'}</option>
                    {filteredFormSections.map(sec => <option key={sec.id} value={sec.id}>{sec.section_name}</option>)}
                  </select>
                  {formErrors.section_id && <span className={styles['field-error']}>{formErrors.section_id}</span>}
                </div>

                <div className={cx('form-divider', 'full-span')}>Guardian Information</div>
                <div className={styles['form-group']}>
                  <label>Guardian First Name</label>
                  <input value={form.guardian_first_name} onChange={e => setForm(p => ({...p, guardian_first_name: e.target.value}))} placeholder="First name" disabled={saving} />
                </div>
                <div className={styles['form-group']}>
                  <label>Guardian Last Name</label>
                  <input value={form.guardian_last_name} onChange={e => setForm(p => ({...p, guardian_last_name: e.target.value}))} placeholder="Last name" disabled={saving} />
                </div>
                <div className={styles['form-group']}>
                  <label>Relationship</label>
                  <input value={form.guardian_relationship} onChange={e => setForm(p => ({...p, guardian_relationship: e.target.value}))} placeholder="e.g. Mother, Father" disabled={saving} />
                </div>
                <div className={styles['form-group']}>
                  <label>Guardian Contact</label>
                  <input value={form.guardian_contact_number} onChange={e => setForm(p => ({...p, guardian_contact_number: e.target.value}))} placeholder="Contact number" disabled={saving} />
                </div>
              </div>
              {!editingStudent && (
                <div className={styles['modal-notice']}>
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  A password setup link will be sent to the student's email after account creation.
                </div>
              )}
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['ghost-btn']} onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</button>
              <button className={styles['primary-btn']} onClick={saveStudent} disabled={saving}>
                {saving && <span className={styles['spinner-sm']}></span>}
                {saving ? 'Saving...' : editingStudent ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE MODAL */}
      {(isSecretary || isDeanOrChair) && showDeleteModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowDeleteModal(false)}>
          <div className={cx('modal', 'modal-sm')} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>Archive Student Account</h3>
              <button className={styles['close-btn']} onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className={styles['modal-body']}>
              <p className={styles['delete-msg']}>
                Are you sure you want to archive the account of
                <strong> {deletingStudent?.last_name}, {deletingStudent?.first_name} {deletingStudent?.middle_name}</strong>?
                The account will be moved to the archive and can be recovered by the Dean.
              </p>
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['ghost-btn']} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className={styles['danger-btn']} onClick={deleteStudent}>Archive</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
