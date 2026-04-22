import { Route } from "react-router-dom";
import { ROLES } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

import SecretaryDashboard from "../pages/Secretary/SecretaryDashboard";
import FacultyManagement from "../pages/Shared/FacultyManagement";
import FacultyWorkload from "../pages/Shared/FacultyWorkload";
import AwardsList from "../pages/Shared/AwardsList";
import StudentManagement from "../pages/Shared/StudentManagement";
import Settings from "../pages/Shared/Settings";
import Users from "../pages/Users/Users";
import UserDetail from "../pages/Users/UserDetail";
import Reports from "../pages/Reports/Reports";

const secretary = [ROLES.SECRETARY];

const SecretaryRoutes = (
  <>
    <Route path="/secretary/dashboard" element={<ProtectedRoute allowedRoles={secretary}><SecretaryDashboard /></ProtectedRoute>} />
    <Route path="/secretary/faculty-accounts" element={<ProtectedRoute allowedRoles={secretary}><FacultyManagement /></ProtectedRoute>} />
    <Route path="/secretary/faculty-accounts/:id" element={<ProtectedRoute allowedRoles={secretary}><FacultyManagement /></ProtectedRoute>} />
    <Route path="/secretary/faculty-workload" element={<ProtectedRoute allowedRoles={secretary}><FacultyWorkload /></ProtectedRoute>} />
    <Route path="/secretary/awards" element={<ProtectedRoute allowedRoles={secretary}><AwardsList /></ProtectedRoute>} />
    <Route path="/secretary/awards/:id" element={<ProtectedRoute allowedRoles={secretary}><AwardsList /></ProtectedRoute>} />
    <Route path="/secretary/student-accounts" element={<ProtectedRoute allowedRoles={secretary}><StudentManagement /></ProtectedRoute>} />
    <Route path="/secretary/student-accounts/:id" element={<ProtectedRoute allowedRoles={secretary}><StudentManagement /></ProtectedRoute>} />
    <Route path="/secretary/users" element={<ProtectedRoute allowedRoles={secretary}><Users /></ProtectedRoute>} />
    <Route path="/secretary/users/:type/:id" element={<ProtectedRoute allowedRoles={secretary}><UserDetail /></ProtectedRoute>} />
    <Route path="/secretary/reports" element={<ProtectedRoute allowedRoles={secretary}><Reports /></ProtectedRoute>} />
    <Route path="/secretary/settings" element={<ProtectedRoute allowedRoles={secretary}><Settings /></ProtectedRoute>} />
  </>
);

export default SecretaryRoutes;
