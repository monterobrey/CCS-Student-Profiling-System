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
import FacultyManagement from "./pages/Shared/FacultyManagement";
import ViolationsList from "./pages/Dean/ViolationsList";
import StudentManagement from "./pages/Shared/StudentManagement";
import Settings from "./components/Settings";

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
              path="/dean/violations"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <ViolationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/violations/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <ViolationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/faculty-accounts"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <FacultyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/faculty-accounts/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <FacultyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/student-accounts"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/student-accounts/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <StudentManagement />
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
              path="/department-chair/faculty-accounts"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <FacultyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/faculty-accounts/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <FacultyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/violations"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <ViolationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/violations/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <ViolationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/student-accounts"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/student-accounts/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <StudentManagement />
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
              path="/secretary/faculty-accounts"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <FacultyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/faculty-accounts/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <FacultyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/student-accounts"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/student-accounts/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <StudentManagement />
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
              path="/student/settings"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/settings"
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
            <Route
              path="/dean/settings"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/settings"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/settings"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/settings"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <Settings />
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