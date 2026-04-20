import { useState, useEffect, useRef, useCallback } from "react";
import { notificationService } from "../services";
import "./NotificationBell.css";

const TYPE_CONFIG = {
  award_applied:   { icon: "🏆", color: "#f59e0b" },
  award_approved:  { icon: "✅", color: "#10b981" },
  award_rejected:  { icon: "❌", color: "#ef4444" },
  award_pending:   { icon: "⏳", color: "#f59e0b" },
  violation_reported: { icon: "⚠️", color: "#ef4444" },
  violation_updated:  { icon: "📋", color: "#3b82f6" },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      if (res.ok) {
        setNotifications(res.data?.notifications ?? []);
        setUnreadCount(res.data?.unread_count ?? 0);
      }
    } catch {
      // silent fail — don't disrupt the UI
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    await notificationService.markRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    setLoading(false);
  };

  return (
    <div className="nb-wrap" ref={dropdownRef}>
      {/* Bell button */}
      <button className="nb-btn" onClick={handleOpen} title="Notifications">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path
            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.46 5.36 5.82 7.93 5.82 11v5l-2 2v1h16.36v-1l-2-2z"
            fill="currentColor"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-header-title">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="nb-mark-all"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="nb-list">
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <span>🔔</span>
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg   = TYPE_CONFIG[n.type] ?? { icon: "🔔", color: "#9ca3af" };
                const isNew = !n.read_at;
                return (
                  <div
                    key={n.id}
                    className={`nb-item${isNew ? " nb-item--unread" : ""}`}
                  >
                    <div className="nb-item-icon" style={{ background: cfg.color + "18", color: cfg.color }}>
                      {cfg.icon}
                    </div>
                    <div className="nb-item-body">
                      <p className="nb-item-title">{n.title}</p>
                      <p className="nb-item-msg">{n.message}</p>
                      <span className="nb-item-time">{timeAgo(n.created_at)}</span>
                    </div>
                    {isNew && (
                      <button
                        className="nb-item-read-btn"
                        onClick={(e) => handleMarkRead(n.id, e)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
