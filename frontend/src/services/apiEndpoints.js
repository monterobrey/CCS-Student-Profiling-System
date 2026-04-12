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
    GUARDIAN: "/student/guardian",
    CREATE: "/secretary/students",
    UPDATE: (id) => `/secretary/students/${id}`,
    DELETE: (id) => `/secretary/students/${id}`,
    IMPORT: "/secretary/students/import",
    RESEND_SETUP: (id) => `/secretary/students/${id}/resend-setup`,
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
    RESEND_SETUP: (id) => `/secretary/faculty/${id}/resend-setup`,
    MY_STUDENTS: "/faculty/students",
    MY_VIOLATIONS: "/faculty/violations",
    REPORT_VIOLATION: "/faculty/violations",
  },
  DEPARTMENTS: {
    LIST: "/departments",
  },
  COURSE: {
    LIST: "/courses",
    DETAIL: (id) => `/courses/${id}`,
    CREATE: "/courses",
    UPDATE: (id) => `/courses/${id}`,
    DELETE: (id) => `/courses/${id}`,
  },
  CURRICULUM: {
    LIST: "/dean/curriculum",
    STORE: "/dean/curriculum",
    BULK: "/dean/curriculum/bulk",
    IMPORT: "/dean/curriculum/import",
    DELETE: (id) => `/dean/curriculum/${id}`,
  },
  PROGRAMS: {
    LIST: "/programs",
  },
  SECTIONS: {
    LIST: "/sections",
  },
  VIOLATIONS: {
    LIST: "/violations",
    UPDATE: (id) => `/violations/${id}`,
  },
};

export default API_ENDPOINTS;
