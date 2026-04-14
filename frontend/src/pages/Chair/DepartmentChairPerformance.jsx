import { useEffect, useState } from "react";
import "../../styles/Chair/DepartmentChairPerformance.css";
import axios from "axios";

export default function DepartmentChairPerformance() {
  const [summary, setSummary] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/department/performance"
        );

        setSummary(res.data.summary);
        setChartData(res.data.chartData);
        setCourses(res.data.courses);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const yLabels = ["1.50", "1.75", "2.00", "2.25", "2.50"];

  const barH = (gwa) => Math.round(((3 - gwa) / (3 - 1.5)) * 80 + 10);

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Academic Performance</h2>
          <p className="page-sub">
            Department-wide GWA trends and academic history review.
          </p>
        </div>
      </div>

      <div className="summary-grid">
        {summary.map((s, i) => (
          <div className="summary-card" key={i}>
            <span className="s-label">{s.label}</span>
            <span className="s-value" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="s-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="pcard">
        <div className="pcard-header">
          <h3>Department GWA Trend</h3>
        </div>

        <div className="pcard-body">
          <div className="chart-area">
            <div className="chart-y">
              {yLabels.map((y, i) => (
                <span key={i}>{y}</span>
              ))}
            </div>

            <div className="chart-bars-wrap">
              {chartData.map((bar, i) => (
                <div className="chart-bar-col" key={i}>
                  <div className="chart-bar-wrap">
                    <div
                      className={`chart-bar-fill ${
                        i === chartData.length - 1 ? "current" : ""
                      }`}
                      style={{ height: barH(bar.gwa) + "%" }}
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
          </div>
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-header">
          <h3>GWA by Course</h3>
        </div>

        <div className="pcard-body">
          <div className="course-list">
            {courses.map((c, i) => (
              <div className="course-row" key={i}>
                <div className="course-info">
                  <p className="course-name">{c.name}</p>
                  <p className="course-students">{c.students} students</p>
                </div>

                <div className="course-bar-wrap">
                  <div
                    className="course-bar"
                    style={{ width: c.pct + "%", background: c.color }}
                  />
                </div>

                <span className="course-gwa" style={{ color: c.color }}>
                  {c.gwa}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}