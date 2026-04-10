import React, { useState } from "react";
import "../../../styles/StudentLogin.css";

const Login = () => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [idFocused, setIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = (e) => {
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

    setTimeout(() => {
      setLoading(false);
      alert("Login successful (frontend only)");
    }, 1200);
  };

  return (
    <div className="login-page">
      <div className="shell">

        {/* LEFT PANEL - FORM (480px) */}
        <div className="left">
          <div className="form-wrap">
            <div className={`form-accent-bar ${loading ? "loading" : ""}`}></div>
            <h2 className="form-title">Student <span>Login</span></h2>
            <p className="form-sub">Sign in to access your academic portal</p>

            <form onSubmit={handleLogin} className="login-form">

              <div className="field">
                <div className="field-label-row">
                  <label className="field-label">Student Number</label>
                </div>
                <div className={`inp-wrap ${idFocused ? "focused" : ""}`}>
                  <span className="inp-ico">
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

              <div className="field">
                <div className="field-label-row">
                  <label className="field-label">Password</label>
                </div>
                <div className={`inp-wrap ${passwordFocused ? "focused" : ""}`}>
                  <span className="inp-ico">
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
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
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
                <div className="field-footer">
                  <a href="#" className="forgot">Forgot password?</a>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <span>Sign In <span className="b-arrow">→</span></span>
                )}
              </button>

            </form>

            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">Secured Access</span>
              <div className="divider-line"></div>
            </div>

            <div className="secure-row">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p>Protected by end-to-end encryption. For CCS students only.</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - HERO (1fr) */}
        <div className="right">
          <div className="hero-bg">
            <img src="/students.jpg" alt="Students" />
            <div className="hero-overlay"></div>
          </div>

          <div className="floating-icons">
            {[1,2,3,4,5].map(n => (
              <span key={n} className={`ico ico-${n}`}></span>
            ))}
          </div>

          <div className="brand">
            <div className="text-right">
              <div className="brand-name">CCS Faculty Portal</div>
              <div className="brand-sub">University of Cabuyao</div>
            </div>
            <div className="brand-logos">
              <div className="brand-logo pnc">
                <img src="/assets/pnc-logo.png" alt="University Logo" />
              </div>
              <div className="brand-logo ccs">
                <img src="/assets/ccs-logo.jpg" alt="CCS Logo" />
              </div>
            </div>
          </div>

          <div className="hero">
            <h1 className="hero-title">
              <span>College of</span>
              <span className="accent">Computing Studies</span>
              <span>Student Portal</span>
            </h1>
            <p className="hero-desc">
              Access your academic records, schedules, and departmental updates.
            </p>
          </div>

          <p className="right-foot">© 2026 University of Cabuyao — College of Computing Studies</p>
        </div>

      </div>
    </div>
  );
};

export default Login;