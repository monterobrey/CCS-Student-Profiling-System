import { Route } from "react-router-dom";
import { ROLES } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

import FacultyDashboard from "../pages/Faculty/FacultyDashboard";
import FacultySchedule from "../pages/Faculty/FacultySchedule";
import FacultyManagementViolation from "../pages/Faculty/FacultyManagementViolation";
import FacultySubject from "../pages/Faculty/FacultySubject";
import FacultyStudentsByClass from "../pages/Faculty/FacultyStudentsByClass";
import FacultyRecommendAward from "../pages/Faculty/FacultyRecommendAward";
import FacultyProfile from "../pages/Faculty/FacultyProfile";
import Settings from "../pages/Shared/Settings";

const faculty = [ROLES.FACULTY];

const FacultyRoutes = (
  <>
    <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={faculty}><FacultyDashboard /></ProtectedRoute>} />
    <Route path="/faculty/profile" element={<ProtectedRoute allowedRoles={faculty}><FacultyProfile /></ProtectedRoute>} />
    <Route path="/faculty/schedule" element={<ProtectedRoute allowedRoles={faculty}><FacultySchedule /></ProtectedRoute>} />
    <Route path="/faculty/subjects" element={<ProtectedRoute allowedRoles={faculty}><FacultySubject /></ProtectedRoute>} />
    <Route path="/faculty/students" element={<ProtectedRoute allowedRoles={faculty}><FacultyStudentsByClass /></ProtectedRoute>} />
    <Route path="/faculty/violations" element={<ProtectedRoute allowedRoles={faculty}><FacultyManagementViolation /></ProtectedRoute>} />
    <Route path="/faculty/violations/:id" element={<ProtectedRoute allowedRoles={faculty}><FacultyManagementViolation /></ProtectedRoute>} />
    <Route path="/faculty/awards" element={<ProtectedRoute allowedRoles={faculty}><FacultyRecommendAward /></ProtectedRoute>} />
    <Route path="/faculty/settings" element={<ProtectedRoute allowedRoles={faculty}><Settings /></ProtectedRoute>} />
  </>
);

export default FacultyRoutes;
