import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { DEAN_DASHBOARD_CONFIG } from "../constants/DeanDashboard";
import { analyticsService } from "../services";
import { fetchWithCache } from "../utils/apiCache";

export function useDeanAnalytics() {
  const { user, role, getRoleBasePath } = useAuth();
  const basePath = getRoleBasePath(role);

  const [chartData, setChartData] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [deanViolations, setDeanViolations] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [activeViolationsCount, setActiveViolationsCount] = useState(0);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let timeMsg = "morning";
    if (hour >= 12 && hour < 18) timeMsg = "afternoon";
    else if (hour >= 18 || hour < 5) timeMsg = "evening";

    const faculty = user?.faculty;
    if (faculty) {
      const title = faculty.title ? faculty.title + " " : "";
      const lastName = faculty.last_name || "";
      return `Good ${timeMsg}, ${title}${lastName}`;
    }

    return `Good ${timeMsg}, Dean`;
  }, [user]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await fetchWithCache(
          "analytics:summary",
          async () => {
            const response = await analyticsService.getDeanSummary();
            return response?.data || {};
          },
          { staleTimeMs: 2 * 60 * 1000 }
        );

        if (data.chart_data) setChartData(data.chart_data);
        setTopStudents(data.top_students || []);
        setDeanViolations(data.recent_violations || []);
        setPendingApprovalsCount(data.pending_verifications || 0);
        setActiveViolationsCount(data.active_violations || 0);

        const totalStudents = data.total_students || 0;
        const totalFaculty = data.total_faculty || 0;
        const avgGwa = data.dept_avg_gwa || 0;
        const activeViolations = data.active_violations || 0;
        const totalAwards = data.total_awards || 0;

        const updatedStats = [
          {
            label: "Total Students",
            value: totalStudents.toString(),
            delta: "Real-time sync",
            deltaClass: "positive",
            fill: totalStudents > 0 ? "100%" : "0%",
            iconBg: "#ecfeff",
            iconColor: "#0d9488",
            route: `${basePath}/users`,
            iconPath: '<path d="M9 8a3 3 0 100-6 3 3 0 000 6zM2 16a7 7 0 0114 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
          },
          {
            label: "Total Faculty",
            value: totalFaculty.toString(),
            delta: "Active members",
            deltaClass: "positive",
            fill: totalFaculty > 0 ? "100%" : "0%",
            iconBg: "#eff6ff",
            iconColor: "#0891b2",
            route: `${basePath}/users`,
            iconPath: '<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6h1m-1 3h1m4-3h1m-1 3h1M6 13v-3a1 1 0 011-1h4a1 1 0 011-1v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
          },
          {
            label: "Dept. Avg GWA",
            value: avgGwa > 0 ? avgGwa.toFixed(2) : "N/A",
            delta: "Target: 1.75",
            deltaClass: avgGwa > 0 && avgGwa <= 1.75 ? "positive" : "warning",
            fill: avgGwa > 0 ? Math.max(0, Math.min(100, ((3 - avgGwa) / (3 - 1)) * 100)) + "%" : "0%",
            iconBg: "#f5f3ff",
            iconColor: "#8b5cf6",
            iconPath: '<path d="M2 13l3-5 3 3 3-4 5 6H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
          },
          {
            label: "With Violations",
            value: activeViolations.toString(),
            delta: "Active cases",
            deltaClass: "negative",
            fill: totalStudents > 0 && activeViolations > 0 ? Math.min(100, (activeViolations / totalStudents) * 100) + "%" : "0%",
            iconBg: "#fef2f2",
            iconColor: "#dc2626",
            iconPath: '<path d="M9 5v4M9 11.5v.5M2.5 14h13a1 1 0 00.87-1.5L10 2.5a1 1 0 00-1.74 0L2.5 12.5A1 1 0 002.5 14z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
          },
          {
            label: "Awards Logged",
            value: totalAwards.toString(),
            delta: "Recognitions",
            deltaClass: "positive",
            fill: totalAwards > 0 ? "100%" : "0%",
            iconBg: "#fffbeb",
            iconColor: "#d97706",
            iconPath: '<path d="M9 1.5l1.6 4.8H16l-4.2 3.1 1.6 4.9L9 11.1l-4.4 3.2 1.6-4.9L2 7.3h5.4L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
          },
        ];

        setStats(updatedStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dean analytics:", err);
        setError(err.message);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [basePath]);

  return {
    greeting,
    academicYear: DEAN_DASHBOARD_CONFIG.academicYear,
    semester: DEAN_DASHBOARD_CONFIG.semester,
    chartData,
    topStudents,
    deanViolations,
    pendingApprovalsCount,
    activeViolationsCount,
    stats,
    loading,
    error,
  };
}