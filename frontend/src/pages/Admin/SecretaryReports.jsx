import { useState } from 'react'
import '../../styles/Admin/SecretaryReports.css'

const REPORT_TYPES = [
  { id: 'students',    title: 'Student Enrollment Report',    desc: 'Complete list of enrolled students with academic details',        color: '#FF6B1A', icon: '<path d="M10 9a3 3 0 100-6 3 3 0 000 6zM2 17a8 8 0 0116 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
  { id: 'faculty',     title: 'Faculty Workload Report',      desc: 'Faculty subject loads, schedules, and student counts',            color: '#3b82f6', icon: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 6h8M5 9h6M5 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
  { id: 'performance', title: 'Academic Performance Report',  desc: "GWA averages, Dean's list, and performance trends",              color: '#8b5cf6', icon: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' },
  { id: 'violations',  title: 'Violations Summary Report',    desc: 'Active and resolved student disciplinary cases',                  color: '#ef4444', icon: '<path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
  { id: 'awards',      title: 'Awards & Recognition Report',  desc: 'List of approved student awards and recognitions',               color: '#f59e0b', icon: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' },
  { id: 'department',  title: 'Department Overview Report',   desc: 'Comprehensive summary of all department statistics',             color: '#10b981', icon: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1M6 13v-3a1 1 0 011-1h4a1 1 0 011-1v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
]

const SecretaryReports = () => {
  const [selectedReport, setSelectedReport] = useState(null)
  const [generating,     setGenerating]     = useState(false)
  const [recentReports,  setRecentReports]  = useState([])
  const [reportConfig,   setReportConfig]   = useState({
    academicYear: '2026-2027',
    semester:     '2nd',
    course:       'all',
    format:       'pdf',
  })

  const handleConfigChange = (field, value) => {
    setReportConfig((prev) => ({ ...prev, [field]: value }))
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      await new Promise((r) => setTimeout(r, 1500))
      // await fetch('/secretary/reports/generate', { method: 'POST', body: JSON.stringify({ type: selectedReport.id, ...reportConfig }) })
      const newReport = {
        id:     Date.now(),
        title:  `${selectedReport.title} — ${reportConfig.semester} Sem ${reportConfig.academicYear}`,
        date:   new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        format: reportConfig.format,
        size:   '—',
        type:   selectedReport.title.split(' ')[0],
        color:  selectedReport.color,
      }
      setRecentReports((prev) => [newReport, ...prev])
      alert(`${selectedReport.title} generated successfully! Backend integration pending.`)
      setSelectedReport(null)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Generate Reports</h2>
          <p className="page-sub">Generate and export department-wide reports.</p>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="reports-grid">
        {REPORT_TYPES.map((report) => (
          <div
            key={report.id}
            className={`report-card${selectedReport?.id === report.id ? ' selected' : ''}`}
            onClick={() => setSelectedReport(report)}
          >
            <div className="report-icon" style={{ background: report.color + '18', color: report.color }}>
              <svg viewBox="0 0 20 20" fill="none" dangerouslySetInnerHTML={{ __html: report.icon }} />
            </div>
            <div className="report-info">
              <p className="report-title">{report.title}</p>
              <p className="report-desc">{report.desc}</p>
            </div>
            <div className="report-select">
              {selectedReport?.id === report.id ? (
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" fill="#FF6B1A" />
                  <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#f0e8e0" strokeWidth="1.5" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Options */}
      {selectedReport && (
        <div className="report-options-card">
          <div className="roc-header">
            <h3>Configure Report: {selectedReport.title}</h3>
          </div>
          <div className="roc-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Academic Year</label>
                <select value={reportConfig.academicYear} onChange={(e) => handleConfigChange('academicYear', e.target.value)}>
                  <option value="2026-2027">2026–2027</option>
                  <option value="2025-2026">2025–2026</option>
                  <option value="2024-2025">2024–2025</option>
                </select>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select value={reportConfig.semester} onChange={(e) => handleConfigChange('semester', e.target.value)}>
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="both">Both Semesters</option>
                </select>
              </div>
              {(selectedReport.id === 'students' || selectedReport.id === 'performance') && (
                <div className="form-group">
                  <label>Program</label>
                  <select value={reportConfig.course} onChange={(e) => handleConfigChange('course', e.target.value)}>
                    <option value="all">All Programs</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSIT">BSIT</option>
                    <option value="BSIS">BSIS</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Export Format</label>
                <select value={reportConfig.format} onChange={(e) => handleConfigChange('format', e.target.value)}>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div className="roc-actions">
              <button className="ghost-btn" onClick={() => setSelectedReport(null)}>Cancel</button>
              <button className="primary-btn" onClick={generateReport} disabled={generating}>
                {generating ? (
                  <span className="spinner-sm"></span>
                ) : (
                  <svg viewBox="0 0 18 18" fill="none">
                    <path d="M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1M9 10V2M6 7l3 3 3-3"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {generating ? 'Generating...' : 'Generate & Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="section-title-row">
        <h3 className="section-title">Recent Reports</h3>
      </div>
      <div className="recent-reports">
        {recentReports.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 40, height: 40 }}>
              <path d="M12 4h16l10 10v30a2 2 0 01-2 2H12a2 2 0 01-2-2V6a2 2 0 012-2z"
                stroke="#f0e8e0" strokeWidth="2" />
              <path d="M28 4v10h10M16 20h16M16 28h10" stroke="#f0e8e0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p>No reports generated yet.</p>
          </div>
        ) : (
          recentReports.map((r) => (
            <div className="recent-report-row" key={r.id}>
              <div className="rr-icon" style={{ background: r.color + '18', color: r.color }}>
                <svg viewBox="0 0 18 18" fill="none">
                  <path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                    stroke="currentColor" strokeWidth="1.4" />
                  <path d="M11 2v4h4M5 8h8M5 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="rr-info">
                <p className="rr-title">{r.title}</p>
                <p className="rr-meta">{r.date} · {r.format.toUpperCase()} · {r.size}</p>
              </div>
              <span className="rr-badge" style={{ background: r.color + '18', color: r.color }}>{r.type}</span>
              <button className="download-btn">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M4 12v1a1 1 0 001 1h6a1 1 0 001-1v-1M8 9V3M5 7l3 2 3-2"
                    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SecretaryReports