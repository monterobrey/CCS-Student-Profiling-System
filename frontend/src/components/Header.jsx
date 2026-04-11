import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppLayout.css";

export default function Header({ user, role, portalLabel }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.trim().split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0];
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
    setShowUserMenu(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-block">
          <div className="page-breadcrumb">
            College of <span className="breadcrumb-orange">Computing Studies</span>
            <span className="breadcrumb-sep">|</span>
            {portalLabel}
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="date-chip">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M17.5 3.5h-2V2M6.5 3.5h-2V2M3.75 8.5h12.5M3.5 4.5h13c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="date-text">{currentDate}</span>
        </div>

        <div className="topbar-separator"></div>

        <button className="icon-btn notification-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.46 5.36 5.82 7.93 5.82 11v5l-2 2v1h16.36v-1l-2-2z" fill="currentColor"/>
            <circle cx="19" cy="17" r="2.5" fill="#FF6B1A"/>
          </svg>
        </button>

        <div className="topbar-separator"></div>

        <div className="user-dropdown" onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className="topbar-user-avatar">{getUserInitials()}</div>
          <span className="user-full-name">{user?.name || 'User'}</span>
          <svg className="dropdown-arrow" viewBox="0 0 20 20" fill="none">
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {showUserMenu && (
          <div className="user-menu">
            <button className="user-menu-item" onClick={handleSettings}>
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Account Settings</span>
            </button>
            <button className="user-menu-item" onClick={handleLogout}>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M13 10H3m0 0l3-3m-3 3l3 3M8 5V4a2 2 0 012-2h5a2 2 0 012 2v12a2 2 0 01-2 2h-5a2 2 0 01-2-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}