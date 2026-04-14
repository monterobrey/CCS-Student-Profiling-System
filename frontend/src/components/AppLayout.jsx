import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./AppLayout.css";

const PATH_SECTIONS = {
  dashboard: "Overview",
  'dean/dashboard': "Overview",
  'department-chair/dashboard': "Overview",
  'secretary/dashboard': "Overview",
  'faculty/dashboard': "Overview",
  'student/dashboard': "Overview",
  reports: "Profiling",
  curriculum: "Profiling",
  courses: "Profiling",
  'dean/reports': "Profiling",
  'dean/curriculum': "Profiling",
  'dean/courses': "Profiling",
  performance: "Academic",
  violations: "Academic",
  'academic-performance': "Academic",
  'dean/violations': "Academic",
  'department-chair/violations': "Academic",
  'department-chair/performance': "Academic",
  'department-chair/awards': "Awards",
  'department-chair/schedule': "Schedule",
  'student-accounts': "Accounts",
  'faculty-accounts': "Accounts",
  'dean/users': "Accounts",
  'department-chair/users': "Accounts",
  'secretary/users': "Accounts",
  'faculty-workload': "Monitoring",
  'secretary/faculty-schedule': "Monitoring",
  archive: "Management",
  'dean/archive': "Management",
  settings: "Settings",
  'dean/settings': "Settings",
  'department-chair/settings': "Settings",
  'secretary/settings': "Settings",
  'faculty/settings': "Settings",
  'student/settings': "Settings",
};

export default function AppLayout() {
  const { user, role } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const portalLabel = role === 'dean' ? 'Dean Portal' 
    : role === 'department_chair' ? 'Chair Portal'
    : role === 'faculty' ? 'Faculty Portal'
    : role === 'secretary' ? 'Admin Portal'
    : role === 'student' ? 'Student Portal'
    : 'Portal';

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentPath = pathSegments[pathSegments.length - 1] || 'dashboard';
  const section = PATH_SECTIONS[currentPath] || 'Overview';
  
  const pageName = currentPath
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  
  // Don't show duplicate breadcrumb when section and page name are the same
  const showSection = section !== pageName;

  return (
    <div className="dashboard-root">
      <Sidebar 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        portalLabel={portalLabel}
      />
      <div className="main-area">
        <Header 
          user={user}
          role={role}
          portalLabel={portalLabel}
        />
        <main className="content">
          <div className="page-breadcrumb-trail">
            {showSection && (
              <>
                <span className="breadcrumb-section">{section}</span>
                <span className="breadcrumb-sep">›</span>
              </>
            )}
            <span className="breadcrumb-current">{pageName}</span>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}