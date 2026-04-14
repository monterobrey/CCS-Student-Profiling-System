import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, ROLES } from '../../context/AuthContext';
import { facultyService } from '../../services';
import { httpClient } from '../../services/httpClient';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import styles from '../../styles/Shared/FacultyManagement.module.css';

const COLORS = ['#FF6B1A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const POSITIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Instructor', 'Department Chair'];

const EMPTY_FORM = {
  title: '', first_name: '', last_name: '', middle_name: '',
  email: '', department_id: '', position: 'Instructor', program_id: '',
};

export default function FacultyManagement() {
  const cx = (...names) => names.filter(Boolean).map(n => styles[n]).filter(Boolean).join(' ');

  const { role } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const isSecretary   = role === ROLES.SECRETARY;
  const isDean        = role === ROLES.DEAN;
  const isDeanOrChair = role === ROLES.DEAN || role === ROLES.CHAIR;

  // ── Cached queries ──
  const { data: faculty = [], isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const res = await facultyService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.DEPARTMENTS.LIST);
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

  const [search,          setSearch]          = useState('');
  const [filterDept,      setFilterDept]      = useState('');
  const [filterPosition,  setFilterPosition]  = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [currentPage,     setCurrentPage]     = useState(1);
  const pageSize = 50;

  const [showModal,        setShowModal]        = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingFaculty,   setEditingFaculty]   = useState(null);
  const [archivingFaculty, setArchivingFaculty] = useState(null);
  const [loadingImport,    setLoadingImport]    = useState(false);
  const [saving,           setSaving]           = useState(false);

  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formErrors,   setFormErrors]   = useState({});
  const [toast,        setToast]        = useState(null);
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

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const getColor  = (fid) => COLORS[fid % COLORS.length];
  const getResendCount = (fid) => resendCounts[fid] || 0;

  const calculateLoad = (f) => {
    if (!f.schedules?.length) return 0;
    const seen = new Set();
    let total = 0;
    f.schedules.forEach(s => {
      const key = `${s.course_id}-${s.section_id}`;
      if (!seen.has(key)) { seen.add(key); total += s.course?.units || 0; }
    });
    return total;
  };

  // derived from cache + url param
  const viewingFaculty = id ? faculty.find(f => f.id == id) ?? null : null;

  /* ===========================
     DERIVED DATA
  =========================== */

  const miniStats = useMemo(() => [
    { label: 'Total Faculty',  value: faculty.length,                                              color: '#3b82f6', iconBg: '#eff6ff'  },
    { label: 'Active',         value: faculty.filter(f => f.user?.status === 'active').length,     color: '#16a34a', iconBg: '#f0fdf4'  },
    { label: 'Pending Setup',  value: faculty.filter(f => f.user?.status === 'pending').length,    color: '#f97316', iconBg: '#f3f4f6'  },
  ], [faculty]);

  const filteredFaculty = useMemo(() => {
    return faculty.filter(f => {
      const fullName    = `${f.last_name}, ${f.first_name} ${f.middle_name || ''}`.toLowerCase();
      const email       = f.user?.email?.toLowerCase() || '';
      const status      = f.user?.status || '';
      const matchSearch   = !search         || fullName.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      const matchDept     = !filterDept     || f.department_id == filterDept;
      const matchPosition = !filterPosition || f.position === filterPosition;
      const matchStatus   = !filterStatus   || status === filterStatus;
      return matchSearch && matchDept && matchPosition && matchStatus;
    }).sort((a, b) => {
      if (a.user?.status === 'pending' && b.user?.status !== 'pending') return -1;
      if (a.user?.status !== 'pending' && b.user?.status === 'pending') return 1;
      const last = a.last_name.localeCompare(b.last_name);
      return last !== 0 ? last : a.first_name.localeCompare(b.first_name);
    });
  }, [faculty, search, filterDept, filterPosition, filterStatus]);

  const totalPages       = Math.ceil(filteredFaculty.length / pageSize);
  const paginatedFaculty = filteredFaculty.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /* ===========================
     MODAL ACTIONS
  =========================== */

  const viewDetails = (f) => navigate(`/${getBasePath()}/faculty-accounts/${f.id}`);

  const closeViewModal = () => navigate(`/${getBasePath()}/faculty-accounts`);

  const openCreateModal = () => {
    setEditingFaculty(null);
    setFormErrors({});
    setForm({ ...EMPTY_FORM, department_id: departments[0]?.id || '' });
    setShowModal(true);
  };

  const openEditModal = (f) => {
    setEditingFaculty(f);
    setFormErrors({});
    setForm({
      title:         f.title || '',
      first_name:    f.first_name,
      last_name:     f.last_name,
      middle_name:   f.middle_name || '',
      email:         f.user?.email || '',
      department_id: f.department_id?.toString() || '',
      position:      f.position,
      program_id:    f.program_id?.toString() || '',
    });
    setShowModal(true);
  };

  const openEditFromView = () => {
    if (viewingFaculty) {
      navigate(`/${getBasePath()}/faculty-accounts`);
      openEditModal(viewingFaculty);
    }
  };

  const confirmArchive = (f) => {
    setArchivingFaculty(f);
    setShowArchiveModal(true);
  };

  /* ===========================
     SAVE
  =========================== */

  const saveFaculty = async () => {
    const errors = {};
    if (!form.first_name)    errors.first_name    = 'Required';
    if (!form.last_name)     errors.last_name     = 'Required';
    if (!form.email)         errors.email         = 'Required';
    if (!form.department_id) errors.department_id = 'Required';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSaving(true);
    try {
      const res = editingFaculty
        ? await facultyService.update(editingFaculty.id, form)
        : await facultyService.create(form);

      if (res.ok) {
        showToast('success', res.message || (editingFaculty ? 'Faculty updated.' : 'Faculty created.'));
        setShowModal(false);
        // Update cache directly
        queryClient.setQueryData(['faculty'], (old = []) => {
          if (editingFaculty) return old.map(f => f.id === res.data.id ? res.data : f);
          return [...old, res.data];
        });
      } else {
        const firstError = res.errors ? Object.values(res.errors)[0]?.[0] : null;
        showToast('error', firstError || res.message || 'Failed to save faculty.');
      }
    } catch {
      showToast('error', 'Failed to save faculty.');
    } finally {
      setSaving(false);
    }
  };

  /* ===========================
     ARCHIVE
  =========================== */

  const archiveFaculty = async () => {
    if (!archivingFaculty) return;
    try {
      const res = await facultyService.delete(archivingFaculty.id);
      if (res.ok) {
        showToast('success', 'Faculty archived successfully.');
        setShowArchiveModal(false);
        // Remove from cache directly
        queryClient.setQueryData(['faculty'], (old = []) =>
          old.filter(f => f.id !== archivingFaculty.id)
        );
        if (viewingFaculty?.id === archivingFaculty.id) closeViewModal();
      } else {
        showToast('error', res.message || 'Failed to archive faculty.');
      }
    } catch {
      showToast('error', 'Failed to archive faculty.');
    }
  };

  /* ===========================
     RESEND SETUP EMAIL
  =========================== */

  const resendSetup = async (f) => {
    const count = getResendCount(f.id);
    if (count >= 3) return;
    try {
      const res = await facultyService.resendSetup(f.id);
      if (res.ok) {
        setResendCounts(prev => ({ ...prev, [f.id]: count + 1 }));
        showToast('success', `Setup email resent to ${f.user?.email}. (${count + 1}/3)`);
      } else {
        showToast('error', res.message || 'Failed to resend setup email.');
      }
    } catch {
      showToast('error', 'Failed to resend setup email.');
    }
  };

  /* ===========================
     CSV IMPORT
  =========================== */

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingImport(true);
    try {
      const res = await facultyService.importFromCSV(file);
      if (res.success) {
        showToast('success', `${res.data?.imported ?? 0} faculty members imported.`);
        queryClient.invalidateQueries({ queryKey: ['faculty'] });
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

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ['faculty'] });

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
          <h2 className={styles['page-title']}>Faculty Management</h2>
          <p className={styles['page-sub']}>View and manage faculty accounts, departments, and teaching loads.</p>
        </div>
        {isSecretary && (
          <div className={styles['header-actions']}>
            <button className={styles['ghost-btn']} onClick={() => document.getElementById('facultyCsvInput')?.click()} disabled={loadingImport}>
              {loadingImport
                ? <svg className={styles['spinner-sm']} viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5"/></svg>
                : <svg viewBox="0 0 18 18" fill="none"><path d="M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1M9 2v9M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
              {loadingImport ? 'Importing...' : 'Import CSV'}
            </button>
            <input id="facultyCsvInput" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
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
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles['filter-group']}>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
          </select>
          <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
            <option value="">All Positions</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
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
        {isLoading && (
          <div className={styles['loading-overlay']}>
            <div className={styles['spinner-lg']}></div>
            <p>Fetching faculty...</p>
          </div>
        )}
        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
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
              {paginatedFaculty.map(f => {
                const status   = f.user?.status || 'pending';
                const email    = f.user?.email || '—';
                const deptName = f.department?.department_name || '—';
                const load     = calculateLoad(f);
                const color    = getColor(f.id);
                return (
                  <tr key={f.id} onClick={() => viewDetails(f)} className={styles['clickable-row']}>
                    <td>
                      <div className={styles['student-cell']}>
                        <div className={styles['s-avatar']} style={{ background: color }}>{f.first_name.charAt(0)}</div>
                        <div>
                          <p className={styles['s-name']}>
                            {f.title && <span className={styles['title-label']}>{f.title} </span>}
                            {f.last_name}, {f.first_name} {f.middle_name || ''}
                          </p>
                          <p className={styles['s-sub']}>{email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{deptName}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={styles['program-badge-table']}>{f.position}</span>
                        {f.position === 'Department Chair' && f.program && (
                          <span className={styles['chair-program-badge']}>{f.program.program_code}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles['units-breakdown']}>
                        <span className={styles['total-units-badge']}>{load} hrs</span>
                        <div className={styles['wl-bar-sm']}><div className={styles['wl-fill-sm']} style={{ width: Math.min(load / 50 * 100, 100) + '%' }}></div></div>
                      </div>
                    </td>
                    <td>
                      <span className={cx('status-badge', status === 'active' ? 'st-active' : 'st-pending')}>
                        {status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    {(isSecretary || isDeanOrChair) && (
                      <td onClick={e => e.stopPropagation()}>
                        <div className={styles['action-btns']}>
                          {isDean && (
                            <button className={cx('action-btn', 'edit')} onClick={() => openEditModal(f)} title="Edit position / program">
                              <svg viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          {status === 'pending' && isSecretary && (
                            <button className={cx('action-btn', 'resend')} onClick={() => resendSetup(f)} title="Resend setup email">
                              <svg viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          <button className={cx('action-btn', 'delete')} onClick={() => confirmArchive(f)} title="Archive">
                            <svg viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {paginatedFaculty.length === 0 && !isLoading && (
                <tr><td colSpan={isSecretary || isDeanOrChair ? 6 : 5} className={styles['empty-row']}>No faculty members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredFaculty.length > pageSize && (
          <div className={styles['pagination-bar']}>
            <div className={styles['pagination-info']}>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredFaculty.length)}</strong> of <strong>{filteredFaculty.length}</strong> members
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
      {viewingFaculty && (() => {
        const status   = viewingFaculty.user?.status || 'pending';
        const email    = viewingFaculty.user?.email || '—';
        const deptName = viewingFaculty.department?.department_name || '—';
        const load     = calculateLoad(viewingFaculty);
        const color    = getColor(viewingFaculty.id);
        return (
          <div className={styles['modal-overlay']} onClick={closeViewModal}>
            <div className={cx('modal', 'modal-lg')} onClick={e => e.stopPropagation()}>
              <div className={styles['modal-header']}>
                <div className={styles['modal-student-meta']}>
                  <div className={cx('s-avatar', 'lg')} style={{ background: color }}>{viewingFaculty.first_name.charAt(0)}</div>
                  <div>
                    <h3>
                      {viewingFaculty.title && <span className={styles['title-label']}>{viewingFaculty.title} </span>}
                      {viewingFaculty.last_name}, {viewingFaculty.first_name} {viewingFaculty.middle_name || ''}
                    </h3>
                    <p className={styles['modal-sub']}>{viewingFaculty.position} · {deptName}</p>
                  </div>
                </div>
                <button className={styles['close-btn']} onClick={closeViewModal}>×</button>
              </div>

              <div className={cx('modal-body', 'profile-body')}>
                <div className={styles['profile-section']}>
                  <h4 className={styles['section-title']}>Personal Information</h4>
                  <div className={styles['detail-rows']}>
                    {viewingFaculty.title && <div className={styles['detail-row']}><span className={styles['detail-key']}>Title</span><span className={styles['detail-val']}>{viewingFaculty.title}</span></div>}
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Full Name</span><span className={styles['detail-val']}>{viewingFaculty.last_name}, {viewingFaculty.first_name} {viewingFaculty.middle_name || ''}</span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Email Address</span><span className={styles['detail-val']}>{email}</span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Position</span><span className={styles['detail-val']}><span className={styles['code-badge']}>{viewingFaculty.position}</span></span></div>
                  </div>
                </div>

                <div className={styles['profile-section']}>
                  <h4 className={styles['section-title']}>Employment Information</h4>
                  <div className={styles['detail-rows']}>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Department</span><span className={styles['detail-val']}>{deptName}</span></div>
                    {viewingFaculty.position === 'Department Chair' && (
                      <div className={styles['detail-row']}>
                        <span className={styles['detail-key']}>Program</span>
                        <span className={styles['detail-val']}>
                          {viewingFaculty.program
                            ? <span className={styles['chair-program-badge']}>{viewingFaculty.program.program_code}</span>
                            : <span style={{ color: '#b89f90', fontStyle: 'italic' }}>Not assigned</span>}
                        </span>
                      </div>
                    )}
                    <div className={styles['detail-row']}>
                      <span className={styles['detail-key']}>Workload</span>
                      <span className={styles['detail-val']}>
                        <div className={styles['units-breakdown']} style={{ justifyContent: 'flex-end' }}>
                          <span className={styles['total-units-badge']}>{load} hrs</span>
                          <div className={styles['wl-bar-sm']} style={{ width: '60px' }}><div className={styles['wl-fill-sm']} style={{ width: Math.min(load / 50 * 100, 100) + '%' }}></div></div>
                        </div>
                      </span>
                    </div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Status</span><span className={styles['detail-val']}><span className={cx('status-badge', status === 'active' ? 'st-active' : 'st-pending')}>{status.toUpperCase()}</span></span></div>
                    <div className={styles['detail-row']}><span className={styles['detail-key']}>Date Joined</span><span className={styles['detail-val']}>{new Date(viewingFaculty.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                  </div>
                </div>

                <div className={styles['profile-section']}>
                  <h4 className={styles['section-title']}>Expertise</h4>
                  <div className={styles['detail-rows']}>
                    {viewingFaculty.expertise?.length > 0
                      ? viewingFaculty.expertise.map(e => <div key={e.id} className={styles['detail-row']}><span className={styles['detail-val']}>{e.expertise_name}</span></div>)
                      : <div className={styles['detail-row']}><span className={styles['detail-val']} style={{ color: '#b89f90', fontStyle: 'italic' }}>No expertise recorded.</span></div>
                    }
                  </div>
                </div>

                {status === 'pending' && isSecretary && (
                  <div className={styles['resend-row']}>
                    <div className={styles['resend-info']}>
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4l6 4 6-4M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      <span>Setup email <strong>resent {getResendCount(viewingFaculty.id)}/3 times</strong></span>
                    </div>
                    <button className={styles['resend-btn']} onClick={() => resendSetup(viewingFaculty)} disabled={getResendCount(viewingFaculty.id) >= 3}>
                      {getResendCount(viewingFaculty.id) >= 3 ? 'Limit Reached' : 'Resend Email'}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles['modal-footer']}>
                <button className={styles['ghost-btn']} onClick={closeViewModal}>Close</button>
                {isDean && (
                  <button className={styles['ghost-btn']} onClick={openEditFromView}>
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Edit Account
                  </button>
                )}
                {(isSecretary || isDeanOrChair) && (
                  <button className={styles['danger-btn']} onClick={() => confirmArchive(viewingFaculty)}>
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Archive Account
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CREATE / EDIT MODAL */}
      {(isSecretary || isDean) && showModal && (
        <div className={styles['modal-overlay']} onClick={() => !saving && setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>{editingFaculty ? 'Edit Faculty Account' : 'Create Faculty Account'}</h3>
              <button className={styles['close-btn']} onClick={() => setShowModal(false)} disabled={saving}>×</button>
            </div>
            <div className={styles['modal-body']}>
              <div className={styles['form-grid']}>
                <div className={styles['form-group']}>
                  <label>Title (Optional)</label>
                  <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Dr., Engr., Ms." disabled={saving} />
                </div>
                <div className={styles['form-group']}>
                  <label>First Name <span className={styles.req}>*</span></label>
                  <input value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} placeholder="First name" disabled={!!editingFaculty || saving} className={formErrors.first_name ? styles['error-input'] : ''} />
                  {formErrors.first_name && <span className={styles['field-error']}>{formErrors.first_name}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Last Name <span className={styles.req}>*</span></label>
                  <input value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} placeholder="Last name" disabled={!!editingFaculty || saving} className={formErrors.last_name ? styles['error-input'] : ''} />
                  {formErrors.last_name && <span className={styles['field-error']}>{formErrors.last_name}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Middle Name</label>
                  <input value={form.middle_name} onChange={e => setForm(p => ({...p, middle_name: e.target.value}))} placeholder="Middle name" disabled={!!editingFaculty || saving} />
                </div>
                <div className={cx('form-group', 'full-span')}>
                  <label>Email Address <span className={styles.req}>*</span></label>
                  <input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} type="email" placeholder="faculty@school.edu.ph" disabled={!!editingFaculty || saving} className={formErrors.email ? styles['error-input'] : ''} />
                  {formErrors.email && <span className={styles['field-error']}>{formErrors.email}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Department <span className={styles.req}>*</span></label>
                  <select value={form.department_id} onChange={e => setForm(p => ({...p, department_id: e.target.value}))} disabled={saving} className={formErrors.department_id ? styles['error-input'] : ''}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                  {formErrors.department_id && <span className={styles['field-error']}>{formErrors.department_id}</span>}
                </div>
                <div className={styles['form-group']}>
                  <label>Position <span className={styles.req}>*</span></label>
                  <select value={form.position} onChange={e => setForm(p => ({...p, position: e.target.value}))} disabled={saving}>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {isDeanOrChair && form.position === 'Department Chair' && (
                  <div className={styles['form-group']}>
                    <label>Assigned Program</label>
                    <select value={form.program_id} onChange={e => setForm(p => ({...p, program_id: e.target.value}))} disabled={saving}>
                      <option value="">No specific program</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.program_code} — {p.program_name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {!editingFaculty && (
                <div className={styles['modal-notice']}>
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  A password setup link will be sent to the faculty's email after account creation.
                </div>
              )}
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['ghost-btn']} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className={styles['primary-btn']} onClick={saveFaculty} disabled={saving}>
                {saving && <span className={styles['spinner-sm']}></span>}
                {saving ? 'Saving...' : editingFaculty ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {(isSecretary || isDeanOrChair) && showArchiveModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowArchiveModal(false)}>
          <div className={cx('modal', 'modal-sm')} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>Archive Faculty Account</h3>
              <button className={styles['close-btn']} onClick={() => setShowArchiveModal(false)}>×</button>
            </div>
            <div className={styles['modal-body']}>
              <p className={styles['delete-msg']}>
                Are you sure you want to archive the account of
                <strong> {archivingFaculty?.last_name}, {archivingFaculty?.first_name} {archivingFaculty?.middle_name || ''}</strong>?
                The account will be moved to the archive and can be recovered by the Dean.
              </p>
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['ghost-btn']} onClick={() => setShowArchiveModal(false)}>Cancel</button>
              <button className={styles['danger-btn']} onClick={archiveFaculty}>Archive Account</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
