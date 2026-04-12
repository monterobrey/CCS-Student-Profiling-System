import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Dean/ArchiveManagement.css';

const ArchiveManagement = () => {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/archive');
      setStudents(res.data.students || []);
      setFaculty(res.data.faculty || []);
    } catch (err) {
      console.error('Failed to fetch archive:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const confirmRestore = (item) => {
    setSelectedItem(item);
    setShowRestoreModal(true);
  };

  const restoreAccount = async () => {
    if (!selectedItem) return;
    setRestoring(true);
    try {
      await axios.post(`/api/archive/${selectedItem.id}/restore`, {
        type: activeTab === 'students' ? 'student' : 'faculty'
      });
      setShowRestoreModal(false);
      fetchArchived();
      alert('Account restored successfully.');
    } catch (err) {
      alert('Failed to restore account.');
    } finally {
      setRestoring(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const currentData = activeTab === 'students' ? students : faculty;

  return (
    <div className="archive-page">
      <div className="page-header">
        <div className="header-left">
          <div className="breadcrumb">Management</div>
          <h2 className="page-title">Archive Management</h2>
          <p className="page-sub">View and restore archived student and faculty accounts.</p>
        </div>
        <div className="header-stats">
          <div className="stat-pill">
            <span className="pill-label">Archived Students</span>
            <span className="pill-value">{students.length}</span>
          </div>
          <div className="stat-pill">
            <span className="pill-label">Archived Faculty</span>
            <span className="pill-value">{faculty.length}</span>
          </div>
        </div>
      </div>

      <div className="archive-tabs pcard">
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Student Accounts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'faculty' ? 'active' : ''}`}
          onClick={() => setActiveTab('faculty')}
        >
          Faculty Accounts
        </button>
      </div>

      <div className="archive-list pcard">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading archived accounts...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>{activeTab === 'students' ? 'STUDENT NO.' : 'DEPARTMENT'}</th>
                  <th>{activeTab === 'students' ? 'PROGRAM' : 'POSITION'}</th>
                  <th>ARCHIVED BY</th>
                  <th>ARCHIVED AT</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="user-cell">
                        <div className="u-avatar">
                          {(item.first_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="u-name">{item.first_name} {item.last_name}</p>
                          <p className="u-sub">{item.user?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {activeTab === 'students' 
                        ? (item.student_number || 'N/A') 
                        : (item.department?.department_name || 'N/A')}
                    </td>
                    <td>
                      <span className="type-badge">
                        {activeTab === 'students' 
                          ? (item.program?.program_code || 'N/A') 
                          : (item.position || 'N/A')}
                      </span>
                    </td>
                    <td>
                      {item.archiver ? (
                        <div className="archiver-info">
                          <span className="archiver-name">
                            {item.archiver.role === 'secretary' 
                              ? 'Secretary' 
                              : (item.archiver.role === 'dean' ? 'Dean' : 'Chair')}
                          </span>
                          <span className="archiver-email">{item.archiver.email}</span>
                        </div>
                      ) : (
                        <span className="na-text">System</span>
                      )}
                    </td>
                    <td>{formatDate(item.deleted_at)}</td>
                    <td className="actions-cell">
                      <button 
                        className="restore-btn" 
                        onClick={() => confirmRestore(item)} 
                        title="Restore Account"
                      >
                        <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                          <path 
                            d="M10 2v4M10 2a8 8 0 108 8M10 2l-3 3m3-3l3 3" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
                {currentData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      No archived {activeTab} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESTORE MODAL */}
      {showRestoreModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowRestoreModal(false);
        }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3>Restore Account</h3>
              <button className="close-btn" onClick={() => setShowRestoreModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to restore the account of{' '}
                <strong>{selectedItem?.first_name} {selectedItem?.last_name}</strong>?
              </p>
              <p className="modal-help">
                This will move the account back to the active list and allow the user to log in again.
              </p>
            </div>
            <div className="modal-footer">
              <button className="ghost-btn" onClick={() => setShowRestoreModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={restoreAccount} disabled={restoring}>
                {restoring ? 'Restoring...' : 'Restore Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveManagement;
