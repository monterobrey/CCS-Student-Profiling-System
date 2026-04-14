import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { archiveService } from '../../services';
import styles from '../../styles/Dean/ArchiveManagement.module.css';

const ArchiveManagement = () => {
  const cx = (...classKeys) =>
    classKeys
      .filter(Boolean)
      .map((k) => styles[k])
      .filter(Boolean)
      .join(' ');

  const [activeTab, setActiveTab] = useState('students');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
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

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const restoreMutation = useMutation({
    mutationFn: ({ id, type }) => archiveService.restoreAccount(id, type),
    onSuccess: async (res) => {
      if (!res?.ok) throw new Error(res?.message || 'Failed to restore account.');
      setShowRestoreModal(false);
      setSelectedItem(null);
      await queryClient.invalidateQueries({ queryKey: ['archive-accounts'] });
      showToast('success', 'Account restored successfully.');
    },
    onError: (err) => {
      showToast('error', err?.message || 'Failed to restore account.');
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
      // handled by mutation onError + fallback
      showToast('error', err?.message || 'Failed to restore account.');
    }
  };
  const currentData = useMemo(
    () => (activeTab === 'students' ? students : faculty),
    [activeTab, students, faculty]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentData;
    return currentData.filter((item) => {
      const name = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
      const email = (item.user?.email || '').toLowerCase();
      const studentNo = (item.student_number || item.user?.student_number || '').toLowerCase();
      const dept = (item.department?.department_name || '').toLowerCase();
      const program = (item.program?.program_code || '').toLowerCase();
      const position = (item.position || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        studentNo.includes(q) ||
        dept.includes(q) ||
        program.includes(q) ||
        position.includes(q)
      );
    });
  }, [currentData, search]);

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
    <div className={styles['archive-page']}>

      {toast && <div className={cx('toast', `toast-${toast.type}`)}>{toast.message}</div>}

      {/* ── HEADER ── */}
      <div className={styles['page-header']}>
        <div className={styles['header-left']}>
          <h2 className={styles['page-title']}>Archive Management</h2>
          <p className={styles['page-sub']}>View and restore archived student and faculty accounts.</p>
        </div>
        <div className={styles['header-stats']}>
          <div className={styles['stat-pill']}>
            <span className={styles['pill-label']}>Archived Students</span>
            <span className={styles['pill-value']}>{students.length}</span>
          </div>
          <div className={styles['stat-pill']}>
            <span className={styles['pill-label']}>Archived Faculty</span>
            <span className={styles['pill-value']}>{faculty.length}</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className={cx('archive-tabs', 'pcard')}>
        <button
          className={cx('tab-btn', activeTab === 'students' && 'active')}
          onClick={() => setActiveTab('students')}
        >
          Student Accounts
        </button>
        <button
          className={cx('tab-btn', activeTab === 'faculty' && 'active')}
          onClick={() => setActiveTab('faculty')}
        >
          Faculty Accounts
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className={cx('archive-list', 'pcard')}>
        <div className={styles['table-toolbar']}>
          <div className={styles['search-wrap']}>
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder={activeTab === 'students' ? 'Search student name, email, number…' : 'Search faculty name, email, department…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles['results-pill']}>
            Showing <strong>{filteredData.length}</strong> of {currentData.length}
          </div>
        </div>
        {loading ? (
          <div className={styles['loading-state']}>
            <div className={styles.spinner} />
            <p>Loading archived accounts…</p>
          </div>
        ) : (
          <div className={styles['table-container']}>
            <table className={styles['data-table']}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>{activeTab === 'students' ? 'Student No.' : 'Department'}</th>
                  <th>{activeTab === 'students' ? 'Program' : 'Position'}</th>
                  <th>Archived By</th>
                  <th>Archived At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles['user-cell']}>
                        <div className={styles['u-avatar']} style={getAvatarStyle(idx)}>
                          {(item.first_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className={styles['u-name']}>{item.first_name} {item.last_name}</p>
                          <p className={styles['u-sub']}>{item.user?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {activeTab === 'students'
                        ? (item.user?.student_number || item.student_number || 'N/A')
                        : (item.department?.department_name || 'N/A')}
                    </td>
                    <td>
                      <span className={styles['type-badge']}>
                        {activeTab === 'students'
                          ? (item.program?.program_code || 'N/A')
                          : (item.position || 'N/A')}
                      </span>
                    </td>
                    <td>
                      {item.archiver ? (
                        <div className={styles['archiver-info']}>
                          <span className={styles['archiver-name']}>
                            {item.archiver.name || item.archiver.email}
                          </span>
                          <span className={styles['archiver-email']}>{item.archiver.email}</span>
                        </div>
                      ) : (
                        <span className={styles['na-text']}>System</span>
                      )}
                    </td>
                    <td>{formatDate(item.deleted_at)}</td>
                    <td className={styles['actions-cell']}>
                      <button
                        className={styles['restore-btn']}
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
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="6" className={styles['empty-row']}>
                      {search.trim()
                        ? `No archived ${activeTab} match “${search.trim()}”.`
                        : `No archived ${activeTab} found.`}
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
          className={styles['modal-overlay']}
          onClick={(e) => { if (!restoreMutation.isPending && e.target === e.currentTarget) setShowRestoreModal(false); }}
        >
          <div className={cx('modal', 'modal-sm')}>
            <div className={styles['modal-header']}>
              <h3>Restore Account</h3>
              <button className={styles['close-btn']} onClick={() => setShowRestoreModal(false)} disabled={restoreMutation.isPending}>×</button>
            </div>
            <div className={styles['modal-body']}>
              <p>
                Are you sure you want to restore the account of{' '}
                <strong>{selectedItem?.first_name} {selectedItem?.last_name}</strong>?
              </p>
              <p className={styles['modal-help']}>
                This will move the account back to the active list and allow the user to log in again.
              </p>
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['ghost-btn']} onClick={() => setShowRestoreModal(false)} disabled={restoreMutation.isPending}>
                Cancel
              </button>
              <button className={styles['primary-btn']} onClick={restoreAccount} disabled={restoreMutation.isPending}>
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