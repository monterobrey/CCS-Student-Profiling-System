import { Navigate, useLocation } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/faculty/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const roleBasePath = role === ROLES.DEAN
      ? "/dean"
      : role === ROLES.CHAIR
        ? "/department-chair"
        : role === ROLES.SECRETARY
          ? "/secretary"
          : role === ROLES.FACULTY
            ? "/faculty"
            : "/student";

    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <p className="hint">Required role: {allowedRoles.join(" or ")}</p>
          <a href={`${roleBasePath}/dashboard`} className="back-btn">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return children;
}

export function DeanRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={[ROLES.DEAN, ROLES.CHAIR, ROLES.SECRETARY]}>
      {children}
    </ProtectedRoute>
  );
}

export function FacultyRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={[ROLES.DEAN, ROLES.CHAIR, ROLES.SECRETARY, ROLES.FACULTY]}>
      {children}
    </ProtectedRoute>
  );
}