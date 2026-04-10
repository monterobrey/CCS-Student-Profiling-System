import { NavLink } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import "./Sidebar.css";

const NAV_ITEMS = {
  [ROLES.DEAN]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
    { path: "/users", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", label: "Users" },
    { path: "/reports", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", label: "Reports" },
  ],
  [ROLES.CHAIR]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
    { path: "/users", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", label: "Users" },
    { path: "/reports", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", label: "Reports" },
  ],
  [ROLES.SECRETARY]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
    { path: "/users", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", label: "Users" },
    { path: "/reports", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", label: "Reports" },
  ],
  [ROLES.FACULTY]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
  ],
  [ROLES.STUDENT]: [
    { path: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", label: "Dashboard" },
  ],
};

export default function Sidebar() {
  const { role, logout, getRoleBasePath } = useAuth();

  const roleBasePath = getRoleBasePath(role);
  const navItems = (NAV_ITEMS[role] || NAV_ITEMS[ROLES.FACULTY]).map((item) => ({
    ...item,
    path: `${roleBasePath}${item.path}`,
  }));
  const portalName = role === ROLES.DEAN ? "Dean Portal"
    : role === ROLES.CHAIR ? "Chair Portal"
    : role === ROLES.SECRETARY ? "Secretary Portal"
    : role === ROLES.FACULTY ? "Faculty Portal" 
    : "Student Portal";

  const handleLogout = () => {
    logout();
    window.location.href = "/faculty/login";
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
            end={item.path.endsWith("/dashboard")}
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