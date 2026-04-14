import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facultyService } from '../../services';
import '../../styles/Faculty/FacultyStudentsByClass.css';

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
    { label: 'Students Handled', value: students.length, color: 'blue', iconPath: <><path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></> },
    { label: 'Programs', value: programs.length, color: 'purple', iconPath: <><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1M6 13v-3a1 1 0 011-1h4a1 1 0 011-1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
    { label: 'Sections', value: sections.length, color: 'orange', iconPath: <><path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></> },
    { label: 'Subjects', value: subjectOptions.length, color: 'green', iconPath: <><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h8M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
  ], [students.length, programs.length, sections.length, subjectOptions.length]);

  const getColor = (id) => COLORS[id % COLORS.length];
  const closeStudentModal = () => setSelectedStudent(null);
  const formatYearSection = (student) => {
    if (!student?.year_level || !student?.section?.section_name) return 'No Section';
    return `${student.year_level} - ${student.section.section_name}`;
  };

  return (
    <div className="faculty-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Students</h2>
          <p className="page-sub">
            View students from sections and subjects currently assigned to you.
          </p>
        </div>
      </div>

      <div className="student-stats">
        {stats.map((stat, idx) => (
          <div key={idx} className={`stat-card ${stat.color}`}>
            <div className={`stat-icon-wrapper ${stat.color}`}>
              <svg viewBox="0 0 20 20" fill="none">{stat.iconPath}</svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="table-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 18 18" fill="none"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input
            type="text"
            placeholder="Search by name, email, or student number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
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

      <div className="table-card">
        {isLoading && (
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
                  <tr key={student.id} className="clickable-row" onClick={() => setSelectedStudent(student)}>
                    <td>
                      <div className="student-cell">
                        <div className="s-avatar" style={{ background: getColor(student.id) }}>
                          {(student.first_name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="s-name">{fullName}</p>
                          <p className="s-sub">{email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`code-badge ${programCode === 'BSIT' ? 'badge-bsit' : ''}`}>{studentNumber}</span></td>
                    <td>{programCode}</td>
                    <td>{sectionName}</td>
                    <td>{sectionSubjects.length ? sectionSubjects.join(', ') : '—'}</td>
                    <td><span className={`gwa-val ${student.gwa && student.gwa <= 1.75 ? 'gwa-good' : 'gwa-ok'}`}>{student.gwa || 'N/A'}</span></td>
                  </tr>
                );
              })}
              {!students.length && !isLoading && (
                <tr>
                  <td colSpan={6} className="empty-row">No students found for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="modal-overlay" onClick={closeStudentModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-student-meta">
                <div className="s-avatar lg" style={{ background: getColor(selectedStudent.id) }}>
                  {(selectedStudent.first_name || '?').charAt(0)}
                </div>
                <div>
                  <h3>
                    {selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name ?? ''}
                  </h3>
                  <p className="modal-sub">
                    {selectedStudent.user?.student_number || '—'} · {selectedStudent.program?.program_code || '—'} · {formatYearSection(selectedStudent)}
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={closeStudentModal}>×</button>
            </div>

            <div className="modal-body profile-body">
              <div className="profile-section">
                <h4 className="section-title">Personal Information</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-key">Full Name</span>
                    <span className="detail-val">
                      {selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name ?? ''}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Email Address</span>
                    <span className="detail-val">{selectedStudent.user?.email || 'No email'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Student Number</span>
                    <span className="detail-val">
                      <span className="code-badge">{selectedStudent.user?.student_number || '—'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Academic Information</h4>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-key">Program</span>
                    <span className="detail-val">{selectedStudent.program?.program_code || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Year & Section</span>
                    <span className="detail-val">{formatYearSection(selectedStudent)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Subjects Handled</span>
                    <span className="detail-val">
                      {(subjectMapBySection[selectedStudent.section_id] || []).join(', ') || '—'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">GWA</span>
                    <span className="detail-val">{selectedStudent.gwa || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="section-title">Guardian Information</h4>
                {selectedStudent.guardian ? (
                  <div className="detail-rows">
                    <div className="detail-row">
                      <span className="detail-key">Guardian Name</span>
                      <span className="detail-val">
                        {selectedStudent.guardian.first_name} {selectedStudent.guardian.last_name}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Relationship</span>
                      <span className="detail-val">{selectedStudent.guardian.relationship || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Contact Number</span>
                      <span className="detail-val">{selectedStudent.guardian.contact_number || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="detail-rows">
                    <div className="detail-row">
                      <span className="detail-val" style={{ color: '#b89f90', fontStyle: 'italic' }}>
                        No guardian information provided.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="ghost-btn" onClick={closeStudentModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}