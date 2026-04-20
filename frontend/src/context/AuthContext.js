import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext(null);

export const ROLES = {
  DEAN: "dean",
  CHAIR: "department_chair",
  SECRETARY: "secretary",
  FACULTY: "faculty",
  STUDENT: "student",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token = null) => {
    // Clear any cached data from a previous session before setting the new user
    queryClient.clear();
    const userWithDefaults = {
      ...userData,
      role: userData.role || ROLES.DEAN,
    };
    setUser(userWithDefaults);
    localStorage.setItem("user", JSON.stringify(userWithDefaults));
    if (token) {
      localStorage.setItem("auth_token", token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    // Wipe all cached query data so the next login starts fresh
    queryClient.clear();
  };

  const getRoleBasePath = useCallback((userRole) => {
    if (userRole === ROLES.DEAN) return "/dean";
    if (userRole === ROLES.CHAIR) return "/department-chair";
    if (userRole === ROLES.SECRETARY) return "/secretary";
    if (userRole === ROLES.FACULTY) return "/faculty";
    if (userRole === ROLES.STUDENT) return "/student";
    return "/faculty";
  }, []);

  const getDefaultRouteForRole = useCallback((userRole) => {
    return `${getRoleBasePath(userRole)}/dashboard`;
  }, [getRoleBasePath]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role: user?.role || null,
      login,
      logout,
      isDean: user?.role === ROLES.DEAN,
      isChair: user?.role === ROLES.CHAIR,
      isSecretary: user?.role === ROLES.SECRETARY,
      isFaculty: user?.role === ROLES.FACULTY,
      isStudent: user?.role === ROLES.STUDENT,
      getRoleBasePath,
      getDefaultRouteForRole,
      hasRole: (roles) => {
        if (!user?.role) return false;
        if (Array.isArray(roles)) return roles.includes(user.role);
        return user.role === roles;
      },
    }),
    [user, loading, getRoleBasePath, getDefaultRouteForRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useRole() {
  const { role, isDean, isChair, isSecretary, isFaculty, isStudent, hasRole } = useAuth();
  return { role, isDean, isChair, isSecretary, isFaculty, isStudent, hasRole };
}