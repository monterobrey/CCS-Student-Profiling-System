import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./AppLayout.css";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, role } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header user={user} role={role} />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}