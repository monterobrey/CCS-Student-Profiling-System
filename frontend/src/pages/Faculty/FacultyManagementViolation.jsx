import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../../services';
import styles from '../../styles/Faculty/FacultyManagementViolation.module.css';

const VIOLATION_TYPES = [
  'Academic Dishonesty',
  'Disruptive Behavior',
  'Dress Code Violation',
  'Tardiness / Absences',
  'Physical Altercation',
  'Substance Abuse',
  'Other',
];

const EMPTY_FORM = {
  violationType: '',
  severity: '',
  location: '',
  incidentDate: '',
  incidentTime: '',
  description: '',
};

/* ─── Stat icons (clean SVG, no emoji) ── */
function IconFiled() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconMajor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconPending() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconResolved() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/* ─── Avatar colors — matches StudentManagement COLORS array ── */
const AVATAR_COLORS = ['#FF6B1A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const STATS_CONFIG = [
  { label: 'Filed by Me',     color: '#FF6B1A', iconBg: '#fff5ef', Icon: IconFiled    },
  { label: 'Major Cases',     color: '#ef4444', iconBg: '#fef2f2', Icon: IconMajor    },
  { label: 'Awaiting Action', color: '#f59e0b', iconBg: '#fffbeb', Icon: IconPending  },
  { label: 'Resolved',        color: '#10b981', iconBg: '#f0fdf4', Icon: IconResolved },
];

const FacultyViolationManager = () => {
  const cx = (...names) => names.filter(Boolean).map(n => styles[n]).filter(Boolean).join(' ');

  const location = useLocation();
  const navigate = useNavigate();
  const { id: urlId } = useParams();

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch,      setStudentSearch]      = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [search,     setSearch]     = useState('');
  const [sevFilter,  setSevFilter]  = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const studentDropdownRef  = useRef(null);
  const prefillConsumedRef  = useRef(false);
  const queryClient = useQueryClient();

  const violationsQuery = useQuery({
    queryKey: ['faculty-violations'],
    queryFn: async () => {
      const res  = await facultyService.getMyViolations();
      const rows = res?.ok ? (res.data || []) : [];
      return rows.map((item) => ({
        id:           item.id,
        studentName:  `${item.student?.last_name || ''}, ${item.student?.first_name || ''} ${item.student?.middle_name || ''}`.trim().replace(/^,\s*/, ''),
        studentId:    item.student?.user?.student_number || '—',
        section:      item.student?.section?.section_name || '—',
        violationType: item.violationType,
        severity:     item.severity,
        dateReported: item.dateReported,
        status:       item.status || 'Pending',
        actionTaken:  item.action_taken || '',
        actionTakenBy: item.action_by_user?.name || item.action_by_user?.email || '',
        description:  item.description,
        location:     item.location,
        incidentTime: item.incident_time,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const studentsQuery = useQuery({
    queryKey: ['faculty-handled-students'],
    queryFn: async () => {
      const res     = await facultyService.getMyStudents();
      const payload = res?.ok ? (res.data ?? {}) : {};
      return payload.students || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const violations = violationsQuery.data || [];
  const students   = studentsQuery.data  || [];

  useEffect(() => {
    if (prefillConsumedRef.current) return;
    const preselectStudentId = location.state?.preselectStudentId;
    if (!preselectStudentId || !students.length) return;
    const idNum = Number(preselectStudentId);
    if (!students.some((s) => Number(s.id) === idNum)) return;
    prefillConsumedRef.current = true;
    resetForm();
    setSelectedStudentIds([idNum]);
    setShowReportModal(true);
    setStudentDropdownOpen(false);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, students]);

  // Sync detail modal with URL :id param
  useEffect(() => {
    if (!violations.length) return;
    if (urlId) {
      const match = violations.find((v) => String(v.id) === String(urlId));
      setSelectedViolation(match ?? null);
    } else {
      setSelectedViolation(null);
    }
  }, [urlId, violations]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!studentDropdownRef.current?.contains(e.target)) setStudentDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filteredReports = useMemo(() =>
    violations.filter(v => {
      const s = search.toLowerCase();
      const matchSearch = !search ||
        v.violationType?.toLowerCase().includes(s) ||
        v.studentName?.toLowerCase().includes(s) ||
        v.section?.toLowerCase().includes(s);
      return matchSearch &&
        (!sevFilter  || v.severity    === sevFilter) &&
        (!dateFilter || v.dateReported === dateFilter);
    }),
    [violations, search, sevFilter, dateFilter]
  );

  const filteredStudentOptions = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => {
      const fullName = `${s.last_name || ''}, ${s.first_name || ''} ${s.middle_name || ''}`.toLowerCase();
      return fullName.includes(term) || (s.user?.student_number || '').toLowerCase().includes(term) || (s.section?.section_name || '').toLowerCase().includes(term);
    });
  }, [students, studentSearch]);

  const selectedStudents = useMemo(() => {
    const set = new Set(selectedStudentIds.map(Number));
    return students.filter((s) => set.has(s.id));
  }, [students, selectedStudentIds]);

  /* ── Stats values matching STATS_CONFIG order ── */
  const statsValues = useMemo(() => [
    violations.length,
    violations.filter(v => v.severity === 'Major').length,
    violations.filter(v => v.status   === 'Pending').length,
    violations.filter(v => v.status   === 'Resolved').length,
  ], [violations]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleStudent = (id) =>
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedStudentIds([]);
    setStudentSearch('');
    setStudentDropdownOpen(false);
  };

  const reportViolationMutation = useMutation({
    mutationFn: (payload) => facultyService.reportViolation(payload),
    onSuccess: async (res) => {
      if (!res?.ok) throw new Error(res?.message || 'Failed to submit violation report.');
      resetForm();
      setShowReportModal(false);
      await queryClient.invalidateQueries({ queryKey: ['faculty-violations'] });
    },
  });

  const handleSubmit = async () => {
    if (!selectedStudentIds.length || !form.violationType || !form.severity || !form.description) {
      alert('Please select students and fill in violation type, severity, and description.');
      return;
    }
    try {
      await reportViolationMutation.mutateAsync({
        student_ids:   selectedStudentIds,
        violationType: form.violationType,
        severity:      form.severity,
        description:   form.description,
        location:      form.location || null,
        dateReported:  form.incidentDate || null,
        incident_time: form.incidentTime || null,
      });
    } catch (error) {
      alert(error.message || 'Failed to submit violation report.');
    }
  };

  return (
    <div className={styles['faculty-violation-page']}>

      {/* ── Header ── */}
      <div className={styles['page-header']}>
        <div className={styles['header-text']}>
          <h2 className={styles.title}>Violation Management</h2>
          <p className={styles.subtitle}>Track and manage incident reports filed for your handled sections.</p>
        </div>
        <button className={styles['record-btn']} onClick={() => { resetForm(); setShowReportModal(true); }}>
          + Report Violation
        </button>
      </div>

      {/* ── Stats — exact mini-stat-card pattern ── */}
      <div className={styles['mini-stats']}>
        {STATS_CONFIG.map(({ label, color, iconBg, Icon }, idx) => (
          <div className={styles['mini-stat-card']} key={idx}>
            <div className={styles['mini-stat-border']} style={{ background: color }} />
            <div className={styles['mini-stat-content']}>
              <div className={styles['mini-stat-icon']} style={{ background: iconBg, color }}>
                <Icon />
              </div>
              <div className={styles['mini-stat-info']}>
                <span className={styles['mini-stat-value']} style={{ color }}>{statsValues[idx]}</span>
                <span className={styles['mini-stat-label']}>{label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className={styles['table-actions']}>
        <div className={styles['search-wrap']}>
          <svg viewBox="0 0 18 18" fill="none" width="15" height="15">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by student name, section, or violation type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={styles['filter-select']} value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          <option value="">All Severities</option>
          <option value="Major">Major</option>
          <option value="Moderate">Moderate</option>
          <option value="Minor">Minor</option>
        </select>
        <input
          type="date"
          className={styles['filter-select']}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          title="Filter by date filed"
        />
      </div>

      {/* ── Table ── */}
      <div className={styles['table-wrapper']}>
        {violationsQuery.isLoading ? (
          <div className={styles['table-loader']}>
            <div className={styles.spinner} />
            <p>Loading reports…</p>
          </div>
        ) : (
          <table className={styles['violation-table']}>
            <thead>
              <tr>
                <th>Student / Section</th>
                <th>Violation Type</th>
                <th>Severity</th>
                <th>Date Filed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const avatarColor = getAvatarColor(report.studentName);
                return (
                  <tr key={report.id} className={styles['row-hover']} onClick={() => navigate(`/faculty/violations/${report.id}`)}>
                    <td>
                      <div className={styles['student-profile']}>
                        <div className={styles.avatar} style={{ background: avatarColor }}>
                          {report.studentName?.charAt(0)}
                        </div>
                        <div className={styles.meta}>
                          <p className={styles.name}>{report.studentName}</p>
                          <p className={styles.section}>{report.section}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles['type-text']}>{report.violationType}</span></td>
                    <td>
                      <span className={cx('sev-tag', report.severity?.toLowerCase())}>
                        {report.severity}
                      </span>
                    </td>
                    <td className={styles['date-text']}>{report.dateReported}</td>
                    <td>
                      <span className={cx('status-pill', report.status?.toLowerCase())}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles['empty-msg']}>No filed violations match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Report Violation Modal (unchanged) ── */}
      {showReportModal && (
        <div className={styles['modal-backdrop']} onClick={() => { resetForm(); setShowReportModal(false); }}>
          <div className={cx('modal-box', 'modal-wide')} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>Report a Violation</h3>
              <button className={styles['close-x']} onClick={() => { resetForm(); setShowReportModal(false); }}>&times;</button>
            </div>
            <div className={styles['modal-content']}>
              <div className={styles['modal-section-label']}>Student Info</div>
              <div className={styles['modal-grid']}>
                <div className={cx('modal-field', 'full')} ref={studentDropdownRef}>
                  <label>Select Students</label>
                  <div className={styles['student-multi-select']}>
                    <div className={styles['student-multi-trigger']} onClick={() => setStudentDropdownOpen(prev => !prev)}>
                      {selectedStudentIds.length ? `${selectedStudentIds.length} student(s) selected` : 'Search and select students...'}
                    </div>
                    {studentDropdownOpen && (
                      <div className={styles['student-dropdown-panel']}>
                        <input type="text" className={styles['student-search-input']} value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name, student number, or section" />
                        <div className={styles['student-option-list']}>
                          {filteredStudentOptions.map((student) => {
                            const fullName = `${student.last_name || ''}, ${student.first_name || ''} ${student.middle_name || ''}`.trim().replace(/^,\s*/, '');
                            return (
                              <label key={student.id} className={styles['student-option-item']}>
                                <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                                <span>{fullName} - {student.user?.student_number || '—'} - {student.section?.section_name || 'No Section'}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {!!selectedStudents.length && (
                    <div className={styles['selected-students-preview']}>
                      {selectedStudents.map((student) => {
                        const fullName = `${student.last_name || ''}, ${student.first_name || ''}`.trim().replace(/^,\s*/, '');
                        return (
                          <span key={student.id} className={styles['selected-student-chip']}>
                            {fullName} ({student.section?.section_name || 'No Section'})
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles['modal-section-label']}>Incident Info</div>
              <div className={styles['modal-grid']}>
                <div className={styles['modal-field']}>
                  <label>Violation Type</label>
                  <select name="violationType" value={form.violationType} onChange={handleFormChange}>
                    <option value="">Select type…</option>
                    {VIOLATION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles['modal-field']}>
                  <label>Severity</label>
                  <select name="severity" value={form.severity} onChange={handleFormChange}>
                    <option value="">Select severity…</option>
                    <option>Minor</option>
                    <option>Moderate</option>
                    <option>Major</option>
                  </select>
                </div>
                <div className={styles['modal-field']}>
                  <label>Location</label>
                  <input name="location" value={form.location} onChange={handleFormChange} placeholder="e.g. Room 301, Library" />
                </div>
                <div className={styles['modal-field']}>
                  <label>Incident Date (Optional)</label>
                  <input type="date" name="incidentDate" value={form.incidentDate} onChange={handleFormChange} />
                </div>
                <div className={styles['modal-field']}>
                  <label>Incident Time (Optional)</label>
                  <input type="time" name="incidentTime" value={form.incidentTime} onChange={handleFormChange} />
                </div>
              </div>

              <div className={styles['modal-section-label']}>Description</div>
              <div className={styles['modal-grid']}>
                <div className={cx('modal-field', 'full')}>
                  <label>Detailed Description</label>
                  <textarea name="description" value={form.description} onChange={handleFormChange} rows={4} placeholder="Describe what happened in detail. Include witnesses, context, and any prior incidents if applicable." />
                </div>
              </div>
            </div>

            <div className={styles['modal-actions']}>
              <button className={styles['btn-cancel']} onClick={() => { resetForm(); setShowReportModal(false); }}>Cancel</button>
              <button className={styles['btn-submit']} onClick={handleSubmit} disabled={reportViolationMutation.isPending}>
                {reportViolationMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal (unchanged) ── */}
      {selectedViolation && (
        <div className={styles['modal-backdrop']} onClick={() => navigate('/faculty/violations')}>
          <div className={styles['modal-box']} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>Incident Report Details</h3>
              <button className={styles['close-x']} onClick={() => navigate('/faculty/violations')}>&times;</button>
            </div>
            <div className={styles['modal-content']}>
              <div className={styles['detail-grid']}>
                <div className={styles['detail-card']}>
                  <label>Subject Student</label>
                  <p>{selectedViolation.studentName}</p>
                  <span className={styles['detail-sub']}>{selectedViolation.studentId} · {selectedViolation.section}</span>
                </div>
                <div className={styles['detail-card']}>
                  <label>Violation Type</label>
                  <p>{selectedViolation.violationType}</p>
                </div>
                <div className={styles['detail-card']}>
                  <label>Severity</label>
                  <span className={cx('sev-tag', selectedViolation.severity?.toLowerCase())}>{selectedViolation.severity}</span>
                </div>
                <div className={styles['detail-card']}>
                  <label>Status</label>
                  <span className={cx('status-pill', selectedViolation.status?.toLowerCase())}>{selectedViolation.status}</span>
                </div>
                <div className={styles['detail-card']}>
                  <label>Date Filed</label>
                  <p>{selectedViolation.dateReported || '—'}</p>
                </div>
                <div className={styles['detail-card']}>
                  <label>Incident Time</label>
                  <p>{selectedViolation.incidentTime || '—'}</p>
                </div>
                <div className={styles['detail-card']}>
                  <label>Action Taken By</label>
                  <p>{selectedViolation.actionTakenBy || 'Not yet set'}</p>
                </div>
              </div>
              {selectedViolation.location && (
                <div className={styles['detail-group']}>
                  <label>Location:</label>
                  <p>{selectedViolation.location}</p>
                </div>
              )}
              <div className={styles['detail-group']}>
                <label>Action Taken:</label>
                <p className={styles['desc-box']}>{selectedViolation.actionTaken || 'No action taken yet.'}</p>
              </div>
              <div className={styles['detail-group']}>
                <label>Action Taken By:</label>
                <p>{selectedViolation.actionTakenBy || 'Not yet set'}</p>
              </div>
              <div className={styles['detail-group']}>
                <label>Incident Description:</label>
                <p className={styles['desc-box']}>{selectedViolation.description || 'No additional notes provided.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyViolationManager;