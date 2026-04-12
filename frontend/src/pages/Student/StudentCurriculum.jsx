import { useState, useEffect, useMemo } from 'react'
import '../../styles/Student/StudentCurriculum.css'

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const SEMESTERS   = ['1st Semester', '2nd Semester', 'Summer']
const STATUSES    = ['all', 'passed', 'enrolled', 'pending']

const STATUS_LABEL = {
  passed:   'Passed',
  enrolled: 'Enrolled',
  pending:  'Pending',
}

const StudentCurriculum = () => {
  const [curriculum,    setCurriculum]    = useState([])
  const [loading,       setLoading]       = useState(false)
  const [activeYear,    setActiveYear]    = useState('all')
  const [activeSem,     setActiveSem]     = useState('all')
  const [activeStatus,  setActiveStatus]  = useState('all')
  const [search,        setSearch]        = useState('')

  useEffect(() => {
    const fetchCurriculum = async () => {
      setLoading(true)
      try {
        const res  = await fetch('/student/curriculum')
        const data = await res.json()
        setCurriculum(data)
      } catch (err) {
        console.error('Failed to fetch curriculum:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCurriculum()
  }, [])

  // Filter subjects
  const filtered = useMemo(() => {
    return curriculum.filter((subj) => {
      const matchYear   = activeYear   === 'all' || subj.yearLevel  === activeYear
      const matchSem    = activeSem    === 'all' || subj.semester   === activeSem
      const matchStatus = activeStatus === 'all' || subj.status     === activeStatus
      const matchSearch = search === '' ||
        subj.code.toLowerCase().includes(search.toLowerCase()) ||
        subj.name.toLowerCase().includes(search.toLowerCase())
      return matchYear && matchSem && matchStatus && matchSearch
    })
  }, [curriculum, activeYear, activeSem, activeStatus, search])

  // Group by Year Level → Semester
  const grouped = useMemo(() => {
    const result = {}
    filtered.forEach((subj) => {
      if (!result[subj.yearLevel]) result[subj.yearLevel] = {}
      if (!result[subj.yearLevel][subj.semester]) result[subj.yearLevel][subj.semester] = []
      result[subj.yearLevel][subj.semester].push(subj)
    })
    return result
  }, [filtered])

  const totalUnits    = curriculum.length > 0 ? curriculum.reduce((a, s) => a + (s.units || 0), 0) : 0
  const passedUnits   = curriculum.filter((s) => s.status === 'passed').reduce((a, s) => a + (s.units || 0), 0)
  const enrolledCount = curriculum.filter((s) => s.status === 'enrolled').length
  const pendingCount  = curriculum.filter((s) => s.status === 'pending').length

  return (
    <div className="sc-page">

      {/* Header */}
      <div className="sc-header">
        <div>
          <h2 className="sc-title">My Curriculum</h2>
          <p className="sc-sub">Your program subjects grouped by year level and semester.</p>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="sc-mini-stats">
        <div className="sc-mini-stat">
          <span className="sc-ms-value" style={{ color: '#FF6B1A' }}>{totalUnits}</span>
          <span className="sc-ms-label">Total Units</span>
        </div>
        <div className="sc-mini-stat">
          <span className="sc-ms-value" style={{ color: '#16a34a' }}>{passedUnits}</span>
          <span className="sc-ms-label">Units Passed</span>
        </div>
        <div className="sc-mini-stat">
          <span className="sc-ms-value" style={{ color: '#3b82f6' }}>{enrolledCount}</span>
          <span className="sc-ms-label">Currently Enrolled</span>
        </div>
        <div className="sc-mini-stat">
          <span className="sc-ms-value" style={{ color: '#9a8070' }}>{pendingCount}</span>
          <span className="sc-ms-label">Pending</span>
        </div>
      </div>

      {/* Filters */}
      <div className="sc-filters">
        {/* Search */}
        <div className="sc-search-wrap">
          <svg viewBox="0 0 18 18" fill="none" className="sc-search-icon">
            <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="sc-search"
            placeholder="Search by code or subject name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Year Level Filter */}
        <div className="sc-filter-group">
          <button
            className={`sc-filter-btn${activeYear === 'all' ? ' active' : ''}`}
            onClick={() => setActiveYear('all')}
          >All Years</button>
          {YEAR_LEVELS.map((y) => (
            <button
              key={y}
              className={`sc-filter-btn${activeYear === y ? ' active' : ''}`}
              onClick={() => setActiveYear(y)}
            >{y}</button>
          ))}
        </div>

        {/* Semester Filter */}
        <div className="sc-filter-group">
          <button
            className={`sc-filter-btn${activeSem === 'all' ? ' active' : ''}`}
            onClick={() => setActiveSem('all')}
          >All Sems</button>
          {SEMESTERS.map((s) => (
            <button
              key={s}
              className={`sc-filter-btn${activeSem === s ? ' active' : ''}`}
              onClick={() => setActiveSem(s)}
            >{s}</button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="sc-filter-group">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`sc-filter-btn${activeStatus === s ? ' active' : ''}`}
              onClick={() => setActiveStatus(s)}
            >{s === 'all' ? 'All Status' : STATUS_LABEL[s]}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="sc-loading">
          <div className="sc-spinner"></div>
          <p>Loading your curriculum...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="sc-empty">
          <svg viewBox="0 0 48 48" fill="none" style={{ width: 44, height: 44 }}>
            <rect x="6" y="4" width="36" height="40" rx="3" stroke="#f0e8e0" strokeWidth="2" />
            <path d="M14 14h20M14 21h20M14 28h12" stroke="#f0e8e0" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>No subjects found.</p>
        </div>
      ) : (
        <div className="sc-content">
          {YEAR_LEVELS.filter((y) => grouped[y]).map((year) => (
            <div className="sc-year-block" key={year}>
              <div className="sc-year-label">{year}</div>
              {SEMESTERS.filter((s) => grouped[year]?.[s]).map((sem) => (
                <div className="sc-sem-block" key={sem}>
                  <div className="sc-sem-label">{sem}</div>

                  {/* Subject Table */}
                  <div className="sc-table-wrap">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Subject Name</th>
                          <th>Units</th>
                          <th>Pre-requisite</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped[year][sem].map((subj) => (
                          <tr key={subj.code}>
                            <td><span className="sc-code">{subj.code}</span></td>
                            <td className="sc-subj-name">{subj.name}</td>
                            <td className="sc-units">{subj.units}</td>
                            <td className="sc-prereq">{subj.prerequisite || '—'}</td>
                            <td>
                              <span className={`sc-status sc-status-${subj.status}`}>
                                {STATUS_LABEL[subj.status] || subj.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2" className="sc-total-label">Total Units</td>
                          <td className="sc-total-units">
                            {grouped[year][sem].reduce((a, s) => a + (s.units || 0), 0)}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentCurriculum