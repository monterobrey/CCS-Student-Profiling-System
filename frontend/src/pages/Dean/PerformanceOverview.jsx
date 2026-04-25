import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList, Legend,
} from "recharts";
import { analyticsService } from "../../services";
import "../../styles/Dean/PerformanceOverview.css";

/* ── Tooltips ── */
const GwaTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{label}</p>
      <p className="chart-tip-val">Avg GWA: <strong>{payload[0].value}</strong></p>
    </div>
  );
};

const BarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  // Use full 'name' from data if available (orgs have short_name on axis but full name in data)
  const fullLabel = payload[0]?.payload?.name ?? label;
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{fullLabel}</p>
      {payload.map((p, i) => (
        <p key={i} className="chart-tip-val">{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function PerformanceOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["dean-report"],
    queryFn: async () => {
      const res = await analyticsService.getDeanReport();
      return res.ok ? res.data : null;
    },
    staleTime: Infinity,
  });

  const summary      = useMemo(() => data?.summary             ?? [], [data]);
  const chartData    = useMemo(() => data?.chart_data          ?? [], [data]);
  const byProgram    = useMemo(() => data?.by_program          ?? [], [data]);
  const byYear       = useMemo(() => data?.by_year_level       ?? [], [data]);
  const dist         = useMemo(() => data?.distribution        ?? [], [data]);
  const violations   = useMemo(() => data?.violations_severity ?? [], [data]);
  const topOrgs      = useMemo(() => data?.top_orgs            ?? [], [data]);
  const topSkillCats = useMemo(() => data?.top_skill_categories ?? [], [data]);
  const topSkills    = useMemo(() => data?.top_skills          ?? [], [data]);
  const topStudents  = useMemo(() => data?.top_students        ?? [], [data]);
  const riskVsHonors = useMemo(() => data?.risk_vs_honors      ?? [], [data]);

  if (isLoading) {
    return (
      <div className="performance-page">
        <div className="perf-loading">
          <div className="spinner-lg" />
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-page">
      <div className="page-header">
        <div className="header-left">
          <h2 className="section-title">Reports Overview</h2>
          <p className="section-desc">Department-wide academic performance, enrollment, skills, and organizational data.</p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="summary-grid">
        {summary.map((s, i) => (
          <div className="summary-card" key={i}>
            <span className="summary-label">{s.label}</span>
            <div className="summary-main">
              <span className="summary-value" style={{ color: s.color }}>{s.value}</span>
            </div>
            <span className="summary-unit">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Row 1: GWA Trend + GWA by Program ── */}
      <div className="perf-row">
        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">GWA Trend</h3>
            <p className="card-sub">Department average GWA per semester</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
              <XAxis dataKey="sem" tick={{ fontSize: 11, fill: "#b89f90" }} />
              <YAxis domain={[1.5, 3.0]} reversed tick={{ fontSize: 11, fill: "#b89f90" }} tickCount={7} />
              <Tooltip content={<GwaTip />} />
              <Line type="monotone" dataKey="gwa" stroke="#FF6B1A" strokeWidth={2.5}
                dot={{ r: 4, fill: "#FF6B1A", strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">GWA by Program</h3>
            <p className="card-sub">Average GWA per program</p>
          </div>
          {byProgram.length === 0 ? <p className="perf-empty">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byProgram} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" horizontal={false} />
                <XAxis type="number" domain={[1.0, 3.0]} tick={{ fontSize: 11, fill: "#b89f90" }} tickCount={5} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#1a0a00", fontWeight: 600 }} width={50} />
                <Tooltip content={<BarTip />} />
                <Bar dataKey="gwa" name="Avg GWA" radius={[0, 6, 6, 0]} barSize={28}>
                  {byProgram.map((c, i) => <Cell key={i} fill={c.color} />)}
                  <LabelList dataKey="gwa" position="right" style={{ fontSize: 12, fontWeight: 700, fill: "#1a0a00" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 2: Enrollment by Year + Violations ── */}
      <div className="perf-row">
        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">Enrollment by Year Level</h3>
            <p className="card-sub">Number of students per year</p>
          </div>
          {byYear.length === 0 ? <p className="perf-empty">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byYear} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#b89f90" }} />
                <YAxis tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
                <Tooltip content={<BarTip />} />
                <Bar dataKey="students" name="Students" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                  <LabelList dataKey="students" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#1a0a00" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">Violations by Severity</h3>
            <p className="card-sub">All recorded behavioral incidents</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={violations} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
              <XAxis dataKey="severity" tick={{ fontSize: 11, fill: "#b89f90" }} />
              <YAxis tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
              <Tooltip content={<BarTip />} />
              <Bar dataKey="count" name="Violations" radius={[6, 6, 0, 0]} barSize={50}>
                {violations.map((v, i) => <Cell key={i} fill={v.color} />)}
                <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#1a0a00" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Top Orgs + Skill Categories ── */}
      <div className="perf-row">
        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">Top 5 Organizations</h3>
            <p className="card-sub">Most joined student organizations</p>
          </div>
          {topOrgs.length === 0 ? <p className="perf-empty">No organization data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topOrgs} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
                <YAxis type="category" dataKey="short_name" tick={{ fontSize: 11, fill: "#1a0a00" }} width={160} />
                <Tooltip content={<BarTip />} />
                <Bar dataKey="members" name="Members" radius={[0, 6, 6, 0]} barSize={22}>
                  {topOrgs.map((o, i) => <Cell key={i} fill={o.color} />)}
                  <LabelList dataKey="members" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#1a0a00" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">Top Skill Categories</h3>
            <p className="card-sub">Most common skill areas across students</p>
          </div>
          {topSkillCats.length === 0 ? <p className="perf-empty">No skill data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSkillCats} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#1a0a00" }} width={110} />
                <Tooltip content={<BarTip />} />
                <Bar dataKey="count" name="Students" radius={[0, 6, 6, 0]} barSize={22}>
                  {topSkillCats.map((s, i) => <Cell key={i} fill={s.color} />)}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#1a0a00" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 4: At-Risk vs Dean's List + GWA Distribution ── */}
      <div className="perf-row">
        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">At-Risk vs Dean's List</h3>
            <p className="card-sub">By year level</p>
          </div>
          {riskVsHonors.length === 0 ? <p className="perf-empty">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskVsHonors} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#b89f90" }} />
                <YAxis tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
                <Tooltip content={<BarTip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="deans_list" name="Dean's List" fill="#065f46" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="at_risk"    name="At Risk"     fill="#b91c1c" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="perf-card">
          <div className="card-header">
            <h3 className="card-title">GWA Distribution</h3>
            <p className="card-sub">{data?.total_with_gwa ?? 0} students with GWA recorded</p>
          </div>
          <div className="dist-list">
            {dist.map((d, i) => (
              <div className="dist-row" key={i}>
                <div className="dist-label-wrap">
                  <span className="dist-range">{d.range}</span>
                  <span className="dist-desc">{d.desc}</span>
                </div>
                <div className="dist-bar-wrap">
                  <div className="dist-bar">
                    <div className="dist-fill" style={{ width: d.pct + "%", background: d.color }} />
                  </div>
                  <span className="dist-stats"><strong>{d.count}</strong> ({d.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top 5 Students ── */}
      <div className="perf-card perf-card-full">
        <div className="card-header">
          <h3 className="card-title">Top Students</h3>
          <p className="card-sub">Highest academic performers department-wide</p>
        </div>
        {topStudents.length === 0 ? <p className="perf-empty">No GWA data recorded yet.</p> : (
          <div className="top-students-list">
            {topStudents.map((s, i) => (
              <div className="top-student-row" key={i}>
                <div className="top-rank">{i + 1}</div>
                <div className="top-avatar" style={{ background: s.color }}>{s.name.charAt(0)}</div>
                <div className="top-info">
                  <p className="top-name">{s.name}</p>
                  <p className="top-program">{s.program}</p>
                </div>
                <span className="top-gwa">{s.gwa}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
