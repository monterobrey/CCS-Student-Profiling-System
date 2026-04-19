import { useState } from "react";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Auth/ForgotPasswordModal.css";

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");
  const [focused, setFocused]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }

    setLoading(true);
    try {
      const res = await httpClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: email.trim() });
      // Always show success (backend never reveals if email exists)
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-overlay" onClick={onClose}>
      <div className="fp-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="fp-header">
          <div className="fp-icon">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <button className="fp-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="fp-success">
            <div className="fp-success-icon">
              <svg viewBox="0 0 24 24" fill="none" width="40" height="40" stroke="currentColor" strokeWidth="1.6">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Check your email</h3>
            <p>
              If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
              Check your inbox (and spam folder).
            </p>
            <button className="fp-btn-primary" onClick={onClose}>Got it</button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="fp-body">
              <h3>Forgot your password?</h3>
              <p>Enter your email address and we'll send you a link to reset your password.</p>

              <form onSubmit={handleSubmit} className="fp-form">
                <div className="fp-field">
                  <label>Email Address</label>
                  <div className={`fp-inp-wrap${focused ? " fp-focused" : ""}${error ? " fp-inp-error" : ""}`}>
                    <span className="fp-inp-ico">
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      placeholder="you@school.edu.ph"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      autoFocus
                      required
                    />
                  </div>
                  {error && (
                    <div className="fp-error">
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                      </svg>
                      {error}
                    </div>
                  )}
                </div>

                <button className="fp-btn-primary" type="submit" disabled={loading}>
                  {loading ? <span className="fp-spinner" /> : "Send Reset Link"}
                </button>
              </form>
            </div>

            <div className="fp-footer">
              <button className="fp-back" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
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
