import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/users");
      setUsers(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchUsers}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Users</h1>
          <p>Manage system users and their roles</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      <div className="search-container">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm("")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="users-stats">
        <div className="stat-badge">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-badge">
          <span className="stat-number">
            {users.filter((u) => u.role === "admin").length}
          </span>
          <span className="stat-label">Admins</span>
        </div>
        <div className="stat-badge">
          <span className="stat-number">
            {users.filter((u) => u.role === "faculty").length}
          </span>
          <span className="stat-label">Faculty</span>
        </div>
        <div className="stat-badge">
          <span className="stat-number">
            {users.filter((u) => u.role === "student").length}
          </span>
          <span className="stat-label">Students</span>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          <h3>No users found</h3>
          <p>
            {searchTerm
              ? `No results for "${searchTerm}"`
              : "No users available"}
          </p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }) {
  const roleColors = {
    admin: "#0d9488",
    dean: "#0891b2",
    faculty: "#6366f1",
    student: "#8b5cf6",
  };

  const roleColor = roleColors[user.role] || "#64748b";

  return (
    <Link to={`/users/${user.id}`} className="user-card">
      <div className="user-avatar" style={{ background: roleColor }}>
        {user.name?.charAt(0).toUpperCase() || "U"}
      </div>
      <div className="user-info">
        <h3 className="user-name">{user.name || "Unknown User"}</h3>
        <p className="user-email">{user.email || "No email"}</p>
        <span className="user-role" style={{ background: `${roleColor}20`, color: roleColor }}>
          {user.role || "user"}
        </span>
      </div>
      <div className="user-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </div>
    </Link>
  );
}