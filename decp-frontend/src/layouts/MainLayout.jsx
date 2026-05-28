import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import NotificationBadge from "../components/notifications/NotificationBadge";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import "./MainLayout.css";

const MainLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const normalizedRole = user?.role?.toUpperCase();
  const isStudent = normalizedRole === "STUDENT";
  const isAlumni = normalizedRole === "ALUMNI";
  const isAdmin = normalizedRole === "ADMIN";
  const canCreateJob = isAlumni || isAdmin;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">DECP Platform</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/jobs">Jobs</NavLink>
          <NavLink className="sidebar-nav__notification-link" to="/notifications">
            <span>Notifications</span>
            <NotificationBadge compact />
          </NavLink>
          {canCreateJob && <NavLink to="/jobs/create">Create Job</NavLink>}
          {isAlumni && <NavLink to="/recruiter/dashboard">Recruiter Dashboard</NavLink>}
          {isStudent && <NavLink to="/jobs/saved">Saved Jobs</NavLink>}
          {isStudent && <NavLink to="/applications/me">My Applications</NavLink>}
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/settings/change-password">Change Password</NavLink>
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <p className="user-email">{user?.email}</p>
            <p className="user-role">{user?.role}</p>
          </div>
          <div className="topbar-actions">
            <NotificationDropdown />
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
