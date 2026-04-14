import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList, Legend,
} from "recharts";
import { analyticsService } from "../../services";
import "../../styles/Chair/DepartmentChairPerformance.css";

/* ── Tooltips ── */
const GwaTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{label}</p>
      <p className="chart-tip-val">Avg GWA: <strong>{payload[0].value}</strong></p>
    </div>
  );
};

const ProgramTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{label}</p>
      <p className="chart-tip-val">Avg GWA: <strong>{payload[0].value}</strong></p>
      <p className="chart-tip-sub">{payload[0].payload.students} students</p>
    </div>
  );
};

const YearTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="chart-tip-val" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const ViolationTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{label}</p>
      <p className="chart-tip-val">Count: <strong>{payload[0].value}</strong></p>
    </div>
  );
};

export default function DepartmentChairPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ["academic-performance"],
    queryFn: async () => {
      const res = await analyticsService.getAcademicPerformance();
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
  const topStudents  = useMemo(() => data?.top_students        ?? [], [data]);
  const riskVsHonors = useMemo(() => data?.risk_vs_honors      ?? [], [data]);

  if (isLoading) {
    return (
      <div className="page">
        <div className="perf-loading">
          <div className="spinner-lg" />
          <p>Loading department reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Department Reports</h2>
          <p className="page-sub">Academic performance, enrollment, and behavioral metrics for your department.</p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="summary-grid">
        {summary.map((s, i) => (
          <div className="summary-card" key={i}>
            <span className="s-label">{s.label}</span>
            <span className="s-value" style={{ color: s.color }}>{s.value}</span>
            <span className="s-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Row 1: GWA Trend + GWA by Program ── */}
      <div className="charts-row">
        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>GWA Trend</h3>
            <span className="pcard-sub">Department average GWA per semester</span>
          </div>
          <div className="pcard-body">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                <XAxis dataKey="sem" tick={{ fontSize: 11, fill: "#b89f90" }} />
                <YAxis domain={[1.5, 3.0]} reversed tick={{ fontSize: 11, fill: "#b89f90" }} tickCount={7} />
                <Tooltip content={<GwaTrendTooltip />} />
                <Line type="monotone" dataKey="gwa" stroke="#FF6B1A" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#FF6B1A", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>GWA by Program</h3>
            <span className="pcard-sub">Average GWA per program</span>
          </div>
          <div className="pcard-body">
            {byProgram.length === 0 ? <p className="perf-empty">No program data yet.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byProgram} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" horizontal={false} />
                  <XAxis type="number" domain={[1.0, 3.0]} tick={{ fontSize: 11, fill: "#b89f90" }} tickCount={5} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#1a0a00", fontWeight: 600 }} width={50} />
                  <Tooltip content={<ProgramTooltip />} />
                  <Bar dataKey="gwa" radius={[0, 6, 6, 0]} barSize={28}>
                    {byProgram.map((c, i) => <Cell key={i} fill={c.color} />)}
                    <LabelList dataKey="gwa" position="right" style={{ fontSize: 12, fontWeight: 700, fill: "#1a0a00" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Students by Year Level + Violations by Severity ── */}
      <div className="charts-row">
        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>Enrollment by Year Level</h3>
            <span className="pcard-sub">Number of students per year</span>
          </div>
          <div className="pcard-body">
            {byYear.length === 0 ? <p className="perf-empty">No enrollment data yet.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byYear} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#b89f90" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
                  <Tooltip content={<YearTooltip />} />
                  <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]} barSize={40} fill="#3b82f6">
                    <LabelList dataKey="students" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#1a0a00" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>Violations by Severity</h3>
            <span className="pcard-sub">Behavioral incidents in your department</span>
          </div>
          <div className="pcard-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={violations} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                <XAxis dataKey="severity" tick={{ fontSize: 11, fill: "#b89f90" }} />
                <YAxis tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
                <Tooltip content={<ViolationTooltip />} />
                <Bar dataKey="count" name="Violations" radius={[6, 6, 0, 0]} barSize={50}>
                  {violations.map((v, i) => <Cell key={i} fill={v.color} />)}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#1a0a00" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: At-Risk vs Dean's List by Year + GWA Distribution ── */}
      <div className="charts-row">
        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>At-Risk vs Dean's List</h3>
            <span className="pcard-sub">By year level</span>
          </div>
          <div className="pcard-body">
            {riskVsHonors.length === 0 ? <p className="perf-empty">No data yet.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={riskVsHonors} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#b89f90" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#b89f90" }} allowDecimals={false} />
                  <Tooltip content={<YearTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="deans_list" name="Dean's List" fill="#065f46" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="at_risk"    name="At Risk"     fill="#b91c1c" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>GWA Distribution</h3>
            <span className="pcard-sub">{data?.total_with_gwa ?? 0} students with GWA recorded</span>
          </div>
          <div className="pcard-body">
            <div className="distribution-list">
              {dist.map((d, i) => (
                <div className="dist-item" key={i}>
                  <div className="dist-item-meta">
                    <span className="dist-item-range">{d.range}</span>
                    <span className="dist-item-desc">{d.desc}</span>
                  </div>
                  <div className="dist-item-bar-wrap">
                    <div className="dist-item-bar">
                      <div className="dist-item-fill" style={{ width: d.pct + "%", background: d.color }} />
                    </div>
                  </div>
                  <div className="dist-item-stats">
                    <span style={{ color: d.color, fontWeight: 700 }}>{d.count}</span>
                    <span className="dist-item-pct">{d.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 5 Students ── */}
      <div className="pcard">
        <div className="pcard-header">
          <h3>Top Students</h3>
          <span className="pcard-sub">Highest academic performers in your department</span>
        </div>
        <div className="pcard-body">
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

    </div>
  );
}
