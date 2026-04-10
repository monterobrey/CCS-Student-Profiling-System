export const DEAN_DASHBOARD_CONFIG = {
  academicYear: "2026-2027",
  semester: "2nd Semester",
  gwaTarget: 1.75,
};

export const DEFAULT_STATS = [
  {
    label: "Total Students",
    value: "0",
    delta: "Real-time sync",
    deltaClass: "positive",
    fill: "0%",
    iconBg: "#fff5ef",
    iconColor: "#FF6B1A",
    route: "/students",
    iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  },
  {
    label: "Total Faculty",
    value: "0",
    delta: "Active members",
    deltaClass: "positive",
    fill: "0%",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
    route: "/faculty",
    iconPath:
      '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1M6 13v-3a1 1 0 011-1h4a1 1 0 011-1v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  },
  {
    label: "Dept. Avg GWA",
    value: "N/A",
    delta: "Target: 1.75",
    deltaClass: "warning",
    fill: "0%",
    iconBg: "#f5f3ff",
    iconColor: "#8b5cf6",
    iconPath:
      '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    label: "With Violations",
    value: "0",
    delta: "Active cases",
    deltaClass: "negative",
    fill: "0%",
    iconBg: "#fff1f2",
    iconColor: "#ef4444",
    iconPath:
      '<path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  },
  {
    label: "Awards Logged",
    value: "0",
    delta: "Recognitions",
    deltaClass: "positive",
    fill: "0%",
    iconBg: "#fffbeb",
    iconColor: "#f59e0b",
    iconPath:
      '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
];

export const DEFAULT_CHART_DATA = [
  { sem: "1st '22", gwa: 2.14, pct: 38 },
  { sem: "2nd '22", gwa: 2.08, pct: 50 },
  { sem: "1st '23", gwa: 2.01, pct: 60 },
  { sem: "2nd '23", gwa: 1.96, pct: 68 },
  { sem: "1st '24", gwa: 1.91, pct: 75 },
  { sem: "2nd '24", gwa: 1.87, pct: 85 },
];

export const API_ENDPOINTS = {
  ANALYTICS_SUMMARY: "/analytics/summary",
};