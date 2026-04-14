import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ROLES } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute, { DeanRoute } from "./components/ProtectedRoute";

import StudentLogin from "./pages/Auth/login/StudentLogin";
import FacultyLogin from "./pages/Auth/login/FacultyLogin";
import FacultyDashboard from "./pages/Faculty/FacultyDashboard";
import FacultySchedule from "./pages/Faculty/FacultySchedule";
import FacultyManagementViolation from "./pages/Faculty/FacultyManagementViolation";
import FacultySubject from "./pages/Faculty/FacultySubject";
import FacultyStudentsByClass from "./pages/Faculty/FacultyStudentsByClass";
import FacultyRecommendAward from "./pages/Faculty/FacultyRecommendAward";
import DepartmentChairDashboard from "./pages/Chair/DepartmentChairDashboard";
import DepartmentChairPerformance from "./pages/Chair/DepartmentChairPerformance";
import DepartmentChairAward from "./pages/Chair/DepartmentChairAward";
import ScheduleManagement from "./pages/Chair/ScheduleManagement";
import SetupPassword from "./pages/Shared/SetupPassword";
import StudentCurriculum from "./pages/Student/StudentCurriculum";

import Users from "./pages/Users/Users";
import UserDetail from "./pages/Users/UserDetail";
import Reports from "./pages/Reports/Reports";
import DeanDashboard from "./pages/Dean/DeanDashboard";
import SecretaryDashboard from "./pages/Secretary/SecretaryDashboard";
import ProfilingReport from "./pages/Dean/ProfilingReport";
import CurriculumManagement from "./pages/Dean/CurriculumManagement";
import CourseManagement from "./pages/Dean/CourseManagement";
import PerformanceOverview from "./pages/Dean/PerformanceOverview";
import FacultyManagement from "./pages/Shared/FacultyManagement";
import ViolationsList from "./pages/Shared/ViolationsList";
import AwardsList from "./pages/Shared/AwardsList";
import StudentManagement from "./pages/Shared/StudentManagement";
import FacultyWorkload from "./pages/Shared/FacultyWorkload";
import Settings from "./pages/Shared/Settings";
import ArchiveManagement from "./pages/Dean/ArchiveManagement";

// Import Student Pages
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentActivities from "./pages/Student/StudentActivities";
import StudentAwards from "./pages/Student/StudentAwards";
import StudentProfile from "./pages/Student/StudentProfile";
import StudentViolations from "./pages/Student/StudentViolations";
import StudentSchedule from "./pages/Student/StudentSchedule";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/students/login" element={<StudentLogin />} />
          <Route path="/faculty/login" element={<FacultyLogin />} />
          <Route path="/login" element={<Navigate to="/faculty/login" replace />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/setup-password-faculty" element={<SetupPassword />} />
          
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
              path="/dean/faculty-workload"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <FacultyWorkload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/archive"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <ArchiveManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dean/awards"
              element={
                <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
                  <AwardsList />
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
                  <DepartmentChairDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/performance"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <DepartmentChairPerformance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/awards"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <DepartmentChairAward />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-chair/schedule"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <ScheduleManagement />
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
              path="/department-chair/faculty-workload"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CHAIR]}>
                  <FacultyWorkload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <SecretaryDashboard />
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
              path="/secretary/faculty-workload"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <FacultyWorkload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/awards"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SECRETARY]}>
                  <AwardsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/activities"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <StudentActivities/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/awards"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <StudentAwards/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <StudentProfile/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/violations"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <StudentViolations/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/schedule"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <StudentSchedule/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/curriculum"
              element={
                <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                  <StudentSchedule/>
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
            <Route
              path="/faculty/subjects"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <FacultySubject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/students"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <FacultyStudentsByClass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/schedule"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <FacultySchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/violations"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <FacultyManagementViolation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/awards"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                  <FacultyRecommendAward />
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
