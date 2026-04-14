import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const FacultyViolationManager = () => {
  const cx = (...names) => names.filter(Boolean).map(n => styles[n]).filter(Boolean).join(' ');

  const location = useLocation();
  const navigate = useNavigate();

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const studentDropdownRef = useRef(null);
  const queryClient = useQueryClient();

  const prefillConsumedRef = useRef(false);

  const violationsQuery = useQuery({
    queryKey: ['faculty-violations'],
    queryFn: async () => {
      const res = await facultyService.getMyViolations();
      const rows = res?.ok ? (res.data || []) : [];
      return rows.map((item) => ({
        id: item.id,
        studentName: `${item.student?.last_name || ''}, ${item.student?.first_name || ''} ${item.student?.middle_name || ''}`.trim().replace(/^,\s*/, ''),
        studentId: item.student?.user?.student_number || '—',
        section: item.student?.section?.section_name || '—',
        violationType: item.violationType,
        severity: item.severity,
        dateReported: item.dateReported,
        status: item.status || 'Pending',
        actionTaken: item.action_taken || '',
        actionTakenBy: item.action_by_user?.name || item.action_by_user?.email || '',
        description: item.description,
        location: item.location,
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
      const res = await facultyService.getMyStudents();
      const payload = res?.ok ? (res.data ?? {}) : {};
      return payload.students || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const violations = violationsQuery.data || [];
  const students = studentsQuery.data || [];

  // If navigated from Subjects page, auto-open "Report Violation" and preselect student.
  useEffect(() => {
    if (prefillConsumedRef.current) return;
    const preselectStudentId = location.state?.preselectStudentId;
    if (!preselectStudentId) return;
    if (!students.length) return;

    const idNum = Number(preselectStudentId);
    const exists = students.some((s) => Number(s.id) === idNum);
    if (!exists) return;

    prefillConsumedRef.current = true;
    resetForm();
    setSelectedStudentIds([idNum]);
    setShowReportModal(true);
    setStudentDropdownOpen(false);

    // Clear navigation state so it doesn't re-trigger on refresh/back.
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, students]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!studentDropdownRef.current?.contains(event.target)) {
        setStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filteredReports = useMemo(() => {
    return violations.filter(v => {
      const s = search.toLowerCase();
      const matchSearch = !search ||
        v.violationType?.toLowerCase().includes(s) ||
        v.studentName?.toLowerCase().includes(s) ||
        v.section?.toLowerCase().includes(s);
      const matchSev = !sevFilter || v.severity === sevFilter;
      const matchDate = !dateFilter || v.dateReported === dateFilter;
      return matchSearch && matchSev && matchDate;
    });
  }, [violations, search, sevFilter, dateFilter]);

  const filteredStudentOptions = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => {
      const fullName = `${s.last_name || ''}, ${s.first_name || ''} ${s.middle_name || ''}`.toLowerCase();
      const studentNo = (s.user?.student_number || '').toLowerCase();
      const section = (s.section?.section_name || '').toLowerCase();
      return fullName.includes(term) || studentNo.includes(term) || section.includes(term);
    });
  }, [students, studentSearch]);

  const selectedStudents = useMemo(() => {
    const selectedSet = new Set(selectedStudentIds.map((id) => Number(id)));
    return students.filter((student) => selectedSet.has(student.id));
  }, [students, selectedStudentIds]);

  const stats = useMemo(() => [
    { label: 'Filed by Me',     value: violations.length,                                           color: 'orange', icon: '📝' },
    { label: 'Major Cases',     value: violations.filter(v => v.severity === 'Major').length,        color: 'red',    icon: '🚫' },
    { label: 'Awaiting Action', value: violations.filter(v => v.status === 'Pending').length,        color: 'amber',  icon: '⏳' },
    { label: 'Resolved',        value: violations.filter(v => v.status === 'Resolved').length,       color: 'blue',   icon: '✅' },
  ], [violations]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => (
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    ));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedStudentIds([]);
    setStudentSearch('');
    setStudentDropdownOpen(false);
  };

  const reportViolationMutation = useMutation({
    mutationFn: (payload) => facultyService.reportViolation(payload),
    onSuccess: async (res) => {
      if (!res?.ok) {
        throw new Error(res?.message || 'Failed to submit violation report.');
      }
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
      const payload = {
        student_ids: selectedStudentIds,
        violationType: form.violationType,
        severity: form.severity,
        description: form.description,
        location: form.location || null,
        dateReported: form.incidentDate || null,
        incident_time: form.incidentTime || null,
      };
      await reportViolationMutation.mutateAsync(payload);
    } catch (error) {
      alert(error.message || 'Failed to submit violation report.');
    }
  };

  return (
    <div className={styles['faculty-violation-page']}>

      {/* Header */}
      <div className={styles['page-header']}>
        <div className={styles['header-text']}>
          <h2 className={styles.title}>Violation Management</h2>
          <p className={styles.subtitle}>Track and manage incident reports filed for your handled sections.</p>
        </div>
        <button className={styles['record-btn']} onClick={() => { resetForm(); setShowReportModal(true); }}>
          + Report Violation
        </button>
      </div>

      {/* Stats Row */}
      <div className={styles['stats-row']}>
        {stats.map((stat, i) => (
          <div key={i} className={cx('mini-card', `accent-${stat.color}`)}>
            <div className={styles['card-icon']}>{stat.icon}</div>
            <div className={styles['card-info']}>
              <span className={styles['card-value']}>{stat.value}</span>
              <span className={styles['card-label']}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles['table-actions']}>
        <div className={styles['search-container']}>
          <span className={styles['search-icon']}>🔍</span>
          <input
            type="text"
            placeholder="Search by student name, section, or violation type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles['filter-select']}
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value)}
        >
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

      {/* Table */}
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
              {filteredReports.map((report) => (
                <tr key={report.id} className={styles['row-hover']} onClick={() => setSelectedViolation(report)}>
                  <td>
                    <div className={styles['student-profile']}>
                      <div className={styles.avatar}>{report.studentName?.charAt(0)}</div>
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
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles['empty-msg']}>No filed violations match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Report Violation Modal */}
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
                    <div
                      className={styles['student-multi-trigger']}
                      onClick={() => setStudentDropdownOpen((prev) => !prev)}
                    >
                      {selectedStudentIds.length
                        ? `${selectedStudentIds.length} student(s) selected`
                        : 'Search and select students...'}
                    </div>
                    {studentDropdownOpen && (
                      <div className={styles['student-dropdown-panel']}>
                        <input
                          type="text"
                          className={styles['student-search-input']}
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search by name, student number, or section"
                        />
                        <div className={styles['student-option-list']}>
                          {filteredStudentOptions.map((student) => {
                            const fullName = `${student.last_name || ''}, ${student.first_name || ''} ${student.middle_name || ''}`.trim().replace(/^,\s*/, '');
                            const isSelected = selectedStudentIds.includes(student.id);
                            return (
                              <label key={student.id} className={styles['student-option-item']}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleStudent(student.id)}
                                />
                                <span>
                                  {fullName} - {student.user?.student_number || '—'} - {student.section?.section_name || 'No Section'}
                                </span>
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
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="Describe what happened in detail. Include witnesses, context, and any prior incidents if applicable."
                  />
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

      {/* Detail Modal */}
      {selectedViolation && (
        <div className={styles['modal-backdrop']} onClick={() => setSelectedViolation(null)}>
          <div className={styles['modal-box']} onClick={e => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>Incident Report Details</h3>
              <button className={styles['close-x']} onClick={() => setSelectedViolation(null)}>&times;</button>
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
                  <span className={cx('sev-tag', selectedViolation.severity?.toLowerCase())}>
                    {selectedViolation.severity}
                  </span>
                </div>
                <div className={styles['detail-card']}>
                  <label>Status</label>
                  <span className={cx('status-pill', selectedViolation.status?.toLowerCase())}>
                    {selectedViolation.status}
                  </span>
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