import { useLocation } from "react-router-dom";
import "./Header.css";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  users: "Users",
  reports: "Reports",
};

export default function Header({ user, role = "dean" }) {
  const location = useLocation();
  let pageTitle = PAGE_TITLES.dashboard;
  if (location.pathname.includes("/users/")) {
    pageTitle = "User Detail";
  } else if (location.pathname.endsWith("/users")) {
    pageTitle = PAGE_TITLES.users;
  } else if (location.pathname.endsWith("/reports")) {
    pageTitle = PAGE_TITLES.reports;
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
      </div>
      <div className="header-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Search students, faculty..." />
      </div>
      <div className="header-right">
        <button className="notification-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="notification-badge">3</span>
        </button>
        <div className="user-info">
          <span className="user-name">{user?.name || "User"}</span>
          <span className="user-role">{role ? role.replace("_", " ") : "User"}</span>
        </div>
        <div className="user-avatar">
          {user?.name?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}