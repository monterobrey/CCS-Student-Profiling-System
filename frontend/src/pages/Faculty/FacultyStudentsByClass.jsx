import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facultyService } from '../../services';
import styles from '../../styles/Faculty/FacultyStudentsByClass.module.css';

const COLORS = ['#FF6B1A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function FacultyStudentsByClass() {
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faculty-my-students', search, filterProgram, filterSection, filterSubject],
    queryFn: async () => {
      const res = await facultyService.getMyStudents({
        search,
        program: filterProgram,
        section: filterSection,
        subject: filterSubject,
      });
      return res.ok ? (res.data ?? { students: [], subjects: [] }) : { students: [], subjects: [] };
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const students = data?.students ?? [];
  const subjects = data?.subjects ?? [];

  const subjectMapBySection = useMemo(() => {
    const map = {};
    subjects.forEach((subject) => {
      const key = subject.section_id;
      if (!map[key]) map[key] = [];
      if (!map[key].includes(subject.code)) map[key].push(subject.code);
    });
    return map;
  }, [subjects]);

  const programs = useMemo(
    () => [...new Set(students.map((student) => student.program?.program_code).filter(Boolean))].sort(),
    [students]
  );

  const sections = useMemo(
    () => [...new Set(subjects.map((subject) => subject.section_name).filter(Boolean))].sort(),
    [subjects]
  );

  const subjectOptions = useMemo(
    () => [...new Set(subjects.map((subject) => subject.code).filter(Boolean))].sort(),
    [subjects]
  );

  const stats = useMemo(() => [
    {
      label: 'Students Handled',
      value: students.length,
      sub: '',
      hint: '',
      color: '#FF6B1A',
      iconBg: '#fff5ef',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#FF6B1A" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" />
        </svg>
      ),
    },
    {
      label: 'Programs',
      value: programs.length,
      sub: '',
      hint: '',
      color: '#8b5cf6',
      iconBg: '#f3f0ff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
      ),
    },
    {
      label: 'Sections',
      value: sections.length,
      sub: '',
      hint: '',
      color: '#f59e0b',
      iconBg: '#fff9ed',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" />
        </svg>
      ),
    },
    {
      label: 'Subjects',
      value: subjectOptions.length,
      sub: '',
      hint: '',
      color: '#10b981',
      iconBg: '#eefaf5',
      icon: (
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#10b981" strokeWidth="1.4">
          <rect x="2" y="2" width="14" height="14" rx="2" />
          <path d="M5 6h8M5 9h6M5 12h4" strokeLinecap="round" />
        </svg>
      ),
    },
  ], [students.length, programs.length, sections.length, subjectOptions.length]);

  const getColor = (id) => COLORS[id % COLORS.length];
  const closeStudentModal = () => setSelectedStudent(null);
  const formatYearSection = (student) => {
    if (!student?.year_level || !student?.section?.section_name) return 'No Section';
    return `${student.year_level} - ${student.section.section_name}`;
  };

  const cx = (...names) => names.filter(Boolean).join(' ');

  return (
    <div className={`${styles.facultyPage} ${styles['faculty-students-page']}`}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>My Students</h2>
          <p className={styles.pageSub}>
            View students from sections and subjects currently assigned to you.
          </p>
        </div>
      </div>

      <div className={styles.miniStats}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.miniStatCard}>
            <div className={styles.miniStatBorder} style={{ background: stat.color }} />
            <div className={styles.miniStatContent}>
              <div className={styles.miniStatIcon} style={{ background: stat.iconBg }}>
                {stat.icon}
              </div>
              <div className={styles.miniStatInfo}>
                <span className={styles.miniStatValue} style={{ color: stat.color }}>
                  {stat.value}
                </span>
                <span className={styles.miniStatLabel}>{stat.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableToolbar}>
        <div className={styles.searchWrap}>
          <svg viewBox="0 0 18 18" fill="none"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input
            type="text"
            placeholder="Search by name, email, or student number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjectOptions.map((subjectCode) => (
              <option key={subjectCode} value={subjectCode}>{subjectCode}</option>
            ))}
          </select>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map((sectionName) => (
              <option key={sectionName} value={sectionName}>{sectionName}</option>
            ))}
          </select>
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
            <option value="">All Programs</option>
            {programs.map((programCode) => (
              <option key={programCode} value={programCode}>{programCode}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tableCard}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinnerLg}></div>
            <p>Fetching students...</p>
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>STUDENT NO.</th>
                <th>PROGRAM</th>
                <th>SECTION</th>
                <th>SUBJECTS</th>
                <th>GWA</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name ?? ''}`.trim();
                const email = student.user?.email || 'No email';
                const studentNumber = student.user?.student_number || '—';
                const programCode = student.program?.program_code || '—';
                const sectionName = student.section?.section_name || '—';
                const sectionSubjects = subjectMapBySection[student.section_id] || [];

                return (
                  <tr key={student.id} className={styles.clickableRow} onClick={() => setSelectedStudent(student)}>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.sAvatar} style={{ background: getColor(student.id) }}>
                          {(student.first_name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className={styles.sName}>{fullName}</p>
                          <p className={styles.sSub}>{email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={cx(styles.codeBadge, programCode === 'BSIT' && styles.badgeBsit)}>
                        {studentNumber}
                      </span>
                    </td>
                    <td>{programCode}</td>
                    <td>{sectionName}</td>
                    <td>{sectionSubjects.length ? sectionSubjects.join(', ') : '—'}</td>
                    <td>
                      <span className={cx(styles.gwaVal, student.gwa && student.gwa <= 1.75 ? styles.gwaGood : styles.gwaOk)}>
                        {student.gwa || 'N/A'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!students.length && !isLoading && (
                <tr>
                  <td colSpan={6} className={styles['empty-msg']}>No students found for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className={styles.modalOverlay} onClick={closeStudentModal}>
          <div className={cx(styles.modal, styles.modalLg)} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalStudentMeta}>
                <div className={cx(styles.sAvatar, styles.lg)} style={{ background: getColor(selectedStudent.id) }}>
                  {(selectedStudent.first_name || '?').charAt(0)}
                </div>
                <div>
                  <h3>
                    {selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name ?? ''}
                  </h3>
                  <p className={styles.modalSub}>
                    {selectedStudent.user?.student_number || '—'} · {selectedStudent.program?.program_code || '—'} · {formatYearSection(selectedStudent)}
                  </p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={closeStudentModal}>×</button>
            </div>

            <div className={cx(styles.modalBody, styles.profileBody)}>
              <div className={styles.profileSection}>
                <h4 className={styles.sectionTitle}>Personal Information</h4>
                <div className={styles.detailRows}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Full Name</span>
                    <span className={styles.detailVal}>
                      {selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name ?? ''}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Email Address</span>
                    <span className={styles.detailVal}>{selectedStudent.user?.email || 'No email'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Student Number</span>
                    <span className={styles.detailVal}>
                      <span className={styles.codeBadge}>{selectedStudent.user?.student_number || '—'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.profileSection}>
                <h4 className={styles.sectionTitle}>Academic Information</h4>
                <div className={styles.detailRows}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Program</span>
                    <span className={styles.detailVal}>{selectedStudent.program?.program_code || '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Year & Section</span>
                    <span className={styles.detailVal}>{formatYearSection(selectedStudent)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Subjects Handled</span>
                    <span className={styles.detailVal}>
                      {(subjectMapBySection[selectedStudent.section_id] || []).join(', ') || '—'}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>GWA</span>
                    <span className={styles.detailVal}>{selectedStudent.gwa || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.profileSection}>
                <h4 className={styles.sectionTitle}>Guardian Information</h4>
                {selectedStudent.guardian ? (
                  <div className={styles.detailRows}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Guardian Name</span>
                      <span className={styles.detailVal}>
                        {selectedStudent.guardian.first_name} {selectedStudent.guardian.last_name}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Relationship</span>
                      <span className={styles.detailVal}>{selectedStudent.guardian.relationship || '—'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Contact Number</span>
                      <span className={styles.detailVal}>{selectedStudent.guardian.contact_number || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.detailRows}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailVal} style={{ color: '#b89f90', fontStyle: 'italic' }}>
                        No guardian information provided.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostBtn} onClick={closeStudentModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}