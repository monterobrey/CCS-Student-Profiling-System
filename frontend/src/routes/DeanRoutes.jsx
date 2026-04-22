import { Route } from "react-router-dom";
import { ROLES } from "../context/AuthContext";
import ProtectedRoute, { DeanRoute } from "../components/ProtectedRoute";

import DeanDashboard from "../pages/Dean/DeanDashboard";
import ProfilingReport from "../pages/Dean/ProfilingReport";
import CurriculumManagement from "../pages/Dean/CurriculumManagement";
import CourseManagement from "../pages/Dean/CourseManagement";
import PerformanceOverview from "../pages/Dean/PerformanceOverview";
import ArchiveManagement from "../pages/Dean/ArchiveManagement";
import FacultyManagement from "../pages/Shared/FacultyManagement";
import FacultyWorkload from "../pages/Shared/FacultyWorkload";
import ViolationsList from "../pages/Shared/ViolationsList";
import AwardsList from "../pages/Shared/AwardsList";
import StudentManagement from "../pages/Shared/StudentManagement";
import Settings from "../pages/Shared/Settings";
import Users from "../pages/Users/Users";
import UserDetail from "../pages/Users/UserDetail";
import Reports from "../pages/Reports/Reports";

const dean = [ROLES.DEAN];

const DeanRoutes = (
  <>
    <Route path="/dean/dashboard" element={<ProtectedRoute allowedRoles={dean}><DeanDashboard /></ProtectedRoute>} />
    <Route path="/dean/reports" element={<DeanRoute><Reports /></DeanRoute>} />
    <Route path="/dean/profiling-report" element={<ProtectedRoute allowedRoles={dean}><ProfilingReport /></ProtectedRoute>} />
    <Route path="/dean/curriculum" element={<ProtectedRoute allowedRoles={dean}><CurriculumManagement /></ProtectedRoute>} />
    <Route path="/dean/courses" element={<ProtectedRoute allowedRoles={dean}><CourseManagement /></ProtectedRoute>} />
    <Route path="/dean/performance" element={<ProtectedRoute allowedRoles={dean}><PerformanceOverview /></ProtectedRoute>} />
    <Route path="/dean/archive" element={<ProtectedRoute allowedRoles={dean}><ArchiveManagement /></ProtectedRoute>} />
    <Route path="/dean/violations" element={<ProtectedRoute allowedRoles={dean}><ViolationsList /></ProtectedRoute>} />
    <Route path="/dean/violations/:id" element={<ProtectedRoute allowedRoles={dean}><ViolationsList /></ProtectedRoute>} />
    <Route path="/dean/awards" element={<ProtectedRoute allowedRoles={dean}><AwardsList /></ProtectedRoute>} />
    <Route path="/dean/awards/:id" element={<ProtectedRoute allowedRoles={dean}><AwardsList /></ProtectedRoute>} />
    <Route path="/dean/faculty-accounts" element={<ProtectedRoute allowedRoles={dean}><FacultyManagement /></ProtectedRoute>} />
    <Route path="/dean/faculty-accounts/:id" element={<ProtectedRoute allowedRoles={dean}><FacultyManagement /></ProtectedRoute>} />
    <Route path="/dean/faculty-workload" element={<ProtectedRoute allowedRoles={dean}><FacultyWorkload /></ProtectedRoute>} />
    <Route path="/dean/student-accounts" element={<ProtectedRoute allowedRoles={dean}><StudentManagement /></ProtectedRoute>} />
    <Route path="/dean/student-accounts/:id" element={<ProtectedRoute allowedRoles={dean}><StudentManagement /></ProtectedRoute>} />
    <Route path="/dean/users" element={<ProtectedRoute allowedRoles={dean}><Users /></ProtectedRoute>} />
    <Route path="/dean/users/:type/:id" element={<ProtectedRoute allowedRoles={dean}><UserDetail /></ProtectedRoute>} />
    <Route path="/dean/settings" element={<ProtectedRoute allowedRoles={dean}><Settings /></ProtectedRoute>} />
  </>
);

export default DeanRoutes;
