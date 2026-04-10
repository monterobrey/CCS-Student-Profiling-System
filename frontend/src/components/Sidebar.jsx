import { NavLink, useLocation } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import "./Sidebar.css";

const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
    { path: "/users", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", label: "Users" },
    { path: "/reports", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", label: "Reports" },
  ],
  [ROLES.DEAN]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
    { path: "/users", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", label: "Users" },
    { path: "/students", icon: "M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z", label: "Students" },
    { path: "/faculty", icon: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z", label: "Faculty" },
    { path: "/violations", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01", label: "Violations" },
    { path: "/awards", icon: "M12 15l-2 5 2-1 2 1-2-5zM19 9l-6 6-3-3", label: "Awards" },
  ],
  [ROLES.FACULTY]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
    { path: "/students", icon: "M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z", label: "Students" },
    { path: "/grades", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM9 5h.01M15 5h.01M9 11h.01M15 11h.01M9 17h.01M15 17h.01", label: "Grades" },
    { path: "/violations", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01", label: "Violations" },
  ],
  [ROLES.STUDENT]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
    { path: "/profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z", label: "Profile" },
    { path: "/grades", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM9 5h.01M15 5h.01M9 11h.01M15 11h.01M9 17h.01M15 17h.01", label: "Grades" },
  ],
};

export default function Sidebar() {
  const { role, logout } = useAuth();
  const location = useLocation();

  const navItems = NAV_ITEMS[role] || NAV_ITEMS[ROLES.DEAN];
  const portalName = role === ROLES.ADMIN ? "Admin Portal" 
    : role === ROLES.DEAN ? "Dean Portal" 
    : role === ROLES.FACULTY ? "Faculty Portal" 
    : "Student Portal";

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">CCS</div>
        <span>{portalName}</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            end={item.path === "/dashboard"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}