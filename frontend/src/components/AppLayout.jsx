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
  'violations': "Academic",
  'student-accounts': "Accounts",
  'faculty-accounts': "Accounts",
  'dean/users': "Accounts",
  'department-chair/users': "Accounts",
  'secretary/users': "Accounts",
  'faculty-workload': "Monitoring",
  'secretary/faculty-schedule': "Monitoring",
  archive: "Management",
  'dean/archive': "Management",
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
            <span className="breadcrumb-category">{section}</span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-current">{pageName}</span>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}