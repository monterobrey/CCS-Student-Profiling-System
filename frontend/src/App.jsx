import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StudentLogin from "./pages/Auth/login/StudentLogin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/students/login" element={<StudentLogin />} />
      </Routes>
    </Router>
  );
}

export default App;