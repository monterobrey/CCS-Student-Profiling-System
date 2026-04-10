import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studentService, facultyService } from "../../services";
import "./UserDetail.css";

export default function UserDetail() {
  const { role, getRoleBasePath } = useAuth();
  const basePath = getRoleBasePath(role);
  const { id, type } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        let response;

        if (type === "student") {
          response = await studentService.getById(id);
          const payload = response?.data || {};
          setUser({
            id: payload.id,
            name: `${payload.first_name || ""} ${payload.last_name || ""}`.trim(),
            email: payload.user?.email || "",
            role: "student",
            created_at: payload.created_at,
          });
        } else if (type === "faculty") {
          const allFaculty = await facultyService.getAll();
          const payload = (allFaculty?.data || []).find((f) => String(f.id) === String(id));
          if (!payload) {
            throw new Error("Faculty record not found");
          }

          setUser({
            id: payload.id,
            name: `${payload.first_name || ""} ${payload.last_name || ""}`.trim(),
            email: payload.user?.email || "",
            role: "faculty",
            department: payload.department?.department_name,
            created_at: payload.created_at,
          });
        } else {
          throw new Error("Unsupported user type");
        }

        setError(null);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, type]);

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-detail-page">
        <div className="error-container">
          <p>{error || "User not found"}</p>
          <Link to={`${basePath}/users`} className="back-link">Back to Users</Link>
        </div>
      </div>
    );
  }

  const roleColors = {
    admin: "#0d9488",
    dean: "#0891b2",
    faculty: "#6366f1",
    student: "#8b5cf6",
  };

  const roleColor = roleColors[user.role] || "#64748b";

  return (
    <div className="user-detail-page">
      <div className="detail-header">
        <Link to={`${basePath}/users`} className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Users
        </Link>
      </div>

      <div className="user-profile">
        <div className="profile-avatar" style={{ background: roleColor }}>
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="profile-info">
          <h1>{user.name || "Unknown User"}</h1>
          <span className="profile-role" style={{ background: `${roleColor}20`, color: roleColor }}>
            {user.role || "user"}
          </span>
        </div>
      </div>

      <div className="detail-cards">
        <div className="detail-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <h3>Contact Information</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email || "Not provided"}</span>
            </div>
            {user.phone && (
              <div className="info-row">
                <span className="info-label">Phone</span>
                <span className="info-value">{user.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h3>Account Details</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">User ID</span>
              <span className="info-value">#{user.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value capitalize">{user.role || "user"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value status-active">Active</span>
            </div>
            {user.created_at && (
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {user.department && (
          <div className="detail-card">
            <div className="card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
              <h3>Department</h3>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Department</span>
                <span className="info-value">{user.department}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}