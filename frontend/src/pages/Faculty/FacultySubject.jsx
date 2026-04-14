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
      <div className="mini-stats">
        <div className="mini-stat stat-orange">
          <div className="mini-stat-icon" style={{ background: '#fff5ef', color: '#FF6B1A' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value" style={{ color: '#FF6B1A' }}>{totalLoad}</span>
            <span className="mini-stat-label">Class{totalLoad !== 1 ? 'es' : ''}</span>
          </div>
        </div>
        
        <div className="mini-stat stat-blue">
          <div className="mini-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value" style={{ color: '#3b82f6' }}>1</span>
            <span className="mini-stat-label">Programs</span>
          </div>
        </div>

        <div className="mini-stat stat-green">
          <div className="mini-stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value" style={{ color: '#22c55e' }}>{activeSections}</span>
            <span className="mini-stat-label">Sections</span>
          </div>
        </div>

        <div className="mini-stat stat-purple">
          <div className="mini-stat-icon" style={{ background: '#faf5ff', color: '#a855f7' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0"/>
            </svg>
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value" style={{ color: '#a855f7' }}>{totalStudents}</span>
            <span className="mini-stat-label">Students Handled</span>
          </div>
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