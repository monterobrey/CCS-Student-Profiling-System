import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import ccsLogo from "../../assets/ccs-logo.png";
import pncLogo from "../../assets/pnc-logo.png";
import "../../styles/Auth/ResetPassword.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const type  = searchParams.get("type")  || "faculty"; // 'student' | 'faculty'

  const loginPath = type === "student" ? "/students/login" : "/faculty/login";

  const [password, setPassword]             = useState("");
  const [confirmation, setConfirmation]     = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [isSuccess, setIsSuccess]           = useState(false);
  const [pwFocused, setPwFocused]           = useState(false);
  const [cfFocused, setCfFocused]           = useState(false);

  // Guard: if no token/email in URL, show error immediately
  const invalidLink = !email || !token;

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthClass = ["", "weak", "fair", "good", "strong"][passwordStrength];

  const passwordsMatch = confirmation && password === confirmation;

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmation) { setError("Please fill in both fields."); return; }
    if (password.length < 8)        { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmation)  { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await httpClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        email,
        token,
        password,
        password_confirmation: confirmation,
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        setError(res.message || "Invalid or expired reset link. Please request a new one.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-orb rp-orb-1" />
      <div className="rp-orb rp-orb-2" />

      <div className="rp-card">
        {/* Logos */}
        <div className="rp-logos">
          <div className="rp-logo-wrap">
            <img src={pncLogo} alt="University Logo" />
          </div>
          <div className="rp-logo-wrap">
            <img src={ccsLogo} alt="CCS Logo" />
          </div>
        </div>
        <div className="rp-brand">
          <span className="rp-brand-name">CCS Student Profiling System</span>
          <span className="rp-brand-sub">University of Cabuyao</span>
        </div>

        <div className="rp-divider" />

        {invalidLink ? (
          /* ── Invalid link ── */
          <div className="rp-state-block">
            <div className="rp-state-icon rp-icon-error">
              <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Invalid Link</h2>
            <p>This password reset link is invalid or has already been used. Please request a new one.</p>
            <button className="rp-btn" onClick={() => navigate(loginPath)}>Back to Login</button>
          </div>
        ) : isSuccess ? (
          /* ── Success ── */
          <div className="rp-state-block">
            <div className="rp-state-icon rp-icon-success">
              <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="currentColor" strokeWidth="1.6">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Password Reset!</h2>
            <p>Your password has been updated successfully. You can now log in with your new password.</p>
            <button className="rp-btn" onClick={() => navigate(loginPath)}>Go to Login</button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <div className="rp-form-header">
              <div className="rp-lock-icon">
                <svg viewBox="0 0 24 24" fill="none" width="28" height="28" stroke="#FF6B1A" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1>Reset Password</h1>
              <p>Create a new password for your account.</p>
              <div className="rp-email-chip">
                <span className="rp-chip-dot" />
                {email}
              </div>
            </div>

            {error && (
              <div className="rp-global-error">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="rp-form">
              {/* New password */}
              <div className="rp-field">
                <label>New Password</label>
                <div className={`rp-inp-wrap${pwFocused ? " rp-focused" : ""}`}>
                  <span className="rp-inp-ico">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
                    required
                  />
                  <button type="button" className="rp-eye" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {password && (
                  <div className="rp-strength">
                    <div className="rp-strength-bars">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`rp-bar${passwordStrength >= i ? ` rp-bar-${strengthClass}` : ""}`} />
                      ))}
                    </div>
                    <span className={`rp-strength-label rp-label-${strengthClass}`}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="rp-field">
                <label>Confirm Password</label>
                <div className={`rp-inp-wrap${cfFocused ? " rp-focused" : ""}`}>
                  <span className="rp-inp-ico">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmation}
                    onChange={(e) => { setConfirmation(e.target.value); setError(""); }}
                    onFocus={() => setCfFocused(true)}
                    onBlur={() => setCfFocused(false)}
                    required
                  />
                  <button type="button" className="rp-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex="-1">
                    {showConfirm ? (
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {confirmation && (
                  <div className={`rp-match${passwordsMatch ? " rp-match-ok" : " rp-match-fail"}`}>
                    {passwordsMatch ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Passwords match
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Passwords don't match
                      </>
                    )}
                  </div>
                )}
              </div>

              <button className="rp-btn" type="submit" disabled={loading}>
                {loading ? <span className="rp-spinner" /> : "Reset Password"}
              </button>
            </form>

            <div className="rp-back-row">
              <button className="rp-back-link" onClick={() => navigate(loginPath)}>
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
