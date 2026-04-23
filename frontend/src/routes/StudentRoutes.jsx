import { Route } from "react-router-dom";
import { ROLES } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

import StudentDashboard from "../pages/Student/StudentDashboard";
import StudentActivities from "../pages/Student/StudentActivities";
import StudentAwards from "../pages/Student/StudentAwards";
import StudentProfile from "../pages/Student/StudentProfile";
import StudentViolations from "../pages/Student/StudentViolations";
import StudentSchedule from "../pages/Student/StudentSchedule";
import StudentCurriculum from "../pages/Student/StudentCurriculum";
import StudentAffiliations from "../pages/Student/StudentAffiliations";
import Settings from "../pages/Shared/Settings";

const student = [ROLES.STUDENT];

const StudentRoutes = (
  <>
    <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={student}><StudentDashboard /></ProtectedRoute>} />
    <Route path="/student/activities" element={<ProtectedRoute allowedRoles={student}><StudentActivities /></ProtectedRoute>} />
    <Route path="/student/awards" element={<ProtectedRoute allowedRoles={student}><StudentAwards /></ProtectedRoute>} />
    <Route path="/student/awards/:id" element={<ProtectedRoute allowedRoles={student}><StudentAwards /></ProtectedRoute>} />
    <Route path="/student/profile" element={<ProtectedRoute allowedRoles={student}><StudentProfile /></ProtectedRoute>} />
    <Route path="/student/violations" element={<ProtectedRoute allowedRoles={student}><StudentViolations /></ProtectedRoute>} />
    <Route path="/student/schedule" element={<ProtectedRoute allowedRoles={student}><StudentSchedule /></ProtectedRoute>} />
    <Route path="/student/curriculum" element={<ProtectedRoute allowedRoles={student}><StudentCurriculum /></ProtectedRoute>} />
    <Route path="/student/affiliations" element={<ProtectedRoute allowedRoles={student}><StudentAffiliations /></ProtectedRoute>} />
    <Route path="/student/settings" element={<ProtectedRoute allowedRoles={student}><Settings /></ProtectedRoute>} />
  </>
);

export default StudentRoutes;
