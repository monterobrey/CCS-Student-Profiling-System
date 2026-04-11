import React, { useState } from "react";
import axios from "axios";
import "../../styles/Dean/ProfilingReport.css";

function ProfilingReport() {

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportData, setReportData] = useState([]);

  const [filters, setFilters] = useState({
    skill_name: "",
    award_name: "",
    academic_activity: "",
    organization: "",
    year_level: "",
    gwa_min: "",
    gwa_max: ""
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const generateReport = async () => {

    setLoading(true);
    setHasSearched(true);

    try {

      const response = await axios.get(
        "/profiling/report",
        { params: filters }
      );

      setReportData(response.data);

    } catch (err) {

      console.error("Failed to generate report:", err);
      alert("Error generating report.");

    } finally {

      setLoading(false);

    }
  };

  const resetFilters = () => {

    setFilters({
      skill_name: "",
      award_name: "",
      academic_activity: "",
      organization: "",
      year_level: "",
      gwa_min: "",
      gwa_max: ""
    });

    setReportData([]);
    setHasSearched(false);
  };

  const getGwaClass = (gwa) => {

    if (gwa === "N/A") return "";

    const val = parseFloat(gwa);

    if (val <= 1.5) return "gwa-excellent";
    if (val <= 2.0) return "gwa-good";
    if (val <= 3.0) return "gwa-fair";

    return "gwa-poor";
  };

  const exportToCSV = () => {

    if (!reportData.length) return;

    const headers = [
      "Full Name",
      "Program",
      "Year",
      "Section",
      "GWA",
      "Skills",
      "Awards",
      "Organizations"
    ];

    const rows = reportData.map(s => [
      s.full_name,
      s.program,
      s.year_level,
      s.section,
      s.gwa,
      s.matched_skills.join("; "),
      s.relevant_awards.join("; "),
      s.org_memberships.join("; ")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r =>
        r.map(field => `"${field}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `profiling_report_${new Date()
        .toISOString()
        .split("T")[0]}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (

    <div className="report-page">

      {/* HEADER */}

      <div className="page-header">

        <div className="header-left">

          <h2 className="page-title">
            Profiling Report Engine
          </h2>

          <p className="page-sub">
            Generate qualified-student reports by filtering across multiple academic and extracurricular criteria.
          </p>

        </div>

        {reportData.length > 0 && (

          <div className="header-right">

            <button
              className="export-btn"
              onClick={exportToCSV}
            >

              Export CSV

            </button>

          </div>

        )}

      </div>

      {/* FILTER CARD */}

      <div className="filter-card pcard">

        <div className="pcard-header">
          <h3>Report Configuration</h3>
        </div>

        <div className="pcard-body">

          <div className="filter-grid">

            {/* Academic */}

            <div className="filter-group-box">

              <p className="group-label">
                Academic Background
              </p>

              <div className="group-content">

                <div className="form-group">

                  <label>Year Level</label>

                  <select
                    name="year_level"
                    value={filters.year_level}
                    onChange={handleChange}
                  >

                    <option value="">
                      All Years
                    </option>

                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>

                  </select>

                </div>

                <div className="form-group">

                  <label>GWA Range</label>

                  <div className="dual-input">

                    <input
                      name="gwa_min"
                      type="number"
                      placeholder="Min"
                      value={filters.gwa_min}
                      onChange={handleChange}
                    />

                    <span className="to-separator">
                      to
                    </span>

                    <input
                      name="gwa_max"
                      type="number"
                      placeholder="Max"
                      value={filters.gwa_max}
                      onChange={handleChange}
                    />

                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="filter-actions">

            <button
              className="primary-btn"
              onClick={generateReport}
              disabled={loading}
            >

              {loading
                ? "Generating Report..."
                : "Generate Report"}

            </button>

            <button
              className="ghost-btn"
              onClick={resetFilters}
            >

              Reset Filters

            </button>

          </div>

        </div>

      </div>

    </div>

  );
}

export default ProfilingReport;