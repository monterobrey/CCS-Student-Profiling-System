import { Route } from "react-router-dom";
import { ROLES } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

import DepartmentChairDashboard from "../pages/Chair/DepartmentChairDashboard";
import DepartmentChairPerformance from "../pages/Chair/DepartmentChairPerformance";
import DepartmentChairAward from "../pages/Chair/DepartmentChairAward";
import ScheduleManagement from "../pages/Chair/ScheduleManagement";
import FacultyManagement from "../pages/Shared/FacultyManagement";
import FacultyWorkload from "../pages/Shared/FacultyWorkload";
import ViolationsList from "../pages/Shared/ViolationsList";
import StudentManagement from "../pages/Shared/StudentManagement";
import Settings from "../pages/Shared/Settings";
import Users from "../pages/Users/Users";
import UserDetail from "../pages/Users/UserDetail";
import Reports from "../pages/Reports/Reports";

const chair = [ROLES.CHAIR];

const ChairRoutes = (
  <>
    <Route path="/department-chair/dashboard" element={<ProtectedRoute allowedRoles={chair}><DepartmentChairDashboard /></ProtectedRoute>} />
    <Route path="/department-chair/performance" element={<ProtectedRoute allowedRoles={chair}><DepartmentChairPerformance /></ProtectedRoute>} />
    <Route path="/department-chair/awards" element={<ProtectedRoute allowedRoles={chair}><DepartmentChairAward /></ProtectedRoute>} />
    <Route path="/department-chair/awards/:id" element={<ProtectedRoute allowedRoles={chair}><DepartmentChairAward /></ProtectedRoute>} />
    <Route path="/department-chair/schedule" element={<ProtectedRoute allowedRoles={chair}><ScheduleManagement /></ProtectedRoute>} />
    <Route path="/department-chair/violations" element={<ProtectedRoute allowedRoles={chair}><ViolationsList /></ProtectedRoute>} />
    <Route path="/department-chair/violations/:id" element={<ProtectedRoute allowedRoles={chair}><ViolationsList /></ProtectedRoute>} />
    <Route path="/department-chair/faculty-accounts" element={<ProtectedRoute allowedRoles={chair}><FacultyManagement /></ProtectedRoute>} />
    <Route path="/department-chair/faculty-accounts/:id" element={<ProtectedRoute allowedRoles={chair}><FacultyManagement /></ProtectedRoute>} />
    <Route path="/department-chair/faculty-workload" element={<ProtectedRoute allowedRoles={chair}><FacultyWorkload /></ProtectedRoute>} />
    <Route path="/department-chair/student-accounts" element={<ProtectedRoute allowedRoles={chair}><StudentManagement /></ProtectedRoute>} />
    <Route path="/department-chair/student-accounts/:id" element={<ProtectedRoute allowedRoles={chair}><StudentManagement /></ProtectedRoute>} />
    <Route path="/department-chair/users" element={<ProtectedRoute allowedRoles={chair}><Users /></ProtectedRoute>} />
    <Route path="/department-chair/users/:type/:id" element={<ProtectedRoute allowedRoles={chair}><UserDetail /></ProtectedRoute>} />
    <Route path="/department-chair/reports" element={<ProtectedRoute allowedRoles={chair}><Reports /></ProtectedRoute>} />
    <Route path="/department-chair/settings" element={<ProtectedRoute allowedRoles={chair}><Settings /></ProtectedRoute>} />
  </>
);

export default ChairRoutes;
