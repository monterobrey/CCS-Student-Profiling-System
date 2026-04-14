import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facultyService } from '../../services';
import '../../styles/Faculty/FacultySubject.css';

/* ─── Dummy data (remove when backend is wired) ───────────────────── */
const DUMMY_SUBJECTS = [
  { id: 1, code: 'CS 201', name: 'Data Structures and Algorithms', color: '#FF6B1A', sections: ['CS201-A', 'CS201-B'], enrolled_count: 48 },
  { id: 2, code: 'CS 315', name: 'Operating Systems', color: '#E05A12', sections: ['CS315-A', 'CS315-B', 'CS315-C'], enrolled_count: 62 },
  { id: 3, code: 'CS 422', name: 'Software Engineering', color: '#C94E0E', sections: ['CS422-A'], enrolled_count: 33 },
  { id: 4, code: 'IT 211', name: 'Database Management Systems', color: '#A03D0A', sections: ['IT211-A', 'IT211-B'], enrolled_count: 45 },
  { id: 5, code: 'IT 301', name: 'Web Systems and Technologies', color: '#7A2E07', sections: ['IT301-A'], enrolled_count: 25 },
];

const FIRST_NAMES = ['Maria','Juan','Ana','Pedro','Carlo','Rosa','Miguel','Elena','Jose','Clara','Lena','Marco','Pia','Rico','Gab','Lea','Sam','Troy','Nina','Bea'];
const LAST_NAMES  = ['Santos','Reyes','Cruz','Garcia','Mendoza','Torres','Flores','Dela Cruz','Bautista','Gomez','Ramos','Aquino','Lopez','Hernandez','Villanueva','Castillo','Morales','Ramirez','Ocampo','Lim'];
const STATUSES    = ['Regular','Regular','Regular','Regular','Irregular'];
const AVATAR_COLORS = [
  { bg: '#FF6B1A18', text: '#c04600' },
  { bg: '#1D9E7518', text: '#0F6E56' },
  { bg: '#534AB718', text: '#3C3489' },
  { bg: '#D85A3018', text: '#993C1D' },
  { bg: '#378ADD18', text: '#185FA5' },
];
const CARD_COLORS = ['#FF6B1A', '#E05A12', '#C94E0E', '#A03D0A', '#7A2E07', '#1D9E75', '#378ADD', '#534AB7'];

function generateStudents(subject) {
  const rows = [];
  let n = 20181000 + subject.id * 100;
  const perSection = Math.floor(subject.enrolled_count / subject.sections.length);
  subject.sections.forEach((sec) => {
    for (let i = 0; i < perSection; i++) {
      const fn = FIRST_NAMES[(n * 3 + i) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(n * 7 + i * 2) % LAST_NAMES.length];
      rows.push({
        id:      `20${n + i}`,
        name:    `${fn} ${ln}`,
        section: sec,
        year:    ['1st', '2nd', '3rd', '4th'][(i + subject.id) % 4],
        status:  STATUSES[(n + i) % STATUSES.length],
      });
    }
    n += 50;
  });
  return rows;
}
/* ──────────────────────────────────────────────────────────────────── */

function getInitials(name) {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('');
}
function getAvatarColor(name) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function BookIcon({ color, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SearchIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UsersIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LayersIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */

const FacultySubjects = () => {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeSubject,  setActiveSubject]  = useState(null); // full subject object
  const [studentSearch,  setStudentSearch]  = useState('');

  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['faculty-subjects-overview'],
    queryFn: async () => {
      const res = await facultyService.getMyStudents();
      if (res?.ok) {
        return res.data ?? { subjects: [], students: [] };
      }
      throw new Error(res?.message || 'Unable to load faculty subjects.');
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const backendSubjects = data?.subjects ?? [];
  const backendStudents = data?.students ?? [];

  const normalizedStudents = useMemo(() => {
    if (!isError) {
      return backendStudents.map((student) => {
        const fullName = [student.first_name, student.middle_name, student.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        return {
          id: student.user?.student_number || `20${student.id}`,
          name: fullName || student.name || 'Unnamed Student',
          section: student.section?.section_name || student.section_name || student.section || '',
          year: student.year_level || student.year || 'N/A',
          status: student.status || 'Regular',
        };
      });
    }

    return DUMMY_SUBJECTS.flatMap((subject) => generateStudents(subject));
  }, [backendStudents, isError]);

  /* ── Open roster ── */
  const openRoster = (card) => {
    setActiveSubject(card);
    setStudentSearch('');
  };

  const closeRoster = () => {
    setActiveSubject(null);
    setStudentSearch('');
  };

  /* ── Derived values ── */
  const subjectCards = useMemo(() => {
    if (!isError) {
      return backendSubjects.map((subject, idx) => {
        const sectionName = subject.section_name || 'Unassigned';
        const enrolledCount = normalizedStudents.filter((st) => st.section === sectionName).length;
        const color = CARD_COLORS[idx % CARD_COLORS.length];
        return {
          key: `${subject.id}-${sectionName}-${idx}`,
          subjectId: subject.id,
          code: subject.code,
          name: subject.name,
          color,
          sectionName,
          sectionCount: 1,
          enrolled_count: enrolledCount,
        };
      });
    }

    return DUMMY_SUBJECTS.flatMap((subject, idx) => {
      const sectionList = subject.sections?.length ? subject.sections : ['Unassigned'];
      const perSectionCount = sectionList.length
        ? Math.round((subject.enrolled_count || 0) / sectionList.length)
        : 0;

      return sectionList.map((sectionName, sectionIdx) => ({
        key: `${subject.id}-${sectionName}-${sectionIdx}`,
        subjectId: subject.id,
        code: subject.code,
        name: subject.name,
        color: subject.color || CARD_COLORS[(idx + sectionIdx) % CARD_COLORS.length],
        sectionName,
        sectionCount: sectionList.length,
        enrolled_count: perSectionCount,
      }));
    });
  }, [backendSubjects, normalizedStudents, isError]);

  const totalLoad      = subjectCards.length;
  const activeSections = new Set(subjectCards.map((s) => s.sectionName)).size;
  const totalStudents  = normalizedStudents.length;

  const filteredSubjects = subjectCards.filter((s) =>
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sectionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRosterStudents = normalizedStudents.filter((st) => st.section === activeSubject?.sectionName);
  const filteredStudents = activeRosterStudents.filter((st) =>
    st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.id.includes(studentSearch)
  );

  /* ── Render ── */
  return (
    <div className="page faculty-subjects-page">
      <div className="subjects-container">
        {!activeSubject ? (
          <>
            {/* Header */}
            <div className="subjects-header">
              <div className="header-info">
                <h1 className="page-title">My Subjects</h1>
                <p className="page-subtitle">Manage your assigned courses and access student rosters.</p>
              </div>
              <div className="search-box">
                <SearchIcon size={16} />
                <input
                  type="text"
                  placeholder="Search course code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="subjects-summary">
              <div className="mini-card-outline accent-orange">
                <span className="mini-icon"><BookIcon color="#FF6B1A" size={14} /></span>
                <span className="mini-label">Total Load</span>
                <span className="mini-value">{totalLoad} Class{totalLoad !== 1 ? 'es' : ''}</span>
                <span className="mini-hint">Current semester</span>
              </div>
              <div className="mini-card-outline accent-amber">
                <span className="mini-icon"><LayersIcon size={14} /></span>
                <span className="mini-label">Active Sections</span>
                <span className="mini-value">{activeSections} Section{activeSections !== 1 ? 's' : ''}</span>
                <span className="mini-hint">Across all subjects</span>
              </div>
              <div className="mini-card-outline accent-green">
                <span className="mini-icon"><UsersIcon size={14} /></span>
                <span className="mini-label">Handled Students</span>
                <span className="mini-value">{totalStudents} Enrolled</span>
                <span className="mini-hint">Total headcount</span>
              </div>
            </div>

            {/* Grid label */}
            <p className="section-eyebrow">Assigned Subjects</p>

            {/* Grid */}
            <div className="subjects-grid">
              {isLoading ? (
                <div className="loading-subjects">
                  <span className="spinner" />
                  Loading subjects…
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="empty-subjects">
                  <div className="empty-icon-box">📚</div>
                  <h3>No subjects found</h3>
                  <p>Your assigned subjects for this semester will appear here once finalised by the department.</p>
                  <button className="refresh-btn" onClick={() => refetch()}>Refresh List</button>
                </div>
              ) : (
                filteredSubjects.map((subject) => (
                  <button
                    key={subject.key}
                    className="subject-card"
                    type="button"
                    onClick={() => openRoster(subject)}
                  >
                    {/* Card icon */}
                    <div className="subject-icon-wrap" style={{ background: subject.color + '22' }}>
                      <BookIcon color={subject.color} size={20} />
                    </div>

                    {/* Code + name */}
                    <div className="subject-body">
                      <div className="subject-code-row">
                        <span className="subject-code">{subject.code}</span>
                        <span className="section-badge" style={{ background: subject.color + '1A', color: subject.color }}>
                          {subject.sectionName}
                        </span>
                      </div>
                      <p className="subject-name">{subject.name}</p>
                    </div>

                    <hr className="card-rule" />

                    {/* Meta row */}
                    <div className="subject-meta-row">
                      <div className="meta-stat">
                        <span className="meta-num">{subject.enrolled_count || 0}</span>
                        <span className="meta-lbl">Students (est.)</span>
                      </div>
                      <div className="meta-stat">
                        <span className="meta-num">{subject.sectionCount || 0}</span>
                        <span className="meta-lbl">Subject Sections</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="roster-page">
            <div className="roster-page-header">
              <button className="roster-back-btn" type="button" onClick={closeRoster}>
                <ArrowLeftIcon size={14} />
                Back to My Subjects
              </button>
              <div className="roster-title-row">
                <div className="roster-icon" style={{ background: activeSubject.color + '22' }}>
                  <BookIcon color={activeSubject.color} size={16} />
                </div>
                <div>
                  <p className="roster-title">{activeSubject.code} — {activeSubject.name}</p>
                  <p className="roster-sub">
                    Section {activeSubject.sectionName} &nbsp;·&nbsp; {activeRosterStudents.length} students enrolled
                  </p>
                </div>
              </div>
            </div>

            {/* Panel search */}
            <div className="roster-search">
              <SearchIcon size={13} />
              <input
                type="text"
                placeholder="Search student name or ID…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="roster-table-wrap">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID Number</th>
                    <th>Section</th>
                    <th>Year</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="roster-empty">No students match your search.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => {
                      const av = getAvatarColor(st.name);
                      return (
                        <tr key={st.id}>
                          <td>
                            <div className="name-cell">
                              <span className="avatar" style={{ background: av.bg, color: av.text }}>
                                {getInitials(st.name)}
                              </span>
                              {st.name}
                            </div>
                          </td>
                          <td className="cell-muted">{st.id}</td>
                          <td><span className="section-tag">{st.section}</span></td>
                          <td className="cell-muted">{st.year} year</td>
                          <td>
                            <span className={`status-pill ${st.status === 'Regular' ? 'status-regular' : 'status-irregular'}`}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="roster-footer">
              Showing {filteredStudents.length} of {activeRosterStudents.length} student{activeRosterStudents.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultySubjects;