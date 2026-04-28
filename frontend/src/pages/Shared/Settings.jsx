import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { httpClient } from '../../services/httpClient';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import '../../styles/Shared/Settings.css';

// ── Inline modal for email / password changes ─────────────────────────────
function SettingsModal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <h3>{title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Toggle component ──────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`toggle${checked ? ' active' : ''}${disabled ? ' disabled' : ''}`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="toggle-knob" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, setUser } = useAuth();

  // ── Modal state ──────────────────────────────────────────────────────
  const [modal, setModal] = useState(null); // 'email' | 'password' | null

  // ── Email form ───────────────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ email: '', password: '' });
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  // ── Password form ────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // ── Preferences ──────────────────────────────────────────────────────
  const [prefSaving, setPrefSaving] = useState(false);

  // ── Role label ───────────────────────────────────────────────────────
  const roleLabel = useMemo(() => {
    const r = user?.role;
    if (r === 'dean') return 'Dean · Head of Department';
    if (r === 'department_chair') return 'Department Chair';
    if (r === 'secretary') return 'Secretary';
    if (r === 'faculty') return 'Faculty Member';
    if (r === 'student') return 'Student';
    return 'User';
  }, [user?.role]);

  // ── Helpers ──────────────────────────────────────────────────────────
  const openModal = (type) => {
    setEmailForm({ email: '', password: '' });
    setEmailError(''); setEmailSuccess('');
    setPwForm({ current_password: '', password: '', password_confirmation: '' });
    setPwError(''); setPwSuccess('');
    setShowPw({ current: false, new: false, confirm: false });
    setModal(type);
  };

  // ── Save email ───────────────────────────────────────────────────────
  const saveEmail = async () => {
    setEmailError('');
    if (!emailForm.email) return setEmailError('Email is required.');
    if (!emailForm.password) return setEmailError('Current password is required.');
    setEmailSaving(true);
    try {
      const res = await httpClient.put(API_ENDPOINTS.AUTH.UPDATE_EMAIL, emailForm);
      if (res.ok) {
        setEmailSuccess('Email updated successfully.');
        setUser((prev) => ({ ...prev, email: emailForm.email }));
        setTimeout(() => setModal(null), 1200);
      } else {
        setEmailError(res.message || 'Failed to update email.');
      }
    } catch {
      setEmailError('Something went wrong.');
    } finally {
      setEmailSaving(false);
    }
  };

  // ── Save password ────────────────────────────────────────────────────
  const savePassword = async () => {
    setPwError('');
    if (!pwForm.current_password) return setPwError('Current password is required.');
    if (!pwForm.password) return setPwError('New password is required.');
    if (pwForm.password.length < 8) return setPwError('Password must be at least 8 characters.');
    if (pwForm.password !== pwForm.password_confirmation) return setPwError('Passwords do not match.');
    setPwSaving(true);
    try {
      const res = await httpClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, pwForm);
      if (res.ok) {
        setPwSuccess('Password changed successfully.');
        setTimeout(() => setModal(null), 1200);
      } else {
        setPwError(res.message || 'Failed to change password.');
      }
    } catch {
      setPwError('Something went wrong.');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Save preference ──────────────────────────────────────────────────
  const savePreference = async (key, value) => {
    // Optimistic update
    setUser((prev) => ({ ...prev, [key]: value }));
    setPrefSaving(true);
    try {
      await httpClient.put(API_ENDPOINTS.AUTH.UPDATE_PREFERENCES, { [key]: value });
    } catch {
      // Revert on failure
      setUser((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setPrefSaving(false);
    }
  };

  // ── Eye icon ─────────────────────────────────────────────────────────
  const EyeIcon = ({ visible }) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {visible
        ? <><path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="2.5"/></>
        : <><path d="M17.94 11.94A9.08 9.08 0 0019 10s-3.5-6-9-6a8.6 8.6 0 00-3.94.94M3 3l14 14M9.88 9.88A2.5 2.5 0 0013.12 13.12"/><path d="M1 10s3.5 6 9 6a8.6 8.6 0 003.94-.94"/></>
      }
    </svg>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-sub">Manage your account preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* ── LEFT COLUMN ── */}
        <div className="settings-main">

          {/* ── Account ── */}
          <div className="settings-card">
            <div className="settings-card-header">
              <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Account</h3>
            </div>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Email Address</p>
                  <p className="setting-desc">{user?.email ?? '—'}</p>
                </div>
                <button className="setting-btn setting-btn-active" onClick={() => openModal('email')}>
                  Change
                </button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Password</p>
                  <p className="setting-desc">Update your login password</p>
                </div>
                <button className="setting-btn setting-btn-active" onClick={() => openModal('password')}>
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* ── Notifications ── */}
          <div className="settings-card">
            <div className="settings-card-header">
              <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Notifications</h3>
            </div>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">In-App Notifications</p>
                  <p className="setting-desc">Receive alerts and updates inside the portal</p>
                </div>
                <Toggle
                  checked={user?.notifications_enabled ?? true}
                  onChange={(val) => savePreference('notifications_enabled', val)}
                  disabled={prefSaving}
                />
              </div>
            </div>
          </div>

          {/* ── Appearance ── */}
          <div className="settings-card">
            <div className="settings-card-header">
              <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h3>Appearance</h3>
            </div>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Sidebar Collapsed by Default</p>
                  <p className="setting-desc">Start with the sidebar minimized on every login</p>
                </div>
                <Toggle
                  checked={user?.sidebar_collapsed ?? false}
                  onChange={(val) => savePreference('sidebar_collapsed', val)}
                  disabled={prefSaving}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="settings-side">
          <div className="settings-card role-card">
            <div className="role-icon">{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</div>
            <p className="role-name">{user?.name ?? 'User'}</p>
            <p className="role-label">{roleLabel}</p>
            <div className="role-divider" />
            <div className="role-info-row">
              <span className="role-info-label">Email</span>
              <span className="role-info-value" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email ?? '—'}
              </span>
            </div>
            <div className="role-info-row">
              <span className="role-info-label">Role</span>
              <span className="role-info-value">{roleLabel}</span>
            </div>
            <div className="role-info-row">
              <span className="role-info-label">AY</span>
              <span className="role-info-value">2026–2027</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHANGE EMAIL MODAL ── */}
      {modal === 'email' && (
        <SettingsModal title="Change Email Address" onClose={() => setModal(null)}>
          <div className="modal-body">
            <div className="field">
              <label>New Email Address <span className="req">*</span></label>
              <input
                type="email"
                placeholder="Enter new email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                autoFocus
              />
            </div>
            <div className="field">
              <label>Current Password <span className="req">*</span></label>
              <input
                type="password"
                placeholder="Confirm with your password"
                value={emailForm.password}
                onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
              />
            </div>
            {emailError && <p className="field-error">{emailError}</p>}
            {emailSuccess && <p className="field-success">{emailSuccess}</p>}
          </div>
          <div className="modal-footer">
            <button className="outline-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn" onClick={saveEmail} disabled={emailSaving}>
              {emailSaving ? 'Saving…' : 'Update Email'}
            </button>
          </div>
        </SettingsModal>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {modal === 'password' && (
        <SettingsModal title="Change Password" onClose={() => setModal(null)}>
          <div className="modal-body">
            <div className="field">
              <label>Current Password <span className="req">*</span></label>
              <div className="input-eye">
                <input
                  type={showPw.current ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                  autoFocus
                />
                <button type="button" className="eye-btn" onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}>
                  <EyeIcon visible={showPw.current} />
                </button>
              </div>
            </div>
            <div className="field">
              <label>New Password <span className="req">*</span></label>
              <div className="input-eye">
                <input
                  type={showPw.new ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={pwForm.password}
                  onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPw((p) => ({ ...p, new: !p.new }))}>
                  <EyeIcon visible={showPw.new} />
                </button>
              </div>
            </div>
            <div className="field">
              <label>Confirm New Password <span className="req">*</span></label>
              <div className="input-eye">
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={pwForm.password_confirmation}
                  onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}>
                  <EyeIcon visible={showPw.confirm} />
                </button>
              </div>
            </div>
            {pwError && <p className="field-error">{pwError}</p>}
            {pwSuccess && <p className="field-success">{pwSuccess}</p>}
          </div>
          <div className="modal-footer">
            <button className="outline-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn" onClick={savePassword} disabled={pwSaving}>
              {pwSaving ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </SettingsModal>
      )}
    </div>
  );
}
