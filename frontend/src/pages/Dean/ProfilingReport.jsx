import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profilingService } from "../../services";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Dean/ProfilingReport.css";

const EMPTY_FILTERS = {
  year_level:        "",
  program_id:        "",
  section_id:        "",
  skill_name:        "",
  skill_category:    "",
  org_id:            "",
  award_name:        "",
  gwa_min:           "",
  gwa_max:           "",
};

// Stable cache key — always the same string, not an object
const REPORT_KEY = ["profiling-report"];

export default function ProfilingReport() {
  const queryClient = useQueryClient();

  // Read last-used filters from cache so they survive navigation
  const cachedFilters = queryClient.getQueryData(["profiling-report-filters"]);

  const [filters, setFilters] = useState(cachedFilters ?? EMPTY_FILTERS);
  const [hasSearched, setHasSearched] = useState(!!cachedFilters);

  // Programs + Sections for dropdowns — reuse shared cache
  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.PROGRAMS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.SECTIONS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.ORGANIZATIONS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  // Report — stable key, only runs after first Generate click
  const { data: reportData = [], isFetching: loading } = useQuery({
    queryKey: REPORT_KEY,
    queryFn: async () => {
      // Read the filters that were active when Generate was clicked
      const activeFilters = queryClient.getQueryData(["profiling-report-filters"]) ?? EMPTY_FILTERS;
      const res = await profilingService.generateReport(activeFilters);
      return res.ok ? (res.data ?? []) : [];
    },
    enabled: hasSearched,
  });

  /* ===========================
     HANDLERS
  =========================== */

  const handleChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateReport = () => {
    setHasSearched(true);
    // Persist filters into cache so they survive navigation
    queryClient.setQueryData(["profiling-report-filters"], { ...filters });
    // Invalidate the report so it refetches with the new filters
    queryClient.invalidateQueries({ queryKey: REPORT_KEY });
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setHasSearched(false);
    queryClient.removeQueries({ queryKey: REPORT_KEY });
    queryClient.removeQueries({ queryKey: ["profiling-report-filters"] });
  };

  /* ===========================
     GWA STYLE
  =========================== */

  const getGwaClass = (gwa) => {
    if (!gwa || gwa === "N/A") return "";
    const val = parseFloat(gwa);
    if (val <= 1.5) return "gwa-excellent";
    if (val <= 2.0) return "gwa-good";
    if (val <= 3.0) return "gwa-fair";
    return "gwa-poor";
  };

  /* ===========================
     FILTERED BY GWA (client-side safety net)
     Backend now handles gwa_min/max via the stored gwa column.
     This client-side pass catches any edge cases (e.g. computed GWA
     from subjects when the stored column is null).
  =========================== */

  const appliedFilters = queryClient.getQueryData(["profiling-report-filters"]) ?? EMPTY_FILTERS;

  const displayData = reportData.filter(s => {
    const min = appliedFilters.gwa_min;
    const max = appliedFilters.gwa_max;
    if (!min && !max) return true;
    if (s.gwa === "N/A") return false;
    const val = parseFloat(s.gwa);
    if (isNaN(val)) return false;
    if (min && val < parseFloat(min)) return false;
    if (max && val > parseFloat(max)) return false;
    return true;
  });

  /* ===========================
     CSV EXPORT
  =========================== */

  const exportToCSV = () => {
    if (!displayData.length) return;

    const headers = [
      "Student Number", "Full Name", "Program", "Year Level",
      "Section", "GWA", "Skills", "Organizations",
      "Academic Activities", "Non-Academic Activities", "Awards",
    ];

    const rows = displayData.map(s => [
      s.student_number,
      s.name,
      s.program,
      s.year_level,
      s.section,
      s.gwa,
      (s.skills || []).join("; "),
      (s.organizations || []).join("; "),
      s.academic_activities ?? 0,
      s.non_academic_activities ?? 0,
      s.awards ?? 0,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `profiling_report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ===========================
     JSX
  =========================== */

  return (
    <div className="report-page">

      {/* HEADER */}
      <div className="page-header">
        <div className="header-left">
          <h2 className="page-title">Profiling Report Engine</h2>
          <p className="page-sub">
            Generate qualified-student reports by filtering across academic and extracurricular criteria.
          </p>
        </div>
        {displayData.length > 0 && (
          <div className="header-right">
            <button className="export-btn" onClick={exportToCSV}>Export CSV</button>
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

            {/* Academic Background */}
            <div className="filter-group-box">
              <p className="group-label">Academic Background</p>
              <div className="group-content">

                <div className="form-group">
                  <label>Program</label>
                  <select name="program_id" value={filters.program_id} onChange={handleChange}>
                    <option value="">All Programs</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.program_code}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Year Level</label>
                  <select name="year_level" value={filters.year_level} onChange={handleChange}>
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Section</label>
                  <select name="section_id" value={filters.section_id} onChange={handleChange}>
                    <option value="">All Sections</option>
                    {sections
                      .filter(s => !filters.program_id || s.program_id === filters.program_id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.section_name}</option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>GWA Range</label>
                  <div className="dual-input">
                    <input name="gwa_min" type="number" step="0.01" min="1" max="5" placeholder="Min (e.g. 1.0)" value={filters.gwa_min} onChange={handleChange} />
                    <span className="to-separator">to</span>
                    <input name="gwa_max" type="number" step="0.01" min="1" max="5" placeholder="Max (e.g. 3.0)" value={filters.gwa_max} onChange={handleChange} />
                  </div>
                </div>

              </div>
            </div>

            {/* Skills & Expertise */}
            <div className="filter-group-box">
              <p className="group-label">Skills & Expertise</p>
              <div className="group-content">

                <div className="form-group">
                  <label>Skill Name</label>
                  <input
                    name="skill_name"
                    type="text"
                    placeholder="e.g. Python, Web Development"
                    value={filters.skill_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Skill Category</label>
                  <input
                    name="skill_category"
                    type="text"
                    placeholder="e.g. Programming, Design"
                    value={filters.skill_category}
                    onChange={handleChange}
                  />
                </div>

              </div>
            </div>

            {/* Activities & Awards */}
            <div className="filter-group-box">
              <p className="group-label">Activities & Awards</p>
              <div className="group-content">

                <div className="form-group">
                  <label>Award Name</label>
                  <input
                    name="award_name"
                    type="text"
                    placeholder="e.g. Dean's Lister"
                    value={filters.award_name}
                    onChange={handleChange}
                  />
                </div>

              </div>
            </div>

            {/* Affiliations */}
            <div className="filter-group-box">
              <p className="group-label">Affiliations</p>
              <div className="group-content">

                <div className="form-group">
                  <label>Organization</label>
                  <select name="org_id" value={filters.org_id} onChange={handleChange}>
                    <option value="">All Organizations</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.organization_name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

          </div>

          <div className="filter-actions">
            <button className="primary-btn" onClick={generateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </button>
            <button className="ghost-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* RESULTS */}
      {hasSearched && (
        <div className="results-card pcard">
          <div className="pcard-header">
            <h3>
              Results
              {!loading && (
                <span className="result-count"> — {displayData.length} student{displayData.length !== 1 ? "s" : ""} found</span>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Generating report...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div className="empty-results">
              <p>No students match the selected criteria.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Program</th>
                    <th>Year / Section</th>
                    <th>GWA</th>
                    <th>Skills</th>
                    <th>Organizations</th>
                    <th>Activities</th>
                    <th>Awards</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="student-cell-sm">
                          <p className="s-name-sm">{s.name}</p>
                          <p className="s-num-sm">{s.student_number}</p>
                        </div>
                      </td>
                      <td>{s.program}</td>
                      <td>{s.year_level} · {s.section}</td>
                      <td>
                        <span className={`gwa-badge ${getGwaClass(s.gwa)}`}>{s.gwa}</span>
                      </td>
                      <td>
                        {s.skills?.length > 0 ? (
                          <div className="tag-list">
                            {s.skills.map((sk, i) => <span key={i} className="tag">{sk}</span>)}
                          </div>
                        ) : <span className="none-text">—</span>}
                      </td>
                      <td>
                        {s.organizations?.length > 0 ? (
                          <div className="tag-list">
                            {s.organizations.map((o, i) => <span key={i} className="tag tag-org">{o}</span>)}
                          </div>
                        ) : <span className="none-text">—</span>}
                      </td>
                      <td>
                        <div className="activity-counts">
                          <span title="Academic">{s.academic_activities ?? 0} acad</span>
                          <span title="Non-Academic">{s.non_academic_activities ?? 0} non-acad</span>
                        </div>
                      </td>
                      <td>
                        <span className={`award-count ${s.awards > 0 ? "has-awards" : ""}`}>
                          {s.awards ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
