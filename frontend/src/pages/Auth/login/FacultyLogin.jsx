import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services";
import "../../../styles/FacultyLogin.css";

export default function FacultyLogin() {
  const navigate = useNavigate();
  const { login, getDefaultRouteForRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authService.login(email, password, "faculty_portal");

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
    <div className="login-page">
      <div className="shell">

        {/* LEFT FORM */}
        <div className="left-form">
          <div className="form-wrap">
            <div className={`form-accent-bar ${loading ? "loading" : ""}`} />

            <h2 className="form-title">
              Faculty <span>Login</span>
            </h2>

            <p className="form-sub">
              Sign in to access your dashboard and records
            </p>

            <form onSubmit={handleLogin} className="login-form">

              <div className="field">
                <div className="field-label-row">
                  <label className="field-label">Email Address</label>
                </div>
                <div className={`inp-wrap ${emailFocused ? "focused" : ""}`}>
                  <span className="inp-ico">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>

                  <input
                    type="text"
                    value={email}
                    placeholder="you@department.edu"
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
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
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                  />

                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
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
                  <button type="button" className="forgot">Forgot password?</button>
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
              <div className="divider-line" />
              <span className="divider-text">Faculty Portal</span>
              <div className="divider-line" />
            </div>

            <div className="secure-row">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p>Department Information System — Unified Faculty Access.</p>
            </div>
          </div>
        </div>

        {/* RIGHT HERO */}
        <div className="right-hero">
          <div className="hero-bg">
            <img src="/assets/school-building.jpg" alt="University Building" />
            <div className="hero-overlay" />
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
              <span>Faculty Portal</span>
            </h1>
            <p className="hero-desc">
              Dedicated platform for CCS faculty members to manage student profiles, 
              monitor academic performance, and streamline departmental administrative tasks.
            </p>
          </div>

          <p className="foot-note">© 2026 University of Cabuyao — College of Computing Studies</p>
        </div>

      </div>
    </div>
  );
}