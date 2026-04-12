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

  return (
    <div className="subjects-container">
      {/* Page Header */}
      <div className="subjects-header">
        <div className="header-info">
          <h1 className="page-title">My Subjects</h1>
          <p className="page-subtitle">Manage your assigned courses and access student rosters.</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search course code or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="subjects-summary">
        <div className="mini-card-outline">
          <span className="mini-label">TOTAL LOAD</span>
          <span className="mini-value">{totalLoad} Class{totalLoad !== 1 ? 'es' : ''}</span>
        </div>
        <div className="mini-card-outline">
          <span className="mini-label">ACTIVE SECTIONS</span>
          <span className="mini-value">{activeSections} Section{activeSections !== 1 ? 's' : ''}</span>
        </div>
        <div className="mini-card-outline">
          <span className="mini-label">HANDLED STUDENTS</span>
          <span className="mini-value">{totalStudents} Enrolled</span>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="subjects-grid">
        {isLoading ? (
          <div className="loading-subjects">
            <span className="spinner"></span>
            Loading subjects...
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty-subjects">
            <div className="empty-icon-box">📚</div>
            <h3>No subjects found</h3>
            <p>Your assigned subjects for this semester will appear here once finalized by the department.</p>
            <button className="refresh-btn" onClick={() => fetchSubjects()}>
              Refresh List
            </button>
          </div>
        ) : (
          subjects.map((subject) => (
            <div key={subject.id} className="subject-card" onClick={() => navigate(`/faculty/subjects/${subject.id}`)}>
              <div className="subject-icon" style={{ background: subject.color || '#FF6B1A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div className="subject-info">
                <h3 className="subject-code">{subject.code}</h3>
                <p className="subject-name">{subject.name}</p>
                <div className="subject-meta">
                  <span>{subject.sections?.length || 0} Sections</span>
                  <span>·</span>
                  <span>{subject.enrolled_count || 0} Students</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FacultySubjects;