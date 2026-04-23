import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import StudentLogin from "./pages/Auth/login/StudentLogin";
import FacultyLogin from "./pages/Auth/login/FacultyLogin";
import SetupPassword from "./pages/Shared/SetupPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

import DeanRoutes from "./routes/DeanRoutes";
import ChairRoutes from "./routes/ChairRoutes";
import SecretaryRoutes from "./routes/SecretaryRoutes";
import FacultyRoutes from "./routes/FacultyRoutes";
import StudentRoutes from "./routes/StudentRoutes";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/students/login" element={<StudentLogin />} />
          <Route path="/faculty/login" element={<FacultyLogin />} />
          <Route path="/login" element={<Navigate to="/faculty/login" replace />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/setup-password-faculty" element={<SetupPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            {DeanRoutes}
            {ChairRoutes}
            {SecretaryRoutes}
            {FacultyRoutes}
            {StudentRoutes}
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/faculty/login" replace />} />
          <Route path="*" element={<Navigate to="/faculty/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
