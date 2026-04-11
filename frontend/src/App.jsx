import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ROLES } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute, { DeanRoute } from "./components/ProtectedRoute";
import StudentLogin from "./pages/Auth/login/StudentLogin";
import FacultyLogin from "./pages/Auth/login/FacultyLogin";
import Users from "./pages/Users/Users";
import UserDetail from "./pages/Users/UserDetail";
import Reports from "./pages/Reports/Reports";
import DeanDashboard from "./pages/Dean/DeanDashboard";
import ProfilingReport from "./pages/Dean/ProfilingReport";
import CurriculumManagement from "./pages/Dean/CurriculumManagement";
import CourseManagement from "./pages/Dean/CourseManagement";
import PerformanceOverview from "./pages/Dean/PerformanceOverview";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/students/login" element={<StudentLogin />} />
          <Route path="/faculty/login" element={<FacultyLogin />} />
          <Route path="/login" element={<Navigate to="/faculty/login" replace />} />
          
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route
              path="/dean/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <DeanDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/reports"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <ProfilingReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/curriculum"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <CurriculumManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/courses"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <CourseManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/performance"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <PerformanceOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <DeanDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <DeanDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <DeanDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <DeanDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dean/users"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/users"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/users"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dean/users/:type/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <UserDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/users/:type/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <UserDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/users/:type/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <UserDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dean/reports"
              element={
                <DeanRoute>
                  <Reports />
                </DeanRoute>
              }
            />
            <Route
              path="/department-chair/reports"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/reports"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/faculty/login" replace />} />
          <Route path="*" element={<Navigate to="/faculty/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;