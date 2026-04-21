import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Student/StudentDashboard.css";

const fetchDashboard = async () => {
  const res = await httpClient.get(API_ENDPOINTS.STUDENT.DASHBOARD);
  if (!res.ok) throw new Error(res.message || "Failed to load dashboard");
  return res.data;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dash = null, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: fetchDashboard,
  });

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const firstName = user?.name?.split(" ")[0] ?? "Student";

  const gwa              = dash?.gwa ?? "0.00";
  const profileIncomplete = dash?.profile_incomplete ?? false;
  const todaySchedule    = dash?.today_schedule ?? [];
  const recentAwards     = dash?.recent_awards ?? [];
  const hasViolations    = dash?.has_active_violations ?? false;
  const violationsCount  = dash?.violations_count ?? 0;
  const awardsCount      = dash?.awards_count ?? 0;
  const activitiesCount  = dash?.activities_count ?? 0;
  const subjectsCount    = dash?.enrolled_subjects_count ?? 0;

  const stats = [
    {
      label: "My GWA",
      value: gwa,
      delta: "Academic",
      deltaClass: "positive",
      fill: gwa && gwa !== "0.00" ? `${Math.min((parseFloat(gwa) / 4) * 100, 100)}%` : "0%",
      iconBg: "#f5f3ff",
      iconColor: "#8b5cf6",
      route: "/student/profile",
      iconPath: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
      label: "Subjects",
      value: subjectsCount.toString(),
      delta: "Enrolled",
      deltaClass: "positive",
      fill: subjectsCount ? "70%" : "0%",
      iconBg: "#eff6ff",
      iconColor: "#3b82f6",
      route: "/student/schedule",
      iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h6M6 9h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    },
    {
      label: "Awards",
      value: awardsCount.toString(),
      delta: "This year",
      deltaClass: "positive",
      fill: awardsCount ? "60%" : "0%",
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
      route: "/student/awards",
      iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
      label: "Violations",
      value: violationsCount.toString(),
      delta: hasViolations ? "Action Needed" : "Clear",
      deltaClass: hasViolations ? "negative" : "positive",
      fill: hasViolations ? "100%" : "0%",
      iconBg: "#f0fdf4",
      iconColor: "#10b981",
      route: "/student/violations",
      iconPath: '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M6 9l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    {
      label: "Activities",
      value: activitiesCount.toString(),
      delta: "Non-academic",
      deltaClass: "neutral",
      fill: activitiesCount ? "50%" : "0%",
      iconBg: "#fff5ef",
      iconColor: "#FF6B1A",
      route: "/student/activities",
      iconPath: '<circle cx="9" cy="5" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M2 16c0-4 3-6 7-6s7 2 7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    },
  ];

  return (
    <div className="sd-dashboard-home">

      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <div className="sd-hero-banner">
        <div className="sd-ambient sd-ambient-1"></div>
        <div className="sd-ambient sd-ambient-2"></div>
        <div className="sd-ambient sd-ambient-3"></div>

        <div className="sd-hero-body">
          {/* LEFT */}
          <div className="sd-hero-left">
            <div className="sd-hero-meta">
              <span className="sd-meta-dot"></span>
              <span>
                {dash?.program_code ? `${dash.program_code} · ` : ""}
                {dash?.section_name ?? ""}
              </span>
            </div>
            <h1 className="sd-hero-heading">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
              <span className="sd-hero-name">{firstName}</span>
            </h1>
            <div className="sd-hero-chips">
              <span className="sd-hero-chip">
                <svg viewBox="0 0 16 16" fill="none" style={{ width: "12px", height: "12px" }}>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {isLoading ? "—" : `${todaySchedule.length} class${todaySchedule.length !== 1 ? "es" : ""} today`}
              </span>
            </div>
            <div className="sd-hero-actions">
              <Link to="/student/schedule" className="sd-btn-primary">
                <svg viewBox="0 0 16 16" fill="none" style={{ width: "14px", height: "14px" }}>
                  <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 1v3M11 1v3M1.5 6.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                View Schedule
              </Link>
              <Link to="/student/curriculum" className="sd-btn-ghost">
                <svg viewBox="0 0 16 16" fill="none" style={{ width: "13px", height: "13px" }}>
                  <path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                My Curriculum
              </Link>
            </div>
          </div>

          {/* RIGHT: KPI Tiles */}
          <div className="sd-hero-right">
            <div className="sd-kpi-tile">
              <div className="sd-kpi-tile-header">
                <svg viewBox="0 0 18 18" fill="none" className="sd-kpi-icon">
                  <path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sd-kpi-eyebrow">Current GWA</span>
              </div>
              <span className="sd-kpi-val">{isLoading ? "—" : gwa}</span>
              <span className="sd-kpi-foot">This semester</span>
            </div>

            <div className="sd-kpi-tile sd-kpi-accent">
              <div className="sd-kpi-tile-header">
                <svg viewBox="0 0 18 18" fill="none" className="sd-kpi-icon">
                  <circle cx="9" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2 16c0-4 3-6 7-6s7 2 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className="sd-kpi-eyebrow">Activities</span>
              </div>
              <span className="sd-kpi-val">{isLoading ? "—" : activitiesCount}</span>
              <span className="sd-kpi-foot">Non-academic</span>
              <div className="sd-kpi-ring">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="19" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                  <circle cx="24" cy="24" r="19" stroke="rgba(255,255,255,0.8)" strokeWidth="5"
                    strokeDasharray="119.4"
                    strokeDashoffset={activitiesCount > 0 ? Math.max(10, 119.4 - (activitiesCount * 10)) : 119.4}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ PROFILE NUDGE ═══════════════ */}
      {!isLoading && profileIncomplete && (
        <div className="sd-profile-nudge">
          <div className="sd-nudge-bar-right"></div>
          <div className="sd-nudge-left">
            <div className="sd-nudge-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 17c0-3.5 3-5.5 7-5.5s7 2 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="sd-nudge-title">Your profile is incomplete</p>
              <p className="sd-nudge-desc">Add your contact details and address to finish registration.</p>
            </div>
          </div>
          <Link to="/student/profile" className="sd-nudge-cta">Complete Profile →</Link>
        </div>
      )}

      {/* ═══════════════ STATS STRIP ═══════════════ */}
      <div className="sd-stats-strip">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`sd-stat-chip${stat.route ? " sd-stat-chip--clickable" : ""}`}
            onClick={() => stat.route && navigate(stat.route)}
          >
            <div className="sd-sc-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
              <svg viewBox="0 0 18 18" fill="none" dangerouslySetInnerHTML={{ __html: stat.iconPath }} />
            </div>
            <div className="sd-sc-body">
              <span className="sd-sc-label">{stat.label}</span>
              <span className="sd-sc-value">{isLoading ? "—" : stat.value}</span>
            </div>
            <span className={`sd-sc-badge ${stat.deltaClass}`}>{stat.delta}</span>
            <div className="sd-sc-progress">
              <div className="sd-sc-progress-fill" style={{ width: isLoading ? "0%" : stat.fill, background: stat.iconColor }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════ BOTTOM GRID ═══════════════ */}
      <div className="sd-bottom-grid">

        {/* Today's Schedule */}
        <div className="sd-panel">
          <div className="sd-panel-header">
            <div>
              <h3 className="sd-panel-title">Today's Schedule</h3>
              <p className="sd-panel-sub">{todayLabel}</p>
            </div>
            <Link to="/student/schedule" className="sd-panel-link">View all →</Link>
          </div>
          <div className="sd-timeline">
            {isLoading ? (
              <div className="sd-empty-state"><span>Loading...</span></div>
            ) : todaySchedule.length === 0 ? (
              <div className="sd-empty-state">
                <svg viewBox="0 0 24 24" fill="none" style={{ width: "28px", height: "28px", opacity: 0.25 }}>
                  <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span>No classes today</span>
              </div>
            ) : (
              todaySchedule.map((cls, idx) => (
                <div className="sd-tl-item" key={`${cls.code}-${idx}`}>
                  <div className="sd-tl-time">
                    <span className="sd-tl-t">{cls.time}</span>
                    <span className="sd-tl-dur">{cls.duration}</span>
                  </div>
                  <div className="sd-tl-track">
                    <div className="sd-tl-node" style={{ background: cls.color }}></div>
                    {idx < todaySchedule.length - 1 && <div className="sd-tl-rail"></div>}
                  </div>
                  <div className="sd-tl-content">
                    <p className="sd-tl-subject">{cls.subject}</p>
                    <p className="sd-tl-meta">{cls.professor} · {cls.room}</p>
                    <span className="sd-tl-badge" style={{ background: cls.color + "18", color: cls.color }}>{cls.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Awards & Violations */}
        <div className="sd-panel">
          <div className="sd-panel-header">
            <div>
              <h3 className="sd-panel-title">Awards & Recognition</h3>
              <p className="sd-panel-sub">Your achievements this year</p>
            </div>
            <Link to="/student/awards" className="sd-panel-link">View all →</Link>
          </div>
          <div className="sd-awards-list">
            {isLoading ? (
              <div className="sd-empty-state"><span>Loading...</span></div>
            ) : recentAwards.length === 0 ? (
              <div className="sd-empty-state"><span>No awards yet</span></div>
            ) : (
              recentAwards.map((award) => (
                <div className="sd-award-row" key={award.id}>
                  <div className="sd-award-icon" style={{ background: award.color + "18", color: award.color }}>
                    <svg viewBox="0 0 14 14" fill="none" style={{ width: "13px", height: "13px" }}>
                      <path d="M7 1l1.5 4H13l-3.5 2.5 1.5 4L7 9.5 3.5 12l1.5-4L1 5h4.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="sd-award-body">
                    <p className="sd-award-title">{award.title}</p>
                    <p className="sd-award-sem">{award.date}</p>
                  </div>
                  <span className="sd-award-chip" style={{ background: award.color + "18", color: award.color }}>
                    {award.badge}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="sd-divider"></div>

          <div className="sd-viol-section">
            <div className="sd-viol-header">
              <span className="sd-viol-label">Violations</span>
              <Link to="/student/violations" className="sd-panel-link">See all →</Link>
            </div>
            {!isLoading && !hasViolations && (
              <div className="sd-viol-clear">
                <div className="sd-viol-check">
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: "10px", height: "10px" }}>
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>No active violations — keep it up!</span>
              </div>
            )}
            {!isLoading && hasViolations && (
              <div className="sd-viol-clear" style={{ color: "#ef4444" }}>
                <div className="sd-viol-check" style={{ background: "#fee2e2", color: "#ef4444" }}>
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: "10px", height: "10px" }}>
                    <path d="M6 3v4M6 9v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <span>{violationsCount} violation{violationsCount !== 1 ? "s" : ""} on record — action may be needed.</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links panel instead of empty chart */}
        <div className="sd-panel">
          <div className="sd-panel-header">
            <div>
              <h3 className="sd-panel-title">Quick Access</h3>
              <p className="sd-panel-sub">Jump to your most-used pages</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "4px 0" }}>
            {[
              { label: "My Profile",      sub: "Update personal info",     to: "/student/profile",      color: "#8b5cf6" },
              { label: "My Curriculum",   sub: "View program subjects",    to: "/student/curriculum",   color: "#3b82f6" },
              { label: "My Schedule",     sub: "Today's & weekly classes", to: "/student/schedule",     color: "#10b981" },
              { label: "Awards",          sub: "Achievements & recognition",to: "/student/awards",      color: "#f59e0b" },
              { label: "Affiliations",    sub: "Organizations & clubs",    to: "/student/affiliations", color: "#ff6b1a" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "10px",
                  border: "1.5px solid #f0e8e0", background: "#fff",
                  transition: "border-color 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = item.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#f0e8e0"}
                >
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: item.color + "18", color: item.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a0a00" }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#9a8070" }}>{item.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
