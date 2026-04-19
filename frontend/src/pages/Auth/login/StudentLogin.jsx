import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services";
import ForgotPasswordModal from "../ForgotPasswordModal";
import "../../../styles/Student/StudentLogin.css";

const Login = () => {
  const navigate = useNavigate();
  const { login, getDefaultRouteForRole } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idFocused, setIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!studentId || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (studentId.includes("@")) {
      setError("Invalid credentials");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(studentId, password, "student");

      if (!result?.ok || !result?.token || !result?.user) {
        setError(result?.message || "Invalid credentials");
        return;
      }

      login(result.user, result.token);
      navigate(getDefaultRouteForRole(result.user.role), { replace: true });
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sl-page">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <div className="sl-shell">

        {/* LEFT PANEL - HERO */}
        <div className="sl-hero-panel">
          <div className="sl-hero-bg">
            <img src="/students.jpg" alt="Students" />
            <div className="sl-hero-overlay"></div>
          </div>

          <div className="sl-floating-icons">
            {[1,2,3,4,5].map(n => (
              <span key={n} className={`sl-ico sl-ico-${n}`}></span>
            ))}
          </div>

          <div className="sl-brand">
            <div className="sl-brand-text">
              <div className="sl-brand-name">CCS Student Portal</div>
              <div className="sl-brand-sub">University of Cabuyao</div>
            </div>
            <div className="sl-brand-logos">
              <div className="sl-brand-logo">
                <img src="/assets/pnc-logo.png" alt="University Logo" />
              </div>
              <div className="sl-brand-logo">
                <img src="/assets/ccs-logo.jpg" alt="CCS Logo" />
              </div>
            </div>
          </div>

          <div className="sl-hero-content">
            <h1 className="sl-hero-title">
              <span>College of</span>
              <span className="sl-accent">Computing Studies</span>
              <span>Student Portal</span>
            </h1>
            <p className="sl-hero-desc">
              Access your academic records, schedules, and departmental updates.
            </p>
          </div>

          <p className="sl-footer">© 2026 University of Cabuyao — College of Computing Studies</p>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="sl-form-panel">
          <div className="sl-form-wrap">
            <div className={`sl-accent-bar ${loading ? "sl-loading" : ""}`}></div>
            <h2 className="sl-form-title">Student <span>Login</span></h2>
            <p className="sl-form-sub">Sign in to access your academic portal</p>

            <form onSubmit={handleLogin} className="sl-form">

              <div className="sl-field">
                <div className="sl-field-label-row">
                  <label className="sl-field-label">Student Number</label>
                </div>
                <div className={`sl-inp-wrap ${idFocused ? "sl-focused" : ""}`}>
                  <span className="sl-inp-ico">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 2026xxxx"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onFocus={() => setIdFocused(true)}
                    onBlur={() => setIdFocused(false)}
                    required
                  />
                </div>
              </div>

              <div className="sl-field">
                <div className="sl-field-label-row">
                  <label className="sl-field-label">Password</label>
                </div>
                <div className={`sl-inp-wrap ${passwordFocused ? "sl-focused" : ""}`}>
                  <span className="sl-inp-ico">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                  />
                  <button type="button" className="sl-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="sl-field-footer">
                  <button type="button" className="sl-forgot" onClick={() => setShowForgot(true)}>Forgot password?</button>
                </div>
              </div>

              {error && (
                <div className="sl-error">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button className="sl-btn-submit" type="submit" disabled={loading}>
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <span>Sign In <span className="sl-arrow">→</span></span>
                )}
              </button>

            </form>

            <div className="sl-divider">
              <div className="sl-divider-line"></div>
              <span className="sl-divider-text">Secured Access</span>
              <div className="sl-divider-line"></div>
            </div>

            <div className="sl-secure-row">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p>Protected by end-to-end encryption. For CCS students only.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;