import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facultyService } from '../../services';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../styles/Faculty/FacultySubject.css';

/* ─── Icons ──────────────────────────────────────────────────────── */

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

function UsersIcon({ size = 22 }) {
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

function LayersIcon({ size = 22 }) {
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

/* ─── Helpers ────────────────────────────────────────────────────── */

const CARD_COLORS = ['#FF6B1A', '#E05A12', '#C94E0E', '#A03D0A', '#7A2E07', '#1D9E75', '#378ADD', '#534AB7'];
const AVATAR_COLORS = [
  { bg: '#FF6B1A18', text: '#c04600' },
  { bg: '#1D9E7518', text: '#0F6E56' },
  { bg: '#534AB718', text: '#3C3489' },
  { bg: '#D85A3018', text: '#993C1D' },
  { bg: '#378ADD18', text: '#185FA5' },
];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('');
}

function getAvatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function FacultySubjects() {
  const navigate = useNavigate();
  const [searchQuery,   setSearchQuery]   = useState('');
  const [activeSubject, setActiveSubject] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['faculty-students'],
    queryFn: async () => {
      const res = await facultyService.getMyStudents();
      return res.ok ? (res.data ?? { subjects: [], students: [] }) : { subjects: [], students: [] };
    },
  });

  const subjects  = data?.subjects  ?? [];
  const students  = data?.students  ?? [];

  /* ── Subject cards ── */
  const subjectCards = useMemo(() =>
    subjects.map((s, idx) => ({
      key:          `${s.id}-${s.section_id}`,
      subjectId:    s.id,
      code:         s.code,
      name:         s.name,
      sectionName:  s.section_name,
      color:        CARD_COLORS[idx % CARD_COLORS.length],
      enrolledCount: students.filter(st => st.section?.section_name === s.section_name).length,
    })),
    [subjects, students]
  );

  /* ── Stats ── */
  const totalLoad      = subjectCards.length;
  const activeSections = new Set(subjectCards.map(s => s.sectionName)).size;
  const totalStudents  = students.length;

  /* ── Mini stats config — matches StudentManagement pattern ── */
  const miniStats = [
    {
      label:   'Total Load',
      value:   `${totalLoad}`,
      sub:     `Class${totalLoad !== 1 ? 'es' : ''}`,
      hint:    'Current semester',
      color:   '#FF6B1A',
      iconBg:  '#fff5ef',
      icon: (
        <BookIcon color="#FF6B1A" size={22} />
      ),
    },
    {
      label:   'Active Sections',
      value:   `${activeSections}`,
      sub:     `Section${activeSections !== 1 ? 's' : ''}`,
      hint:    'Across all subjects',
      color:   '#f59e0b',
      iconBg:  '#fff9ed',
      icon: <LayersIcon size={22} />,
    },
    {
      label:   'Handled Students',
      value:   `${totalStudents}`,
      sub:     'Enrolled',
      hint:    'Total headcount',
      color:   '#1D9E75',
      iconBg:  '#eefaf5',
      icon: <UsersIcon size={22} />,
    },
  ];

  /* ── Filtered subject cards ── */
  const filteredSubjects = useMemo(() =>
    subjectCards.filter(s =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sectionName.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [subjectCards, searchQuery]
  );

  /* ── Roster for active subject ── */
  const rosterStudents = useMemo(() => {
    if (!activeSubject) return [];
    return students.filter(st => st.section?.section_name === activeSubject.sectionName);
  }, [students, activeSubject]);

  const filteredRoster = useMemo(() =>
    rosterStudents.filter(st => {
      const fullName = `${st.first_name} ${st.last_name}`.toLowerCase();
      const studNum  = st.user?.student_number ?? '';
      return (
        fullName.includes(studentSearch.toLowerCase()) ||
        studNum.includes(studentSearch)
      );
    }),
    [rosterStudents, studentSearch]
  );

  const openRoster  = (card) => { setActiveSubject(card); setStudentSearch(''); };
  const closeRoster = ()     => { setActiveSubject(null); setStudentSearch(''); };

  const reportViolationForStudent = (student) => {
    navigate('/faculty/violations', {
      state: {
        preselectStudentId: student?.id,
        source: 'faculty-subjects',
      },
    });
  };

  /* ── Render ── */
  return (
    <div className="page faculty-subjects-page">
      <div className="subjects-container">

        {!activeSubject ? (
          <>
            {/* ── Header ── */}
            <div className="subjects-header">
              <div className="header-info">
                <h1 className="page-title">My Subjects</h1>
                <p className="page-subtitle">Manage your assigned courses and access student rosters.</p>
              </div>
            </div>

            {/* ── Stats — same pattern as StudentManagement mini-stats ── */}
            <div className="mini-stats">
              {miniStats.map((s, idx) => (
                <div className="mini-stat-card" key={idx}>
                  <div className="mini-stat-border" style={{ background: s.color }} />
                  <div className="mini-stat-content">
                    <div className="mini-stat-icon" style={{ background: s.iconBg, color: s.color }}>
                      {s.icon}
                    </div>
                    <div className="mini-stat-info">
                      <span className="mini-stat-value" style={{ color: s.color }}>
                        {s.value}
                        <span className="mini-stat-sub"> {s.sub}</span>
                      </span>
                      <span className="mini-stat-label">{s.label}</span>
                      <span className="mini-stat-hint">{s.hint}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Toolbar: search (matches StudentManagement table-toolbar) ── */}
            <div className="table-toolbar">
              <div className="search-wrap">
                <SearchIcon size={15} />
                <input
                  type="text"
                  placeholder="Search course code, name, or section…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <p className="section-eyebrow">Assigned Subjects</p>

            {/* ── Grid ── */}
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
                filteredSubjects.map(subject => (
                  <button
                    key={subject.key}
                    className="subject-card"
                    type="button"
                    onClick={() => openRoster(subject)}
                  >
                    <div className="subject-icon-wrap" style={{ background: subject.color + '22' }}>
                      <BookIcon color={subject.color} size={20} />
                    </div>
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
                    <div className="subject-meta-row">
                      <div className="meta-stat">
                        <span className="meta-num">{subject.enrolledCount}</span>
                        <span className="meta-lbl">Students</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          /* ── Roster view ── */
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
                    Section {activeSubject.sectionName} · {rosterStudents.length} students enrolled
                  </p>
                </div>
              </div>
            </div>

            <div className="roster-search">
              <SearchIcon size={13} />
              <input
                type="text"
                placeholder="Search student name or ID…"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
            </div>

            <div className="roster-table-wrap">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID Number</th>
                    <th>Section</th>
                    <th>Year</th>
                    <th>Program</th>
                    <th>Violation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="roster-empty">No students match your search.</td>
                    </tr>
                  ) : (
                    filteredRoster.map(st => {
                      const fullName = `${st.first_name} ${st.last_name}`;
                      const av = getAvatarColor(fullName);
                      return (
                        <tr key={st.id}>
                          <td>
                            <div className="name-cell">
                              <span className="avatar" style={{ background: av.bg, color: av.text }}>
                                {getInitials(fullName)}
                              </span>
                              {fullName}
                            </div>
                          </td>
                          <td className="cell-muted">{st.user?.student_number ?? '—'}</td>
                          <td><span className="section-tag">{st.section?.section_name ?? '—'}</span></td>
                          <td className="cell-muted">{st.year_level ? `${st.year_level} Year` : '—'}</td>
                          <td className="cell-muted">{st.program?.program_code ?? '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="report-violation-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                reportViolationForStudent(st);
                              }}
                              title="Report a violation for this student"
                            >
                              Report
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="roster-footer">
              Showing {filteredRoster.length} of {rosterStudents.length} student{rosterStudents.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}