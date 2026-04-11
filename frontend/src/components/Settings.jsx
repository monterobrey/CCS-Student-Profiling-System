import { useMemo } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import './Settings.css';

export default function Settings() {
  const { user, isDean, isFaculty, isStudent } = useAuth();

  const roleLabel = useMemo(() => {
    const role = user?.role;
    if (role === ROLES.DEAN) return 'Dean · Head of Department';
    if (role === ROLES.FACULTY) return 'Faculty Member';
    if (role === ROLES.STUDENT) return 'Student';
    return 'User';
  }, [user?.role]);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2 className="settings-title">Settings</h2>
          <p className="settings-subtitle">Manage your account preferences and configurations.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-main">
          <div className="settings-card">
            <div className="settings-card-header">
              <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Account Settings</h3>
              <span className="coming-soon">Coming Soon</span>
            </div>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Display Name</p>
                  <p className="setting-desc">Change how your name appears across the portal</p>
                </div>
                <button className="setting-btn" disabled>Edit</button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Email Address</p>
                  <p className="setting-desc">Update your institutional email address</p>
                </div>
                <button className="setting-btn" disabled>Edit</button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Change Password</p>
                  <p className="setting-desc">Update your login password</p>
                </div>
                <button className="setting-btn" disabled>Change</button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Profile Photo</p>
                  <p className="setting-desc">Upload a profile picture for your account</p>
                </div>
                <button className="setting-btn" disabled>Upload</button>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Notifications</h3>
              <span className="coming-soon">Coming Soon</span>
            </div>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Email Notifications</p>
                  <p className="setting-desc">Receive updates and alerts via email</p>
                </div>
                <div className="toggle disabled">
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">In-App Notifications</p>
                  <p className="setting-desc">Show notifications inside the portal</p>
                </div>
                <div className="toggle active disabled">
                  <div className="toggle-knob"></div>
                </div>
              </div>

              {isDean && (
                <>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Violation Alerts</p>
                      <p className="setting-desc">Notify when a new student violation is recorded</p>
                    </div>
                    <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Award Approval Requests</p>
                      <p className="setting-desc">Notify when faculty submits an award recommendation</p>
                    </div>
                    <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Report Generation Complete</p>
                      <p className="setting-desc">Notify when a department report is ready</p>
                    </div>
                    <div className="toggle disabled"><div className="toggle-knob"></div></div>
                  </div>
                </>
              )}

              {isFaculty && (
                <>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Student Performance Alerts</p>
                      <p className="setting-desc">Notify when a student in your class is at risk</p>
                    </div>
                    <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Grade Submission Reminders</p>
                      <p className="setting-desc">Remind you when grade submission deadline is near</p>
                    </div>
                    <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Schedule Changes</p>
                      <p className="setting-desc">Notify when your teaching schedule is updated</p>
                    </div>
                    <div className="toggle disabled"><div className="toggle-knob"></div></div>
                  </div>
                </>
              )}

              {isStudent && (
                <>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Grade Released</p>
                      <p className="setting-desc">Notify when your grades are posted by a professor</p>
                    </div>
                    <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Violation Notice</p>
                      <p className="setting-desc">Notify when a violation is recorded on your account</p>
                    </div>
                    <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Award Recognition</p>
                      <p className="setting-desc">Notify when you receive an award or recognition</p>
                    </div>
                    <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Schedule Updates</p>
                      <p className="setting-desc">Notify when your class schedule changes</p>
                    </div>
                    <div className="toggle disabled"><div className="toggle-knob"></div></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {isDean && (
            <>
              <div className="settings-card">
                <div className="settings-card-header">
                  <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                    <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5M13 21l4-4m0 0l4 4m-4-4v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>Reports & Data Export</h3>
                  <span className="coming-soon">Coming Soon</span>
                </div>
                <div className="settings-card-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Default Report Format</p>
                      <p className="setting-desc">Choose between PDF, Excel, or CSV for exported reports</p>
                    </div>
                    <button className="setting-btn" disabled>Configure</button>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Scheduled Report Generation</p>
                      <p className="setting-desc">Automatically generate department reports on a schedule</p>
                    </div>
                    <div className="toggle disabled"><div className="toggle-knob"></div></div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Data Retention Period</p>
                      <p className="setting-desc">Set how long student records are kept in the system</p>
                    </div>
                    <button className="setting-btn" disabled>Configure</button>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>Academic Year Configuration</h3>
                  <span className="coming-soon">Coming Soon</span>
                </div>
                <div className="settings-card-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Current Academic Year</p>
                      <p className="setting-desc">Set the active academic year for the system</p>
                    </div>
                    <button className="setting-btn" disabled>Edit</button>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">Current Semester</p>
                      <p className="setting-desc">Set whether the system is in 1st or 2nd semester</p>
                    </div>
                    <button className="setting-btn" disabled>Edit</button>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <p className="setting-label">GWA Grading Scale</p>
                      <p className="setting-desc">Configure the GWA scale used for Dean's List qualification</p>
                    </div>
                    <button className="setting-btn" disabled>Configure</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {isFaculty && (
            <div className="settings-card">
              <div className="settings-card-header">
                <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Teaching Preferences</h3>
                <span className="coming-soon">Coming Soon</span>
              </div>
              <div className="settings-card-body">
                <div className="setting-row">
                  <div className="setting-info">
                    <p className="setting-label">Default Grading Scheme</p>
                    <p className="setting-desc">Set your preferred grading system for student evaluation</p>
                  </div>
                  <button className="setting-btn" disabled>Configure</button>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <p className="setting-label">Student Performance Threshold</p>
                    <p className="setting-desc">Set the grade threshold to flag at-risk students</p>
                  </div>
                  <button className="setting-btn" disabled>Configure</button>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <p className="setting-label">Class Attendance Tracking</p>
                    <p className="setting-desc">Enable attendance monitoring for your classes</p>
                  </div>
                  <div className="toggle disabled"><div className="toggle-knob"></div></div>
                </div>
              </div>
            </div>
          )}

          {isStudent && (
            <div className="settings-card">
              <div className="settings-card-header">
                <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Privacy Settings</h3>
                <span className="coming-soon">Coming Soon</span>
              </div>
              <div className="settings-card-body">
                <div className="setting-row">
                  <div className="setting-info">
                    <p className="setting-label">Profile Visibility</p>
                    <p className="setting-desc">Control who can view your profile and academic details</p>
                  </div>
                  <button className="setting-btn" disabled>Configure</button>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <p className="setting-label">Show GWA on Profile</p>
                    <p className="setting-desc">Allow faculty and classmates to see your GWA</p>
                  </div>
                  <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <p className="setting-label">Show Awards on Profile</p>
                    <p className="setting-desc">Display your awards and recognitions publicly</p>
                  </div>
                  <div className="toggle active disabled"><div className="toggle-knob"></div></div>
                </div>
              </div>
            </div>
          )}

          <div className="settings-card">
            <div className="settings-card-header">
              <svg viewBox="0 0 24 24" fill="none" className="settings-icon">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>Appearance</h3>
              <span className="coming-soon">Coming Soon</span>
            </div>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Theme</p>
                  <p className="setting-desc">Switch between light and dark mode</p>
                </div>
                <div className="theme-options">
                  <button className="theme-btn active" disabled>Light</button>
                  <button className="theme-btn" disabled>Dark</button>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label">Sidebar Collapsed by Default</p>
                  <p className="setting-desc">Start with the sidebar minimized on login</p>
                </div>
                <div className="toggle disabled"><div className="toggle-knob"></div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-side">
          <div className="settings-card role-card">
            <div className="role-icon">{user?.name?.charAt(0) ?? 'U'}</div>
            <p className="role-name">{user?.name ?? 'User'}</p>
            <p className="role-label">{roleLabel}</p>
            <div className="role-divider"></div>
            <div className="role-info-row">
              <span className="role-info-label">Role</span>
              <span className="role-info-value">{roleLabel}</span>
            </div>
            {isStudent && (
              <div className="role-info-row">
                <span className="role-info-label">Section</span>
                <span className="role-info-value">BSCS 3-A</span>
              </div>
            )}
            {isFaculty && (
              <div className="role-info-row">
                <span className="role-info-label">Department</span>
                <span className="role-info-value">CCS</span>
              </div>
            )}
            {isDean && (
              <div className="role-info-row">
                <span className="role-info-label">Department</span>
                <span className="role-info-value">CCS</span>
              </div>
            )}
            <div className="role-info-row">
              <span className="role-info-label">AY</span>
              <span className="role-info-value">2026–2027</span>
            </div>
          </div>

          <div className="settings-card notice-card">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '32px', height: '32px', color: '#FF6B1A', marginBottom: '10px' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="notice-title">Settings Under Development</p>
            <p className="notice-desc">These settings are placeholders for features currently being built. They will be fully functional in a future update.</p>
          </div>

          <div className="settings-card danger-card">
            <div className="settings-card-header">
              <svg viewBox="0 0 24 24" fill="none" className="settings-icon" style={{ color: '#ef4444' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 style={{ color: '#ef4444' }}>Danger Zone</h3>
            </div>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-info">
                  <p className="setting-label" style={{ color: '#ef4444' }}>Deactivate Account</p>
                  <p className="setting-desc">Temporarily disable your account access</p>
                </div>
                <button className="danger-btn" disabled>Deactivate</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}