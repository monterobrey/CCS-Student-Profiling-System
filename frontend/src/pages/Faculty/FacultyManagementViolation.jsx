import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../../styles/Faculty/FacultyManagementViolation.css';

const FacultyViolationManager = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);

  const fetchFiledViolations = async () => {
    setLoading(true);
    try {
      // Endpoint for violations filed by this faculty member
      const res = await axios.get('/faculty/violations/filed');
      setViolations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch filed violations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return violations.filter(v => {
      const s = search.toLowerCase();
      return (
        !search ||
        v.violationType?.toLowerCase().includes(s) ||
        v.studentName?.toLowerCase().includes(s) ||
        v.section?.toLowerCase().includes(s)
      );
    });
  }, [violations, search]);

  const stats = useMemo(() => [
    { label: 'Filed by Me', value: violations.length, color: '#FF6B1A', icon: '📝' },
    { label: 'Major Cases', value: violations.filter(v => v.severity === 'Major').length, color: '#ef4444', icon: '🚫' },
    { label: 'Awaiting Action', value: violations.filter(v => v.status === 'Pending').length, color: '#f59e0b', icon: '⏳' },
    { label: 'Resolved', value: violations.filter(v => v.status === 'Resolved').length, color: '#3b82f6', icon: '✅' }
  ], [violations]);

  useEffect(() => {
    fetchFiledViolations();
  }, []);

  return (
    <div className="faculty-violation-page">
      <div className="page-header">
        <div className="header-text">
          <h2 className="title">Violation Management</h2>
          <p className="subtitle">Track and manage incident reports filed for your handled sections.</p>
        </div>
        <button className="record-btn" onClick={() => alert('Opening Recording Form...')}>
          + New Incident Report
        </button>
      </div>

      {/* Metric Cards */}
      <div className="stats-row">
        {stats.map((stat, i) => (
          <div key={i} className="mini-card" style={{ borderLeftColor: stat.color }}>
            <div className="card-icon">{stat.icon}</div>
            <div className="card-info">
              <span className="card-value">{stat.value}</span>
              <span className="card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="table-actions">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by student name, section, or violation type..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading reports...</p>
          </div>
        ) : (
          <table className="violation-table">
            <thead>
              <tr>
                <th>STUDENT / SECTION</th>
                <th>INCIDENT TYPE</th>
                <th>SEVERITY</th>
                <th>DATE FILED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="row-hover" onClick={() => setSelectedViolation(report)}>
                  <td>
                    <div className="student-profile">
                      <div className="avatar">{report.studentName?.charAt(0)}</div>
                      <div className="meta">
                        <p className="name">{report.studentName}</p>
                        <p className="section">{report.section}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="type-text">{report.violationType}</span></td>
                  <td>
                    <span className={`sev-tag ${report.severity?.toLowerCase()}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="date-text">{report.dateReported}</td>
                  <td>
                    <span className={`status-pill ${report.status?.toLowerCase()}`}>
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-msg">No filed violations match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {selectedViolation && (
        <div className="modal-backdrop" onClick={() => setSelectedViolation(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Incident Report Details</h3>
              <button className="close-x" onClick={() => setSelectedViolation(null)}>&times;</button>
            </div>
            <div className="modal-content">
              <div className="detail-group">
                <label>Complainant (Faculty):</label>
                <p>Professor Mateo Delos Reyes</p>
              </div>
              <div className="detail-group">
                <label>Subject Student:</label>
                <p>{selectedViolation.studentName} ({selectedViolation.section})</p>
              </div>
              <div className="detail-group">
                <label>Incident Description:</label>
                <p className="desc-box">{selectedViolation.description || 'No additional notes provided.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyViolationManager;