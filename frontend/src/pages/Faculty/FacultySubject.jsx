import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Faculty/FacultySubject.css';

const FacultySubjects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/analytics/faculty');
      setSubjects(response.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const totalLoad = subjects.length;
  const activeSections = subjects.reduce((acc, subj) => acc + (subj.sections?.length || 0), 0);
  const totalStudents = subjects.reduce((acc, subj) => acc + (subj.enrolled_count || 0), 0);

  const stats = [
    { label: 'Total Load', value: totalLoad.toString(), color: 'orange', iconPath: <><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h8M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
    { label: 'Active Sections', value: activeSections.toString(), color: 'blue', iconPath: <><path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
    { label: 'Handled Students', value: totalStudents.toString(), color: 'green', iconPath: <><path d="M12 4.5c-3 0-5.5 2.5-5.5 5.5 0 2 1.5 3.5 3 4.5v3a1.5 1.5 0 001.5 1.5h3c.83 0 1.5-.67 1.5-1.5v-3c1.5-1 3-2.5 3-4.5 0-3-2.5-5.5-5.5-5.5z" stroke="currentColor" strokeWidth="1.4"/><path d="M8 12v3M16 12v3M12 8v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
  ];

  const filteredSubjects = subjects.filter(subject =>
    subject.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="faculty-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Subjects</h2>
          <p className="page-sub">Manage your assigned courses and access student rosters.</p>
        </div>
      </div>

      <div className="subject-stats">
        {stats.map((stat, idx) => (
          <div key={idx} className={`stat-card ${stat.color}`}>
            <div className={`stat-icon-wrapper ${stat.color}`}>
              <svg viewBox="0 0 18 18" fill="none">{stat.iconPath}</svg>
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
          <svg viewBox="0 0 18 18" fill="none">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search course code or name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-container">
          {isLoading ? (
            <div className="loading-overlay">
              <div className="spinner-lg"></div>
              <span>Loading subjects...</span>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="empty-row">
              <div className="empty-icon-box">📚</div>
              <p>No subjects found</p>
              <span>Your assigned subjects for this semester will appear here once finalized by the department.</span>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Sections</th>
                  <th>Students</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="clickable-row" onClick={() => navigate(`/faculty/subjects/${subject.id}`)}>
                    <td><span className="code-badge">{subject.code}</span></td>
                    <td className="s-name">{subject.name}</td>
                    <td>{subject.sections?.length || 0}</td>
                    <td>{subject.enrolled_count || 0}</td>
                    <td>
                      <button className="view-btn">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultySubjects;