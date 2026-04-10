import { createContext, useContext, useState, useEffect, useMemo } from "react";

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: "admin",
  DEAN: "dean",
  FACULTY: "faculty",
  STUDENT: "student",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = (userData) => {
    const userWithDefaults = {
      ...userData,
      role: userData.role || ROLES.DEAN,
    };
    setUser(userWithDefaults);
    localStorage.setItem("user", JSON.stringify(userWithDefaults));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role: user?.role || null,
      login,
      logout,
      isAdmin: user?.role === ROLES.ADMIN,
      isDean: user?.role === ROLES.DEAN,
      isFaculty: user?.role === ROLES.FACULTY,
      isStudent: user?.role === ROLES.STUDENT,
      hasRole: (roles) => {
        if (!user?.role) return false;
        if (Array.isArray(roles)) return roles.includes(user.role);
        return user.role === roles;
      },
    }),
    [user, loading]
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
  const { role, isAdmin, isDean, isFaculty, isStudent, hasRole } = useAuth();
  return { role, isAdmin, isDean, isFaculty, isStudent, hasRole };
}