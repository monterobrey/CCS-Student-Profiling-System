import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import httpClient from '../../../services/httpClient';
import pncLogo from '../../../assets/pnc-logo.png';
import ccsLogo from '../../../assets/ccs-logo.png';
import './SetupPasswordFaculty.css';

const SetupPasswordFaculty = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordsMatch = useMemo(() => {
    return passwordConfirmation && password && password === passwordConfirmation;
  }, [password, passwordConfirmation]);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthLabel = useMemo(() => {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  }, [passwordStrength]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    setEmail(emailParam || '');
    setToken(tokenParam || '');
    if (!emailParam || !tokenParam) {
      setError('Invalid setup link. Please check your email.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      navigate('/login');
    }
  }, [isSuccess, countdown, navigate]);

  const handleSetup = async () => {
    if (!password || !passwordConfirmation) {
      setError('Please fill in both fields.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    setIsSuccess(false);
    try {
      const response = await httpClient.post('/setup-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      setSuccess(response.message || 'Account setup successful');
      setIsSuccess(true);
      setCountdown(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password. Link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="card">
        <div className="header-section">
          <div className="logos-row">
            <div className="logo-wrap pnc">
              <img src={pncLogo} alt="University Logo" />
            </div>
            <div className="logo-wrap ccs">
              <img src={ccsLogo} alt="CCS Logo" />
            </div>
          </div>
          <div className="brand-text">
            <span className="brand-name">CCS Faculty Portal</span>
            <span className="brand-sub">University of Cabuyao</span>
          </div>
        </div>

        <div className="divider-line"></div>

        {error && !isSuccess && (
          <div className="global-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="success-section">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2>Password Set!</h2>
            <p>{success || 'Your faculty account password has been created successfully.'}</p>
            <div className="redirect-note">Redirecting to login in {countdown} seconds...</div>
            <button className="login-btn" onClick={() => navigate('/login')}>
              Go to Login Now
            </button>
          </div>
        ) : (
          <>
            <div className="icon-container">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f06a00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <h1>Faculty Setup</h1>
            <p className="subtitle">Create a secure password for your account</p>

            <div className="email-chip">
              <span className="dot"></span>
              {email || 'loading...'}
            </div>

            <div className="fields">
              <div className="field">
                <label>Password</label>
                <div className="input-row">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {!showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
                {password && (
                  <div className="strength-bar">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`strength-segment ${passwordStrength >= i ? `active level-${passwordStrength}` : ''}`}
                      ></div>
                    ))}
                    <span className="strength-label">{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div className="field">
                <label>Confirm Password</label>
                <div className="input-row">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  </span>
                  <input
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex="-1">
                    {!showConfirm ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
                {passwordsMatch && (
                  <div className="match-success">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Passwords match!
                  </div>
                )}
                {error && !passwordsMatch && passwordConfirmation && (
                  <div className="match-success match-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    {error}
                  </div>
                )}
              </div>
            </div>

            <button className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading} onClick={handleSetup}>
              {!loading ? (
                <span>Set Password</span>
              ) : (
                <span className="spinner"></span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SetupPasswordFaculty;
