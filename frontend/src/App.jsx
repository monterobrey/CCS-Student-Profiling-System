import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";
import StudentLogin from "./pages/Auth/login/StudentLogin";
import FacultyLogin from "./pages/Auth/login/FacultyLogin";
import Users from "./pages/Users/Users";
import UserDetail from "./pages/Users/UserDetail";
import Reports from "./pages/Reports/Reports";
import DeanDashboard from "./pages/Dean/DeanDashboard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/students/login" element={<StudentLogin />} />
          <Route path="/faculty/login" element={<FacultyLogin />} />
          
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DeanDashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetail />} />
            
            <Route element={
              <AdminRoute>
                <Reports />
              </AdminRoute>
            } path="/reports" />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;