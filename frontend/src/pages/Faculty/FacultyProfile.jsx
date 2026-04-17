import React, { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../../services/httpClient';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import '../../styles/Faculty/FacultyProfile.css';

const TABS = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'contact',  label: 'Contact & Address' },
];

const EXPERTISE_CATEGORIES = [
  'Programming',
  'Database',
  'Networking',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Cybersecurity',
  'Research',
  'Other',
];

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fp-toast ${type}`}>
      {type === 'success' ? (
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
          <circle cx="10" cy="10" r="8" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
          <circle cx="10" cy="10" r="8" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M10 6v4M10 13.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {message}
    </div>
  );
}

export default function FacultyProfile() {
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [toast, setToast]         = useState(null);

  // Expertise state
  const [newSkill, setNewSkill]       = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingExp, setAddingExp]     = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const res = await httpClient.get(API_ENDPOINTS.FACULTY.MY_PROFILE);
    if (res.success) {
      setProfile(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title:          profile.title          || null,
      middle_name:    profile.middle_name    || null,
      birthDate:      profile.birthDate      || null,
      contact_number: profile.contact_number || null,
      civil_status:   profile.civil_status   || null,
      gender:         profile.gender         || null,
      address:        profile.address        || null,
    };
    const res = await httpClient.put(API_ENDPOINTS.FACULTY.UPDATE_PROFILE, payload);
    setSaving(false);
    if (res.success) {
      setProfile(res.data);
      showToast('Profile saved successfully.');
    } else {
      showToast(res.message || 'Failed to save profile.', 'error');
    }
  };

  const handleAddExpertise = async () => {
    if (!newCategory) return;
    setAddingExp(true);
    const res = await httpClient.post(API_ENDPOINTS.FACULTY.ADD_EXPERTISE, {
      skillName:      newSkill.trim() || null,
      skill_category: newCategory,
    });
    setAddingExp(false);
    if (res.success) {
      setProfile(p => ({ ...p, expertise: [...(p.expertise || []), res.data] }));
      setNewSkill('');
      setNewCategory('');
      showToast('Expertise added.');
    } else {
      showToast(res.message || 'Failed to add expertise.', 'error');
    }
  };

  const handleRemoveExpertise = async (id) => {
    const res = await httpClient.delete(API_ENDPOINTS.FACULTY.REMOVE_EXPERTISE(id));
    if (res.success) {
      setProfile(p => ({ ...p, expertise: p.expertise.filter(e => e.id !== id) }));
      showToast('Expertise removed.');
    } else {
      showToast('Failed to remove expertise.', 'error');
    }
  };

  const initials = profile
    ? `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase()
    : '';

  const fullName = profile
    ? [profile.title, profile.first_name, profile.middle_name, profile.last_name]
        .filter(Boolean).join(' ')
    : '';

  if (loading) {
    return (
      <div className="fp-page">
        <div className="fp-loading-state">
          <span className="fp-spinner" />
          Loading your profile…
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fp-page">
        <div className="fp-loading-state">
          <p>Could not load profile. Please try again.</p>
          <button className="fp-save-btn" onClick={fetchProfile}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fp-page">
      {/* Header */}
      <div className="fp-page-header">
        <div>
          <h2 className="fp-page-title">My Profile</h2>
          <p className="fp-page-sub">Manage your personal details and areas of expertise.</p>
        </div>
        <button className="fp-save-btn" onClick={handleSave} disabled={saving}>
          {saving && <span className="fp-spinner-sm" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="fp-grid">
        {/* ── Left Column ── */}
        <div>
          {/* Hero identity card */}
          <div className="fp-hero-card">
            <div className="fp-avatar">{initials}</div>
            <div className="fp-hero-info">
              <p className="fp-hero-name">{fullName || '—'}</p>
              <p className="fp-hero-meta">
                {profile.position || 'Faculty'} · {profile.department?.department_name || '—'}
              </p>
            </div>
            <span className="fp-hero-badge">
              {profile.user?.status === 'active' ? 'Active' : 'Pending'}
            </span>
          </div>

          {/* Tabbed form card */}
          <div className="fp-card">
            <div className="fp-tab-bar">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`fp-tab-item${activeTab === tab.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'personal' && (
              <div className="fp-card-body">
                <div className="fp-section-header">
                  <div className="fp-section-icon personal">
                    <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM2 17a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="fp-section-title">Personal Information</p>
                    <p className="fp-section-sub">Basic details about you</p>
                  </div>
                </div>

                <div className="fp-form-grid">
                  {/* Title */}
                  <div className="fp-form-group">
                    <label>Title / Honorific</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <select
                        value={profile.title || ''}
                        onChange={e => setProfile(p => ({ ...p, title: e.target.value }))}
                      >
                        <option value="">None</option>
                        {['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Engr.', 'Atty.'].map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* First Name (readonly) */}
                  <div className="fp-form-group">
                    <label>First Name</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM2 17a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input value={profile.first_name || ''} readOnly />
                    </div>
                  </div>

                  {/* Middle Name */}
                  <div className="fp-form-group">
                    <label>Middle Name</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM2 17a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={profile.middle_name || ''}
                        onChange={e => setProfile(p => ({ ...p, middle_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Last Name (readonly) */}
                  <div className="fp-form-group">
                    <label>Last Name</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM2 17a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input value={profile.last_name || ''} readOnly />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="fp-form-group">
                    <label>Gender</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M10 12v6M7 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <select
                        value={profile.gender || ''}
                        onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Civil Status */}
                  <div className="fp-form-group">
                    <label>Civil Status</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M3 17a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </span>
                      <select
                        value={profile.civil_status || ''}
                        onChange={e => setProfile(p => ({ ...p, civil_status: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Separated</option>
                        <option>Widowed</option>
                      </select>
                    </div>
                  </div>

                  {/* Birthdate */}
                  <div className="fp-form-group">
                    <label>Date of Birth</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <rect x="2" y="3" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M2 8h16M6 1v4M14 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        type="date"
                        value={profile.birthDate || ''}
                        onChange={e => setProfile(p => ({ ...p, birthDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Position (readonly) */}
                  <div className="fp-form-group">
                    <label>Position</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input value={profile.position || ''} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="fp-card-body">
                <div className="fp-section-header">
                  <div className="fp-section-icon contact">
                    <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                      <path d="M18 13.5v2.5a1.5 1.5 0 01-1.63 1.5A14.8 14.8 0 013.5 4.13 1.5 1.5 0 015 2.5h2.5a1.5 1.5 0 011.5 1.3c.1.72.27 1.43.52 2.1a1.5 1.5 0 01-.34 1.58L8.1 8.57a12 12 0 004.5 4.5l1.09-1.08a1.5 1.5 0 011.58-.34c.67.25 1.38.42 2.1.52A1.5 1.5 0 0118 13.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="fp-section-title">Contact & Address</p>
                    <p className="fp-section-sub">How we can reach you</p>
                  </div>
                </div>

                <div className="fp-form-grid">
                  {/* Email (readonly) */}
                  <div className="fp-form-group full">
                    <label>Institutional Email</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zM3 5l7 6 7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input value={profile.user?.email || ''} readOnly />
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div className="fp-form-group">
                    <label>Mobile Number</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <rect x="5" y="1" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M10 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        placeholder="09XX XXX XXXX"
                        maxLength={11}
                        value={profile.contact_number || ''}
                        onChange={e => setProfile(p => ({ ...p, contact_number: e.target.value.replace(/[^0-9]/g, '') }))}
                      />
                    </div>
                  </div>

                  {/* Department (readonly) */}
                  <div className="fp-form-group">
                    <label>Department</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M2 17V7l8-5 8 5v10H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 17v-5h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input value={profile.department?.department_name || '—'} readOnly />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="fp-form-group full">
                    <label>Home Address</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon" style={{ top: '10px', alignSelf: 'flex-start' }}>
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M10 1.5C7 1.5 4.5 4 4.5 7c0 4.5 5.5 11.5 5.5 11.5S15.5 11.5 15.5 7c0-3-2.5-5.5-5.5-5.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="10" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </span>
                      <textarea
                        placeholder="Enter your home address"
                        value={profile.address || ''}
                        onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="fp-side">
          {/* Academic Info */}
          <div className="fp-info-card">
            <div className="fp-info-card-header">
              <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                <path d="M10 1.5l8 4.5-8 4.5L2 6l8-4.5zM2 10l8 4.5 8-4.5M2 14l8 4.5 8-4.5" stroke="#b89f90" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Academic Info
            </div>
            <div className="fp-info-rows">
              {[
                { key: 'Employee ID',  val: profile.id ? `FAC-${String(profile.id).padStart(4, '0')}` : '—' },
                { key: 'Department',   val: profile.department?.department_name || '—' },
                { key: 'Position',     val: profile.position || '—' },
                { key: 'Account',      val: profile.user?.status === 'active' ? 'Active' : 'Pending' },
              ].map(row => (
                <div className="fp-info-row" key={row.key}>
                  <span className="fp-info-key">{row.key}</span>
                  <span className="fp-info-val">{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expertise Card */}
          <div className="fp-expertise-card">
            <div className="fp-expertise-header">
              <div className="fp-expertise-header-left">
                <div className="fp-expertise-icon-wrap">
                  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <path d="M6 5l-4 5 4 5M14 5l4 5-4 5M11.5 3l-3 14" stroke="#FF6B1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="fp-expertise-title">Areas of Expertise</div>
                  <div className="fp-expertise-count">
                    {(profile.expertise || []).length} skill{(profile.expertise || []).length !== 1 ? 's' : ''} added
                  </div>
                </div>
              </div>
            </div>

            <div className="fp-expertise-body">
              {/* Add row */}
              <div className="fp-expertise-add">
                <select
                  className="fp-expertise-select"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {EXPERTISE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className="fp-expertise-input-wrap">
                  <input
                    className="fp-expertise-input"
                    type="text"
                    placeholder="e.g. React, Python, SQL…"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyUp={e => e.key === 'Enter' && handleAddExpertise()}
                  />
                </div>
                <button
                  className="fp-expertise-add-btn"
                  onClick={handleAddExpertise}
                  disabled={!newCategory || addingExp}
                >
                  {addingExp ? '…' : 'Add'}
                </button>
              </div>

              <div className="fp-expertise-divider" />

              {(profile.expertise || []).length === 0 ? (
                <div className="fp-expertise-empty">No expertise added yet.</div>
              ) : (
                <div className="fp-expertise-list">
                  {profile.expertise.map(exp => (
                    <div className="fp-expertise-item" key={exp.id}>
                      <div className="fp-expertise-item-left">
                        <span className="fp-expertise-dot" />
                        <div>
                          <div className="fp-expertise-name">{exp.skillName}</div>
                          {exp.skill_category && (
                            <div className="fp-expertise-cat">{exp.skill_category}</div>
                          )}
                        </div>
                      </div>
                      <button
                        className="fp-expertise-remove"
                        onClick={() => handleRemoveExpertise(exp.id)}
                        title="Remove"
                      >
                        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
