import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { archiveService } from '../../services';
import '../../styles/Dean/ArchiveManagement.css';

const ArchiveManagement = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: archivedData, isLoading: loading } = useQuery({
    queryKey: ['archive-accounts'],
    queryFn: async () => {
      const res = await archiveService.getArchived();
      return res.ok ? (res.data || { students: [], faculty: [] }) : { students: [], faculty: [] };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const students = archivedData?.students || [];
  const faculty = archivedData?.faculty || [];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const confirmRestore = (item) => {
    setSelectedItem(item);
    setShowRestoreModal(true);
  };

  const restoreMutation = useMutation({
    mutationFn: ({ id, type }) => archiveService.restoreAccount(id, type),
    onSuccess: async (res) => {
      if (!res?.ok) throw new Error(res?.message || 'Failed to restore account.');
      setShowRestoreModal(false);
      setSelectedItem(null);
      await queryClient.invalidateQueries({ queryKey: ['archive-accounts'] });
      alert('Account restored successfully.');
    },
  });

  const restoreAccount = async () => {
    if (!selectedItem) return;
    try {
      await restoreMutation.mutateAsync({
        id: selectedItem.id,
        type: activeTab === 'students' ? 'student' : 'faculty',
      });
    } catch (err) {
      alert(err?.message || 'Failed to restore account.');
    }
  };
  const currentData = useMemo(
    () => (activeTab === 'students' ? students : faculty),
    [activeTab, students, faculty]
  );

  /* avatar background colours — cycles through a warm palette */
  const avatarColors = [
    ['#ffe8d6', '#c05000'],
    ['#fde8ff', '#7c009a'],
    ['#e8f4ff', '#0060c0'],
    ['#e8fff0', '#006030'],
    ['#fff8e8', '#805000'],
  ];
  const getAvatarStyle = (index) => {
    const [bg, color] = avatarColors[index % avatarColors.length];
    return { background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, color };
  };

  return (
    <div className="archive-page">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="header-left">
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

      {/* ── TABS ── */}
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

      {/* ── TABLE ── */}
      <div className="archive-list pcard">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading archived accounts…</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>{activeTab === 'students' ? 'Student No.' : 'Department'}</th>
                  <th>{activeTab === 'students' ? 'Program' : 'Position'}</th>
                  <th>Archived By</th>
                  <th>Archived At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <div className="user-cell">
                        <div className="u-avatar" style={getAvatarStyle(idx)}>
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
                            {item.archiver.name || item.archiver.email}
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
                        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                          <path
                            d="M10 2v4M10 2a8 8 0 108 8M10 2l-3 3m3-3l3 3"
                            stroke="currentColor"
                            strokeWidth="1.75"
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

      {/* ── RESTORE MODAL ── */}
      {showRestoreModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRestoreModal(false); }}
        >
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
              <button className="primary-btn" onClick={restoreAccount} disabled={restoreMutation.isPending}>
                {restoreMutation.isPending ? 'Restoring…' : 'Restore Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveManagement;