/**
 * PDF Export — Formal Document Report
 * Generates a formal written report with narrative paragraphs, letterhead, and tables.
 */

const BRAND_COLOR = "#FF6B1A";
const ACCENT = "#1a0a00";

function buildStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      padding: 48px 56px;
      font-size: 12.5px;
      line-height: 1.7;
      max-width: 860px;
      margin: 0 auto;
    }

    /* ── LETTERHEAD ── */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      border-bottom: 3px solid ${BRAND_COLOR};
      margin-bottom: 10px;
    }
    .letterhead-left .org-name {
      font-size: 18px;
      font-weight: 700;
      color: ${BRAND_COLOR};
      letter-spacing: -0.3px;
    }
    .letterhead-left .org-sub {
      font-size: 11px;
      color: #888;
      margin-top: 2px;
    }
    .letterhead-right {
      text-align: right;
      font-size: 11px;
      color: #888;
      line-height: 1.6;
    }
    .letterhead-right .doc-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${BRAND_COLOR};
    }

    /* ── DOCUMENT TITLE BLOCK ── */
    .doc-title-block {
      text-align: center;
      margin: 28px 0 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e8e0d8;
    }
    .doc-title-block .doc-type {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${BRAND_COLOR};
      margin-bottom: 8px;
    }
    .doc-title-block h1 {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: #1a0a00;
      line-height: 1.3;
    }
    .doc-title-block .doc-subtitle {
      font-size: 13px;
      color: #666;
      margin-top: 6px;
    }
    .doc-meta {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 14px;
      font-size: 11px;
      color: #888;
    }
    .doc-meta span strong { color: #1a0a00; }

    /* ── NARRATIVE PARAGRAPHS ── */
    .narrative {
      margin: 0 0 20px;
      font-size: 12.5px;
      color: #2a2a2a;
      text-align: justify;
      line-height: 1.8;
    }
    .narrative.intro {
      background: #fffaf7;
      border-left: 4px solid ${BRAND_COLOR};
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 28px;
    }

    /* ── SECTION HEADINGS ── */
    .section-block { margin: 28px 0 14px; }
    .section-num {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${BRAND_COLOR};
      margin-bottom: 4px;
    }
    .section-heading {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 17px;
      font-weight: 700;
      color: #1a0a00;
      border-bottom: 1.5px solid #f0e8e0;
      padding-bottom: 6px;
    }

    /* ── STAT STRIP ── */
    .stat-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 16px 0 20px;
    }
    .stat-box {
      border: 1px solid #f0e8e0;
      border-top: 3px solid;
      border-radius: 6px;
      padding: 14px 12px;
      text-align: center;
    }
    .stat-box .stat-val {
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
      display: block;
    }
    .stat-box .stat-lbl {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #888;
      margin-top: 5px;
      display: block;
    }
    .stat-box .stat-sub {
      font-size: 10px;
      color: #bbb;
      margin-top: 2px;
      display: block;
    }

    /* ── TABLES ── */
    .tbl-wrap { margin: 12px 0 24px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead tr { background: #1a0a00; }
    thead th {
      color: #fff;
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 9px 12px;
      text-align: left;
    }
    tbody tr:nth-child(even) { background: #fffaf7; }
    tbody tr:nth-child(odd)  { background: #fff; }
    tbody td {
      padding: 9px 12px;
      border-bottom: 1px solid #f0e8e0;
      color: #2a2a2a;
    }
    tbody tr:last-child td { border-bottom: none; }
    .rank-cell { font-weight: 700; color: ${BRAND_COLOR}; text-align: center; }
    .gwa-cell  { font-weight: 700; color: #065f46; }
    .sev-minor    { color: #92400e; font-weight: 600; }
    .sev-moderate { color: #c2410c; font-weight: 600; }
    .sev-major    { color: #b91c1c; font-weight: 600; }

    /* ── PROGRESS BAR IN TABLE ── */
    .bar-cell { display: flex; align-items: center; gap: 8px; }
    .bar-bg { flex: 1; height: 7px; background: #f0e8e0; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; }
    .bar-pct { font-size: 11px; font-weight: 700; min-width: 36px; text-align: right; }

    /* ── FINDINGS BOX ── */
    .findings-box {
      background: #fffaf7;
      border: 1px solid #f0e8e0;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0 24px;
    }
    .findings-box .findings-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${BRAND_COLOR};
      margin-bottom: 10px;
    }
    .findings-box ul {
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .findings-box li { font-size: 12.5px; color: #2a2a2a; }

    /* ── SIGNATURE BLOCK ── */
    .sig-block {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    .sig-item { flex: 1; }
    .sig-line {
      border-top: 1.5px solid #1a0a00;
      margin-bottom: 6px;
      margin-top: 40px;
    }
    .sig-name { font-weight: 700; font-size: 12.5px; }
    .sig-title { font-size: 11px; color: #888; }

    /* ── FOOTER ── */
    .doc-footer {
      margin-top: 36px;
      padding-top: 10px;
      border-top: 1px solid #e8e0d8;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #bbb;
    }

    @media print {
      body { padding: 24px 32px; }
      .section-block { page-break-inside: avoid; }
    }
  `;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateShort() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function schoolYear() {
  const y = new Date().getFullYear();
  return `A.Y. ${y - 1}–${y}`;
}

function pct(n, total) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function gwaCategory(gwa) {
  if (!gwa || gwa === "N/A") return "not yet recorded";
  const g = parseFloat(gwa);
  if (g <= 1.50) return "Dean's List standing (1.00–1.50)";
  if (g <= 2.00) return "Very Good standing (1.51–2.00)";
  if (g <= 2.50) return "Good standing (2.01–2.50)";
  if (g <= 3.00) return "Satisfactory standing (2.51–3.00)";
  return "At-Risk standing (above 3.00)";
}

function severityClass(s) {
  return { Minor: "sev-minor", Moderate: "sev-moderate", Major: "sev-major" }[s] || "";
}

/* ── Shared document section builders ── */

function buildLetterhead(docLabel) {
  return `
    <div class="letterhead">
      <div class="letterhead-left">
        <div class="org-name">College of Computing Studies</div>
        <div class="org-sub">Academic Management System</div>
      </div>
      <div class="letterhead-right">
        <div class="doc-label">${docLabel}</div>
        <div>${formatDate()}</div>
        <div>${schoolYear()}</div>
      </div>
    </div>`;
}

function buildStatStrip(summary) {
  if (!summary?.length) return "";
  const boxes = summary
    .map(
      (s) => `
      <div class="stat-box" style="border-top-color:${s.color}">
        <span class="stat-val" style="color:${s.color}">${s.value}</span>
        <span class="stat-lbl">${s.label}</span>
        <span class="stat-sub">${s.sub}</span>
      </div>`
    )
    .join("");
  return `<div class="stat-strip">${boxes}</div>`;
}

function buildDistributionSection(distribution, totalWithGwa, sectionLabel) {
  if (!distribution?.length) return "";
  const rows = distribution
    .map(
      (d) => `
      <tr>
        <td><strong>${d.range}</strong></td>
        <td>${d.desc}</td>
        <td>${d.count}</td>
        <td>
          <div class="bar-cell">
            <div class="bar-bg"><div class="bar-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
            <span class="bar-pct" style="color:${d.color}">${d.pct}%</span>
          </div>
        </td>
      </tr>`
    )
    .join("");
  const deansCount  = distribution.find((d) => d.desc === "Dean's List")?.count ?? 0;
  const atRiskCount = distribution.find((d) => d.desc === "At Risk")?.count ?? 0;
  const total       = totalWithGwa || 0;
  return `
    <div class="section-block">
      <div class="section-num">${sectionLabel}</div>
      <div class="section-heading">Academic Performance Distribution</div>
    </div>
    <p class="narrative">
      The following table presents the distribution of students across GWA performance brackets.
      Of the <strong>${total}</strong> students with recorded GWA, <strong>${deansCount}</strong>
      (${pct(deansCount, total)}) have achieved Dean's List standing with a GWA of 1.50 or below,
      while <strong>${atRiskCount}</strong> (${pct(atRiskCount, total)}) are classified as At-Risk
      with a GWA exceeding 3.00. This distribution serves as a basis for academic intervention
      and recognition programs.
    </p>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th>GWA Range</th><th>Academic Standing</th><th>No. of Students</th><th>Proportion</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildYearLevelSection(byYear, sectionLabel) {
  if (!byYear?.length) return "";
  const total = byYear.reduce((s, y) => s + (y.students || 0), 0);
  const largest = byYear.reduce((a, b) => (a.students > b.students ? a : b), byYear[0]);
  const rows = byYear
    .map(
      (y) => `
      <tr>
        <td>${y.label}</td>
        <td>${y.students}</td>
        <td>${pct(y.students, total)}</td>
        <td>${y.avg_gwa != null ? `<span class="gwa-cell">${y.avg_gwa}</span>` : "—"}</td>
      </tr>`
    )
    .join("");
  return `
    <div class="section-block">
      <div class="section-num">${sectionLabel}</div>
      <div class="section-heading">Enrollment by Year Level</div>
    </div>
    <p class="narrative">
      A total of <strong>${total}</strong> students are currently enrolled across all year levels.
      The largest cohort is <strong>${largest.label}</strong> with <strong>${largest.students}</strong>
      students (${pct(largest.students, total)} of total enrollment).
      ${byYear.some((y) => y.avg_gwa != null)
        ? "The average GWA per year level is also presented to identify year-level academic trends."
        : ""}
    </p>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th>Year Level</th><th>No. of Students</th><th>% of Total</th><th>Avg GWA</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildViolationsSection(violations, sectionLabel) {
  if (!violations?.length) return "";
  const total = violations.reduce((s, v) => s + (v.count || 0), 0);
  const major = violations.find((v) => v.severity === "Major")?.count ?? 0;
  const rows = violations
    .map(
      (v) => `
      <tr>
        <td class="${severityClass(v.severity)}">${v.severity}</td>
        <td>${v.count}</td>
        <td>${pct(v.count, total)}</td>
      </tr>`
    )
    .join("");
  return `
    <div class="section-block">
      <div class="section-num">${sectionLabel}</div>
      <div class="section-heading">Student Behavioral Incidents</div>
    </div>
    <p class="narrative">
      A total of <strong>${total}</strong> behavioral incident${total !== 1 ? "s" : ""} have been
      recorded within the reporting period. Of these, <strong>${major}</strong>
      (${pct(major, total)}) are classified as Major violations, which require immediate
      administrative action and formal disciplinary proceedings. Minor and Moderate violations
      are subject to counseling and corrective measures as outlined in the Student Handbook.
    </p>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th>Severity Level</th><th>No. of Incidents</th><th>Proportion</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildTopStudentsSection(topStudents, sectionLabel, scope) {
  if (!topStudents?.length) return "";
  const rows = topStudents
    .map(
      (s, i) => `
      <tr>
        <td class="rank-cell">${i + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.program}</td>
        <td class="gwa-cell">${s.gwa}</td>
        <td>${gwaCategory(s.gwa)}</td>
      </tr>`
    )
    .join("");
  return `
    <div class="section-block">
      <div class="section-num">${sectionLabel}</div>
      <div class="section-heading">Academic Honors — Top Performing Students</div>
    </div>
    <p class="narrative">
      The following students represent the highest academic achievers
      ${scope ? `within the <strong>${scope}</strong> program` : "across all programs"}
      for the current academic period. These students are recommended for recognition under the
      Dean's List and academic honors program, subject to verification of all academic requirements.
    </p>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th>Rank</th><th>Student Name</th><th>Program</th><th>GWA</th><th>Academic Standing</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildFindingsBox(items) {
  const li = items.map((i) => `<li>${i}</li>`).join("");
  return `
    <div class="findings-box">
      <div class="findings-title">Key Findings &amp; Observations</div>
      <ul>${li}</ul>
    </div>`;
}

function buildDeanSignatureBlock(deanName) {
  return `
    <div class="sig-block">
      <div class="sig-item">
        <div class="sig-line"></div>
        <div class="sig-name">${deanName || "___________________"}</div>
        <div class="sig-title">College Dean</div>
      </div>
    </div>`;
}

function buildSignatureBlock(preparedByName, preparedByTitle, notedByName, notedByTitle) {
  return `
    <div class="sig-block">
      <div class="sig-item">
        <div class="sig-line"></div>
        <div class="sig-name">${preparedByName || "___________________"}</div>
        <div class="sig-title">${preparedByTitle}</div>
      </div>
      <div class="sig-item">
        <div class="sig-line"></div>
        <div class="sig-name">${notedByName || "___________________"}</div>
        <div class="sig-title">${notedByTitle}</div>
      </div>
    </div>`;
}

// ── legacy helpers (unused, kept for safety) ──
function buildSummaryCards(summary) {
  if (!summary?.length) return "";
  const cards = summary
    .map(
      (s) => `
      <div class="summary-card">
        <span class="s-label">${s.label}</span>
        <span class="s-value" style="color:${s.color}">${s.value}</span>
        <span class="s-sub">${s.sub}</span>
      </div>`
    )
    .join("");
  return `<div class="summary-grid">${cards}</div>`;
}

function buildDistributionTable(distribution) {
  if (!distribution?.length) return "";
  const rows = distribution
    .map(
      (d) => `
      <tr>
        <td><strong>${d.range}</strong></td>
        <td>${d.desc}</td>
        <td>
          <div class="bar-wrap">
            <div class="bar-bg"><div class="bar-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
            <span class="bar-label" style="color:${d.color}">${d.count}</span>
          </div>
        </td>
        <td>${d.pct}%</td>
      </tr>`
    )
    .join("");
  return `
    <p class="section-title">GWA Distribution</p>
    <table>
      <thead><tr><th>GWA Range</th><th>Category</th><th>Count</th><th>%</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildTopStudentsTable(topStudents) {
  if (!topStudents?.length) return "";
  const rows = topStudents
    .map(
      (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.program}</td>
        <td><span class="badge badge-green">${s.gwa}</span></td>
      </tr>`
    )
    .join("");
  return `
    <p class="section-title">Top Students</p>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Program</th><th>GWA</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildViolationsTable(violations) {
  if (!violations?.length) return "";
  const rows = violations
    .map(
      (v) => `
      <tr>
        <td>${severityBadge(v.severity)}</td>
        <td>${v.count}</td>
      </tr>`
    )
    .join("");
  return `
    <p class="section-title">Violations by Severity</p>
    <table>
      <thead><tr><th>Severity</th><th>Count</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildByProgramTable(byProgram) {
  if (!byProgram?.length) return "";
  const rows = byProgram
    .map(
      (p) => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.students}</td>
        <td>${p.gwa}</td>
      </tr>`
    )
    .join("");
  return `
    <p class="section-title">GWA by Program</p>
    <table>
      <thead><tr><th>Program</th><th>Students</th><th>Avg GWA</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildByYearTable(byYear) {
  if (!byYear?.length) return "";
  const rows = byYear
    .map(
      (y) => `
      <tr>
        <td>${y.label}</td>
        <td>${y.students}</td>
        ${y.avg_gwa != null ? `<td>${y.avg_gwa}</td>` : "<td>—</td>"}
      </tr>`
    )
    .join("");
  const hasGwa = byYear.some((y) => y.avg_gwa != null);
  return `
    <p class="section-title">Enrollment by Year Level</p>
    <table>
      <thead><tr><th>Year Level</th><th>Students</th>${hasGwa ? "<th>Avg GWA</th>" : ""}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildTopOrgsTable(topOrgs) {
  if (!topOrgs?.length) return "";
  const rows = topOrgs.map((o) => `<tr><td>${o.name}</td><td>${o.members}</td></tr>`).join("");
  return `
    <p class="section-title">Top Organizations</p>
    <table>
      <thead><tr><th>Organization</th><th>Members</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildTopSkillsTable(topSkills) {
  if (!topSkills?.length) return "";
  const rows = topSkills.map((s) => `<tr><td>${s.skill}</td><td>${s.count}</td></tr>`).join("");
  return `
    <p class="section-title">Top Skills</p>
    <table>
      <thead><tr><th>Skill</th><th>Students</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * Export Dean's department-wide formal document report as PDF.
 * @param {object} data - from analyticsService.getDeanReport()
 * @param {object} user - logged-in user from useAuth()
 */
export function exportDeanReportPdf(data, user) {
  const total     = data?.total_students ?? 0;
  const withGwa   = data?.total_with_gwa ?? 0;
  const summary   = data?.summary ?? [];
  const avgGwaObj = summary.find((s) => s.label === "Dept Avg GWA");
  const avgGwa    = avgGwaObj?.value ?? "N/A";
  const deansCount  = summary.find((s) => s.label === "Dean's List")?.value ?? 0;
  const atRiskCount = summary.find((s) => s.label === "At Risk")?.value ?? 0;
  const byProgram   = data?.by_program ?? [];
  const topOrgs     = data?.top_orgs ?? [];
  const topSkills   = data?.top_skills ?? [];
  const deanName    = user?.name || "___________________";

  const programRows = byProgram
    .map(
      (p) => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.students}</td>
        <td>${pct(p.students, total)}</td>
        <td class="gwa-cell">${p.gwa}</td>
        <td>${gwaCategory(p.gwa)}</td>
      </tr>`
    )
    .join("");

  const programSection = byProgram.length ? `
    <div class="section-block">
      <div class="section-num">Section II</div>
      <div class="section-heading">Enrollment and Performance by Program</div>
    </div>
    <p class="narrative">
      The department currently offers <strong>${byProgram.length}</strong> program${byProgram.length !== 1 ? "s" : ""}
      with a combined enrollment of <strong>${total}</strong> students. The table below presents the
      enrollment count and average GWA per program, providing a comparative view of academic
      performance across the department.
    </p>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th>Program</th><th>Students</th><th>% of Dept</th><th>Avg GWA</th><th>Academic Standing</th></tr>
        </thead>
        <tbody>${programRows}</tbody>
      </table>
    </div>` : "";

  const orgsSection = topOrgs.length ? `
    <div class="section-block">
      <div class="section-num">Section VI</div>
      <div class="section-heading">Student Organization Participation</div>
    </div>
    <p class="narrative">
      Student participation in recognized organizations reflects the co-curricular engagement
      of the student body. The following table lists the top organizations by membership count,
      which may be used to assess the reach and impact of co-curricular programs.
    </p>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Organization</th><th>No. of Members</th></tr></thead>
        <tbody>${topOrgs.map((o) => `<tr><td>${o.name}</td><td>${o.members}</td></tr>`).join("")}</tbody>
      </table>
    </div>` : "";

  const skillsSection = topSkills.length ? `
    <div class="section-block">
      <div class="section-num">Section VII</div>
      <div class="section-heading">Student Competency Profile</div>
    </div>
    <p class="narrative">
      The following table summarizes the most prevalent skills reported by students across
      all programs. This data may be used to align curriculum offerings with industry demands
      and to identify areas for skills development programs.
    </p>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Skill</th><th>No. of Students</th></tr></thead>
        <tbody>${topSkills.map((s) => `<tr><td>${s.skill}</td><td>${s.count}</td></tr>`).join("")}</tbody>
      </table>
    </div>` : "";

  const findings = [
    `The department has a total enrollment of <strong>${total}</strong> students across <strong>${byProgram.length}</strong> program${byProgram.length !== 1 ? "s" : ""} for ${schoolYear()}.`,
    `The department-wide average GWA is <strong>${avgGwa}</strong>, reflecting ${gwaCategory(avgGwa)}.`,
    `<strong>${deansCount}</strong> student${deansCount !== 1 ? "s" : ""} (${pct(deansCount, withGwa)}) qualify for Dean's List recognition.`,
    `<strong>${atRiskCount}</strong> student${atRiskCount !== 1 ? "s" : ""} (${pct(atRiskCount, withGwa)}) are flagged as At-Risk and require immediate intervention.`,
  ];

  const body = `
    ${buildLetterhead("Department Academic Report")}
    <div class="doc-title-block">
      <div class="doc-type">Academic Performance Report</div>
      <h1>Department-Wide Academic Status Report</h1>
      <div class="doc-subtitle">Prepared by the Office of the Dean &bull; ${schoolYear()}</div>
      <div class="doc-meta">
        <span><strong>Date Prepared:</strong> ${formatDate()}</span>
        <span><strong>Programs Covered:</strong> ${byProgram.length || "All"}</span>
        <span><strong>Total Students:</strong> ${total}</span>
      </div>
    </div>
    <div class="section-block">
      <div class="section-num">Section I</div>
      <div class="section-heading">Executive Summary</div>
    </div>
    <p class="narrative intro">
      This report provides a department-wide academic performance assessment for ${schoolYear()}.
      It consolidates data from all programs under the college, covering student enrollment,
      GWA distribution, year-level breakdown, behavioral incidents, academic honors, organizational
      participation, and student competency profiles. The findings are intended to guide the Dean's
      Office in policy formulation, resource allocation, and academic quality assurance.
    </p>
    ${buildStatStrip(summary)}
    ${buildFindingsBox(findings)}
    ${programSection}
    ${buildDistributionSection(data?.distribution, withGwa, "Section III")}
    ${buildYearLevelSection(data?.by_year_level, "Section IV")}
    ${buildViolationsSection(data?.violations_severity, "Section V")}
    ${orgsSection}
    ${skillsSection}
    ${buildTopStudentsSection(data?.top_students, "Section VIII", null)}
    <div class="section-block">
      <div class="section-num">Section IX</div>
      <div class="section-heading">Recommendations</div>
    </div>
    <p class="narrative">
      In light of the data presented in this report, the following recommendations are submitted
      for the consideration of the Dean's Office and relevant academic committees:
    </p>
    <div class="findings-box">
      <div class="findings-title">Recommended Actions</div>
      <ul>
        <li>Initiate targeted academic intervention programs for the <strong>${atRiskCount}</strong> at-risk students identified across all programs.</li>
        <li>Formally endorse <strong>${deansCount}</strong> Dean's List qualifier${deansCount !== 1 ? "s" : ""} for recognition and scholarship consideration.</li>
        <li>Conduct a program-level review for programs with average GWA exceeding 2.50.</li>
        <li>Strengthen co-curricular engagement by supporting the top student organizations identified in this report.</li>
        <li>Align curriculum development with the top skills reported by students to improve graduate employability.</li>
      </ul>
    </div>
    ${buildDeanSignatureBlock(deanName)}
    <div class="doc-footer">
      <span>Department Academic Report — ${schoolYear()} — Confidential</span>
      <span>Generated ${formatDateShort()}</span>
    </div>`;

  openPrintWindow("Department Academic Report", body);
}

/**
 * Export Chair's program-scoped formal document report as PDF.
 * @param {object} data - from analyticsService.getAcademicPerformance()
 * @param {string} programName - e.g. "BSIT"
 * @param {object} user - logged-in user from useAuth()
 * @param {string} deanName - full name of the college dean
 */
export function exportChairReportPdf(data, programName, user, deanName) {
  const prog        = programName || "Program";
  const total       = data?.total_students ?? 0;
  const withGwa     = data?.total_with_gwa ?? 0;
  const summary     = data?.summary ?? [];
  const avgGwa      = summary.find((s) => s.label === "Dept Avg GWA")?.value ?? "N/A";
  const deansCount  = summary.find((s) => s.label === "Dean's List")?.value ?? 0;
  const atRiskCount = summary.find((s) => s.label === "At Risk")?.value ?? 0;
  const chairName   = user?.name || user?.faculty
    ? `${user?.faculty?.first_name ?? ""} ${user?.faculty?.last_name ?? ""}`.trim() || user?.name
    : "___________________";

  const findings = [
    `The ${prog} program has a total enrollment of <strong>${total}</strong> students for ${schoolYear()}.`,
    `Of the <strong>${withGwa}</strong> students with recorded GWA, the program average stands at <strong>${avgGwa}</strong>, placing it in ${gwaCategory(avgGwa)}.`,
    `<strong>${deansCount}</strong> student${deansCount !== 1 ? "s" : ""} (${pct(deansCount, withGwa)}) qualify for Dean's List recognition with a GWA of 1.50 or below.`,
    `<strong>${atRiskCount}</strong> student${atRiskCount !== 1 ? "s" : ""} (${pct(atRiskCount, withGwa)}) are flagged as At-Risk and require immediate academic advising.`,
  ];

  const body = `
    ${buildLetterhead("Program Academic Report")}
    <div class="doc-title-block">
      <div class="doc-type">Academic Performance Report</div>
      <h1>${prog} Program — Academic Status Report</h1>
      <div class="doc-subtitle">Prepared by the Department Chair &bull; ${schoolYear()}</div>
      <div class="doc-meta">
        <span><strong>Date Prepared:</strong> ${formatDate()}</span>
        <span><strong>Program:</strong> ${prog}</span>
        <span><strong>Total Students:</strong> ${total}</span>
      </div>
    </div>
    <div class="section-block">
      <div class="section-num">Section I</div>
      <div class="section-heading">Executive Summary</div>
    </div>
    <p class="narrative intro">
      This report presents a comprehensive academic performance assessment of the
      <strong>${prog}</strong> program for ${schoolYear()}. It covers student enrollment figures,
      GWA distribution, year-level breakdown, behavioral incidents, and academic honors.
      The data contained herein is intended to support evidence-based decision-making by the
      Department Chair and the College Dean in matters of academic intervention, recognition,
      and program improvement.
    </p>
    ${buildStatStrip(summary)}
    ${buildFindingsBox(findings)}
    ${buildDistributionSection(data?.distribution, withGwa, "Section II")}
    ${buildYearLevelSection(data?.by_year_level, "Section III")}
    ${buildViolationsSection(data?.violations_severity, "Section IV")}
    ${buildTopStudentsSection(data?.top_students, "Section V", prog)}
    <div class="section-block">
      <div class="section-num">Section VI</div>
      <div class="section-heading">Recommendations</div>
    </div>
    <p class="narrative">
      Based on the foregoing data, the following actions are recommended for the
      <strong>${prog}</strong> program:
    </p>
    <div class="findings-box">
      <div class="findings-title">Recommended Actions</div>
      <ul>
        <li>Conduct academic advising sessions for the <strong>${atRiskCount}</strong> at-risk student${atRiskCount !== 1 ? "s" : ""} identified in this report.</li>
        <li>Endorse the <strong>${deansCount}</strong> Dean's List qualifier${deansCount !== 1 ? "s" : ""} for formal recognition and scholarship consideration.</li>
        <li>Review the curriculum and instructional strategies for year levels with below-average GWA performance.</li>
        <li>Coordinate with the Guidance Office regarding students with recorded Major violations.</li>
      </ul>
    </div>
    ${buildSignatureBlock(chairName, "Department Chair", deanName || "___________________", "College Dean")}
    <div class="doc-footer">
      <span>${prog} Academic Report — ${schoolYear()} — Confidential</span>
      <span>Generated ${formatDateShort()}</span>
    </div>`;

  openPrintWindow(`${prog} Program Academic Report`, body);
}

function openPrintWindow(title, bodyHtml) {
  const win = window.open("", "_blank", "width=960,height=800");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site to export PDF.");
    return;
  }
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${buildStyles()}</style>
</head>
<body>
  ${bodyHtml}
  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
