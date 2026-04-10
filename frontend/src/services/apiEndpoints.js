export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/login",
    LOGOUT: "/logout",
    SETUP_PASSWORD: "/setup-password",
    CURRENT_USER: "/user",
  },
  ANALYTICS: {
    SUMMARY: "/analytics/summary",
    FACULTY: "/analytics/faculty",
    PERFORMANCE: "/analytics/performance",
  },
  PROFILING: {
    REPORT: "/profiling/report",
  },
  STUDENT: {
    LIST: "/students",
    DETAIL: (id) => `/students/${id}`,
    PROFILE: "/student/profile",
    CREATE: "/secretary/students",
    UPDATE: (id) => `/secretary/students/${id}`,
    DELETE: (id) => `/secretary/students/${id}`,
    IMPORT: "/secretary/students/import",
    ADD_SKILL: "/student/skills",
    REMOVE_SKILL: (id) => `/student/skills/${id}`,
    VIOLATIONS: "/student/violations",
  },
  FACULTY: {
    LIST: "/faculty",
    CREATE: "/secretary/faculty",
    UPDATE: (id) => `/secretary/faculty/${id}`,
    DELETE: (id) => `/secretary/faculty/${id}`,
    IMPORT: "/secretary/faculty/import",
    MY_STUDENTS: "/faculty/students",
    MY_VIOLATIONS: "/faculty/violations",
    REPORT_VIOLATION: "/faculty/violations",
  },
  COURSE: {
    LIST: "/courses",
    DETAIL: (id) => `/courses/${id}`,
    CREATE: "/courses",
    UPDATE: (id) => `/courses/${id}`,
    DELETE: (id) => `/courses/${id}`,
  },
};

export default API_ENDPOINTS;
