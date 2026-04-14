import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import httpClient from '../../../services/httpClient';
import './ActivateAccount.css';

const ActivateAccount = () => {
  const navigate = useNavigate();

  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [idFocused, setIdFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleActivation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await httpClient.post('/activate', {
        student_number: studentNumber,
        email: email,
        password: password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/students/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Activation failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activate-page">
      {/* Background decorative elements */}
      <div className="bg-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="grid-pattern"></div>
      </div>

      <div className="activate-container">
        {/* Left panel */}
        <div className="left-panel">
          <div className="brand-mark">
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#FF6B1A"/>
                <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20z" fill="white" fillOpacity="0.2"/>
                <path d="M14 20h12M20 14v12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="brand-name">CCS Portal</span>
          </div>

          <div className="left-content">
            <h1 className="hero-text">
              Account<br/>
              <span className="accent">Activation</span>
            </h1>
            <p className="hero-sub">Enter your student details to activate your portal account and set your password.</p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Access your academic profile</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>View performance & violations</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Update your skill set</span>
              </div>
            </div>
          </div>

          <div className="left-footer">
            <span>© 2024 Department of Information Systems</span>
          </div>
        </div>

        {/* Right panel (form) */}
        <div className="right-panel">
          <div className="form-card">
            <div className="form-header">
              <h2>Activate Account</h2>
              <p>Verification required for new student accounts</p>
            </div>

            <form onSubmit={handleActivation} className="activate-form">
              {/* Student Number */}
              <div className="field-group">
                <label htmlFor="student-number">Student Number</label>
                <div className={`input-wrapper ${idFocused ? 'focused' : ''} ${studentNumber ? 'filled' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM2 17a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    id="student-number"
                    type="text"
                    required
                    placeholder="202X-XXXX"
                    onFocus={() => setIdFocused(true)}
                    onBlur={() => setIdFocused(false)}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="field-group">
                <label htmlFor="email-address">Institutional Email</label>
                <div className={`input-wrapper ${emailFocused ? 'focused' : ''} ${email ? 'filled' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                    <path d="M2.5 6.5l7.5 5 7.5-5M3 5h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="email-address"
                    type="email"
                    required
                    placeholder="you@department.edu"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="field-group">
                <label htmlFor="password">Set Password</label>
                <div className={`input-wrapper ${passwordFocused ? 'focused' : ''} ${password ? 'filled' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {!showPassword ? (
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M3 3l14 14M8.5 8.5A2.5 2.5 0 0112.5 12M6 5.5C4.3 6.8 3 8.5 3 10s3.5 6 7 6c1.5 0 2.9-.5 4-1.3M14.5 14C16.1 12.7 17 11.1 17 10c0-1.5-3.5-6-7-6-1 0-1.9.2-2.8.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-alert">
                  <svg viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="success-alert">
                  <svg viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Account activated! Redirecting to login...
                </div>
              )}

              <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading || success}>
                <span className="btn-content">
                  {!loading ? (
                    <span>Activate Account</span>
                  ) : (
                    <span className="loading-state">
                      <span className="spinner"></span>
                      Verifying...
                    </span>
                  )}
                </span>
                {!loading && (
                  <svg className="btn-arrow" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              <div className="form-footer">
                <Link to="/students/login" className="back-link">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M15 10H5M5 10l5-5m-5 5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateAccount;
