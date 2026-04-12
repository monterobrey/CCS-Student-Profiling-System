import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import "../../styles/Student/StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [studentProfile, setStudentProfile] = useState({ gwa: "0.00" });
  const [studentActivities, setStudentActivities] = useState([]);
  const [studentAwards, setStudentAwards] = useState([]);
  const [studentViolations, setStudentViolations] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [studentChartData, setStudentChartData] = useState([]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  function buildStats(s) {
    return [
      {
        label: "My GWA",
        value: s.gwa || "0.00",
        delta: "Academic",
        deltaClass: "positive",
        fill: s.gwa ? "80%" : "0%",
        iconBg: "#f5f3ff",
        iconColor: "#8b5cf6",
        route: "/student/academic-history",
        iconPath: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
      },
      {
        label: "Subjects",
        value: (s.enrolled_subjects_count || 0).toString(),
        delta: "Enrolled",
        deltaClass: "positive",
        fill: s.enrolled_subjects_count ? "70%" : "0%",
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
        route: "/student/schedule",
        iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h6M6 9h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
      },
      {
        label: "Awards",
        value: (s.awards?.length || 0).toString(),
        delta: "This year",
        deltaClass: "positive",
        fill: s.awards?.length ? "60%" : "0%",
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
        route: "/student/awards",
        iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
      },
      {
        label: "Violations",
        value: (s.violations?.length || 0).toString(),
        delta: s.violations?.length > 0 ? "Action Needed" : "Clear",
        deltaClass: s.violations?.length > 0 ? "negative" : "positive",
        fill: s.violations?.length > 0 ? "100%" : "0%",
        iconBg: "#f0fdf4",
        iconColor: "#10b981",
        route: "/student/violations",
        iconPath: '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M6 9l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
      },
      {
        label: "Activities",
        value: (s.activities?.length || 0).toString(),
        delta: "Non-academic",
        deltaClass: "neutral",
        fill: s.activities?.length ? "50%" : "0%",
        iconBg: "#fff5ef",
        iconColor: "#FF6B1A",
        route: "/student/activities",
        iconPath: '<circle cx="9" cy="5" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M2 16c0-4 3-6 7-6s7 2 7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
      },
    ];
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/student/profile");
        const s = response.data;

        setProfileIncomplete(!s.gender || !s.contact_number || !s.address);
        setStudentProfile({ ...s });
        setStudentActivities(s.activities || []);
        setStudentAwards(s.awards || []);
        setStudentViolations(s.violations || []);
        setTodaySchedule(s.today_schedule || []);
        setStudentChartData(s.chart_data || []);
        setStats(buildStats(s));
      } catch (err) {
        console.error("Failed to fetch student profile:", err);
        setStats(buildStats({}));
      }
    };

    fetchData();
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Student";

  return (
    <div className="sd-dashboard-home">

      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <div className="sd-hero-banner">
        <div className="sd-ambient sd-ambient-1"></div>
        <div className="sd-ambient sd-ambient-2"></div>
        <div className="sd-ambient sd-ambient-3"></div>

        <div className="sd-hero-body">
          {/* LEFT: Greeting & CTA */}
          <div className="sd-hero-left">
            <div className="sd-hero-meta">
              <span className="sd-meta-dot"></span>
              <span>AY 2026–2027 · 2nd Semester</span>
            </div>
            <h1 className="sd-hero-heading">
              Good morning, <span className="sd-hero-name">{firstName}</span>{" "}
              <span className="sd-wave">👋</span>
            </h1>
            <div className="sd-hero-chips">
              <span className="sd-hero-chip">
                <svg viewBox="0 0 16 16" fill="none" style={{ width: "12px", height: "12px" }}>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {todaySchedule.length} class{todaySchedule.length !== 1 ? "es" : ""} today
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
              <Link to="/student/academic-history" className="sd-btn-ghost">
                <svg viewBox="0 0 16 16" fill="none" style={{ width: "13px", height: "13px" }}>
                  <path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Academic History
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
              <span className="sd-kpi-val">{studentProfile.gwa || "0.00"}</span>
              <span className="sd-kpi-foot">This semester</span>
              <div className="sd-kpi-sparkbar">
                {studentChartData.map((b, i) => (
                  <div
                    key={i}
                    className="sd-kpi-spark-seg"
                    style={{
                      height: b.pct * 0.28 + "px",
                      opacity: i === studentChartData.length - 1 ? 1 : 0.25 + i * 0.1,
                    }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="sd-kpi-tile sd-kpi-accent">
              <div className="sd-kpi-tile-header">
                <svg viewBox="0 0 18 18" fill="none" className="sd-kpi-icon">
                  <circle cx="9" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2 16c0-4 3-6 7-6s7 2 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className="sd-kpi-eyebrow">Activities</span>
              </div>
              <span className="sd-kpi-val">{studentActivities.length}</span>
              <span className="sd-kpi-foot">Non-academic</span>
              <div className="sd-kpi-ring">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="19" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                  <circle cx="24" cy="24" r="19" stroke="rgba(255,255,255,0.8)" strokeWidth="5"
                    strokeDasharray="119.4" strokeDashoffset="40" strokeLinecap="round"
                    transform="rotate(-90 24 24)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ PROFILE NUDGE ═══════════════ */}
      {profileIncomplete && (
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
          <div className="sd-nudge-progress">
            <div className="sd-nudge-steps">
              <div className="sd-nudge-step sd-done"></div>
              <div className="sd-nudge-step sd-done"></div>
              <div className="sd-nudge-step"></div>
              <div className="sd-nudge-step"></div>
            </div>
            <span className="sd-nudge-progress-label">2 of 4 complete</span>
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
              <span className="sd-sc-value">{stat.value}</span>
            </div>
            <span className={`sd-sc-badge ${stat.deltaClass}`}>{stat.delta}</span>
            <div className="sd-sc-progress">
              <div className="sd-sc-progress-fill" style={{ width: stat.fill, background: stat.iconColor }}></div>
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
            {todaySchedule.length === 0 ? (
              <div className="sd-empty-state">
                <svg viewBox="0 0 24 24" fill="none" style={{ width: "28px", height: "28px", opacity: 0.25 }}>
                  <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span>No classes today</span>
              </div>
            ) : (
              todaySchedule.map((cls, idx) => (
                <div className="sd-tl-item" key={cls.subject}>
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
            {studentAwards.length === 0 ? (
              <div className="sd-empty-state"><span>No awards yet</span></div>
            ) : (
              studentAwards.slice(0, 3).map((award) => (
                <div className="sd-award-row" key={award.title}>
                  <div className="sd-award-icon" style={{ background: award.color + "18", color: award.color }}>
                    <svg viewBox="0 0 14 14" fill="none" style={{ width: "13px", height: "13px" }}>
                      <path d="M7 1l1.5 4H13l-3.5 2.5 1.5 4L7 9.5 3.5 12l1.5-4L1 5h4.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="sd-award-body">
                    <p className="sd-award-title">{award.title}</p>
                    <p className="sd-award-sem">{award.semester}</p>
                  </div>
                  <span className="sd-award-chip">{award.badge}</span>
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
            {studentViolations.length === 0 && (
              <div className="sd-viol-clear">
                <div className="sd-viol-check">
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: "10px", height: "10px" }}>
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>No active violations — keep it up!</span>
              </div>
            )}
          </div>
        </div>

        {/* GWA Chart */}
        <div className="sd-panel">
          <div className="sd-panel-header">
            <div>
              <h3 className="sd-panel-title">Academic Performance</h3>
              <p className="sd-panel-sub">GWA trend per semester</p>
            </div>
            <Link to="/student/academic-history" className="sd-panel-link">History →</Link>
          </div>
          <div className="sd-chart-area">
            {studentChartData.map((bar, i) => (
              <div className="sd-chart-col" key={i}>
                <div className="sd-chart-col-inner">
                  <div
                    className={`sd-chart-bar${i === studentChartData.length - 1 ? " sd-chart-bar--active" : ""}`}
                    style={{ height: bar.pct + "%" }}
                  >
                    <div className="sd-chart-tip">{bar.sem}<br /><strong>{bar.gwa}</strong></div>
                  </div>
                </div>
                <span className="sd-chart-lbl">{bar.sem}</span>
              </div>
            ))}
          </div>
          <div className="sd-chart-legend">
            <span className="sd-cl-dot sd-cl-dot--active"></span>
            <span className="sd-cl-text">Current sem</span>
            <span className="sd-cl-dot"></span>
            <span className="sd-cl-text">Previous</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;