import { useNavigate } from "react-router-dom";
import { useDeanAnalytics } from "../../hooks/useDeanAnalytics";
import { useAuth } from "../../context/AuthContext";
import "../../styles/DeanDashboard.css";

export default function DeanDashboard() {
  const navigate = useNavigate();
  const { role, getRoleBasePath } = useAuth();
  const basePath = getRoleBasePath(role);
  const {
    greeting,
    academicYear,
    semester,
    chartData,
    topStudents,
    deanViolations,
    pendingApprovalsCount,
    activeViolationsCount,
    stats,
    loading,
  } = useDeanAnalytics();

  const handleStatClick = (route) => {
    if (route) navigate(route);
  };

  if (loading) {
    return (
      <div className="dashboard-home">
        <div className="hero-banner">
          <p style={{ color: "white" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <div className="hero-banner">
        <div className="hero-bg-shape shape-1"></div>
        <div className="hero-bg-shape shape-2"></div>
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow">
              <span className="eyebrow-dot"></span>
              {academicYear} · {semester}
            </p>
            <h2 className="hero-greeting">{greeting} 👋</h2>
            <p className="hero-desc">
              You have <strong>{pendingApprovalsCount} pending approvals</strong>{" "}
              and <strong>{activeViolationsCount} student violations</strong>{" "}
              requiring attention this week.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary">
                Pending Approvals{" "}
                <span className="hero-btn-badge">{pendingApprovalsCount}</span>
              </button>
              <button className="hero-btn-ghost">Generate Report</button>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-stat-card">
              <span className="hsc-label">This Week</span>
              <span className="hsc-value">
                {activeViolationsCount + pendingApprovalsCount}
              </span>
              <span className="hsc-sub">Activities logged</span>
            </div>
            <div className="hero-stat-card accent">
              <span className="hsc-label">Pending</span>
              <span className="hsc-value">{pendingApprovalsCount}</span>
              <span className="hsc-sub">Awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`stat-card ${stat.route ? "clickable" : ""}`}
            onClick={() => handleStatClick(stat.route)}
          >
            <div className="stat-top">
              <span className="stat-label">{stat.label}</span>
              <div
                className="stat-icon"
                style={{ background: stat.iconBg, color: stat.iconColor }}
              >
                <svg
                  viewBox="0 0 18 18"
                  fill="none"
                  dangerouslySetInnerHTML={{ __html: stat.iconPath }}
                />
              </div>
            </div>
            <div className="stat-bottom">
              <span className="stat-value">{stat.value}</span>
              <span className={`stat-delta ${stat.deltaClass}`}>
                {stat.delta}
              </span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{ width: stat.fill, background: stat.iconColor }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-grid">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Academic Performance Trends</h3>
              <p className="card-sub">Average GWA per semester</p>
            </div>
            <button className="card-link">Full report →</button>
          </div>
          <div className="chart-bars">
            {chartData.map((bar, i) => (
              <div key={i} className="chart-bar-col">
                <div className="chart-bar-wrap">
                  <div
                    className={`chart-bar-fill ${
                      i === chartData.length - 1 ? "current" : ""
                    }`}
                    style={{ height: bar.pct + "%" }}
                  >
                    <span className="chart-tooltip">
                      {bar.sem}: {bar.gwa}
                    </span>
                  </div>
                </div>
                <span className="chart-bar-label">{bar.sem}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-dot current"></span>
            <span className="legend-text">Current sem</span>
            <span className="legend-dot"></span>
            <span className="legend-text">Previous</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Performing Students</h3>
              <p className="card-sub">Ranked by GWA · current semester</p>
            </div>
            <button className="card-link">View all →</button>
          </div>
          <div className="student-list">
            {topStudents.length > 0 ? (
              topStudents.map((s, i) => (
                <div key={i} className="student-row">
                  <span className="rank">{i + 1}</span>
                  <div
                    className="student-avatar"
                    style={{ background: s.color }}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div className="student-info">
                    <p className="student-name">{s.name}</p>
                    <p className="student-course">{s.course}</p>
                  </div>
                  <span className={`student-tag ${s.tagClass}`}>{s.tag}</span>
                  <span className="student-gwa">{s.gwa}</span>
                </div>
              ))
            ) : (
              <div className="empty-state-msg">
                No top performing students recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Student Violations</h3>
              <p className="card-sub">Active cases this semester</p>
            </div>
            <button className="card-link">View all →</button>
          </div>
          <div className="violation-list">
            {deanViolations.length > 0 ? (
              deanViolations.map((v, i) => (
                <div key={i} className="violation-row">
                  <div
                    className="violation-avatar"
                    style={{ background: v.color }}
                  >
                    {v.name.charAt(0)}
                  </div>
                  <div className="violation-info">
                    <p className="violation-name">{v.name}</p>
                    <p className="violation-type">{v.type}</p>
                  </div>
                  <span className={`violation-badge ${v.severityClass}`}>
                    {v.severity}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state-msg">
                No active student violations.
              </div>
            )}
          </div>
          {activeViolationsCount > 2 && (
            <div className="violation-alert">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 5v4M8 11.5v.5M2.5 14h11a1 1 0 00.87-1.5l-5.5-9.5a1 1 0 00-1.74 0l-5.5 9.5A1 1 0 002.5 14z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{activeViolationsCount - 2} more cases need review</span>
              <button onClick={() => navigate(`${basePath}/reports`)}>
                Review Now →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}