import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from "recharts";
import { analyticsService } from "../../services";
import "../../styles/Chair/DepartmentChairPerformance.css";

/* ── Custom tooltip for the line chart ── */
const GwaTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <p className="chart-tip-label">{label}</p>
      <p className="chart-tip-val">Avg GWA: <strong>{payload[0].value}</strong></p>
    </div>
  );
};

/* ── Custom tooltip for the bar chart ── */
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

export default function DepartmentChairPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ["academic-performance"],
    queryFn: async () => {
      const res = await analyticsService.getAcademicPerformance();
      return res.ok ? res.data : null;
    },
    staleTime: Infinity,
  });

  const summary   = useMemo(() => data?.summary      ?? [], [data]);
  const chartData = useMemo(() => data?.chart_data   ?? [], [data]);
  const courses   = useMemo(() => data?.courses      ?? [], [data]);
  const dist      = useMemo(() => data?.distribution ?? [], [data]);

  if (isLoading) {
    return (
      <div className="page">
        <div className="perf-loading">
          <div className="spinner-lg" />
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Academic Performance</h2>
          <p className="page-sub">Department-wide GWA trends and academic history review.</p>
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

      {/* ── Two charts side by side ── */}
      <div className="charts-row">

        {/* Line chart — GWA Trend */}
        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>Department GWA Trend</h3>
            <span className="pcard-sub">Average GWA per semester</span>
          </div>
          <div className="pcard-body">
            {chartData.length === 0 ? (
              <p className="perf-empty">No semester data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                  <XAxis dataKey="sem" tick={{ fontSize: 11, fill: "#b89f90" }} />
                  <YAxis
                    domain={[1.5, 3.0]}
                    reversed
                    tick={{ fontSize: 11, fill: "#b89f90" }}
                    tickCount={7}
                  />
                  <Tooltip content={<GwaTrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="gwa"
                    stroke="#FF6B1A"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#FF6B1A", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar chart — GWA by Program */}
        <div className="pcard chart-half">
          <div className="pcard-header">
            <h3>GWA by Program</h3>
            <span className="pcard-sub">Average GWA per program</span>
          </div>
          <div className="pcard-body">
            {courses.length === 0 ? (
              <p className="perf-empty">No program data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={courses}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[1.0, 3.0]}
                    tick={{ fontSize: 11, fill: "#b89f90" }}
                    tickCount={5}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#1a0a00", fontWeight: 600 }}
                    width={50}
                  />
                  <Tooltip content={<ProgramTooltip />} />
                  <Bar dataKey="gwa" radius={[0, 6, 6, 0]} barSize={28}>
                    {courses.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                    <LabelList dataKey="gwa" position="right" style={{ fontSize: 12, fontWeight: 700, fill: "#1a0a00" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* ── GWA Distribution ── */}
      <div className="pcard">
        <div className="pcard-header">
          <h3>GWA Distribution</h3>
          <span className="pcard-sub">{data?.total_with_gwa ?? 0} students with GWA recorded</span>
        </div>
        <div className="pcard-body">
          <div className="dist-list">
            {dist.map((d, i) => (
              <div className="dist-row" key={i}>
                <div className="dist-meta">
                  <span className="dist-range">{d.range}</span>
                  <span className="dist-desc">{d.desc}</span>
                </div>
                <div className="dist-bar-wrap">
                  <div className="dist-bar" style={{ width: d.pct + "%", background: d.color }} />
                </div>
                <div className="dist-stats">
                  <span className="dist-count" style={{ color: d.color }}>{d.count}</span>
                  <span className="dist-pct">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
