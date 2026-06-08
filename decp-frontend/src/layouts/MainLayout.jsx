import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../auth/useAuth";
import NotificationBadge from "../components/notifications/NotificationBadge";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import "./MainLayout.css";

const getPageMeta = (pathname) => {
  if (pathname === "/dashboard") {
    return {
      title: "Dashboard",
      eyebrow: "Workspace",
      description: "Your department engagement and career activity at a glance.",
    };
  }

  if (pathname.startsWith("/feed/posts")) {
    return {
      title: "Post Details",
      eyebrow: "Engagement",
      description: "Follow the conversation and department context.",
    };
  }

  if (pathname.startsWith("/feed")) {
    return {
      title: "Engagement Feed",
      eyebrow: "Engagement",
      description: "Department updates, discussions, and career announcements.",
    };
  }

  if (pathname.startsWith("/notifications")) {
    return {
      title: "Notifications",
      eyebrow: "Updates",
      description: "Review recent alerts and activity from DECP.",
    };
  }

  if (pathname.startsWith("/jobs/create")) {
    return {
      title: "Post Opportunity",
      eyebrow: "Career Hub",
      description: "Share a job or internship with the department network.",
    };
  }

  if (pathname.startsWith("/jobs/saved")) {
    return {
      title: "Saved Jobs",
      eyebrow: "Career Hub",
      description: "Return to opportunities you want to track.",
    };
  }

  if (pathname.startsWith("/applications/me")) {
    return {
      title: "My Applications",
      eyebrow: "Career Hub",
      description: "Track the status of your submitted applications.",
    };
  }

  if (pathname.startsWith("/jobs/") && pathname.endsWith("/applications")) {
    return {
      title: "Job Applications",
      eyebrow: "Recruiting",
      description: "Review candidates and manage application progress.",
    };
  }

  if (pathname.startsWith("/jobs/") && pathname.endsWith("/edit")) {
    return {
      title: "Edit Opportunity",
      eyebrow: "Career Hub",
      description: "Keep opportunity details accurate and useful.",
    };
  }

  if (pathname.startsWith("/jobs/")) {
    return {
      title: "Opportunity Details",
      eyebrow: "Career Hub",
      description: "Review role details, requirements, and discussion.",
    };
  }

  if (pathname.startsWith("/jobs")) {
    return {
      title: "Career Hub",
      eyebrow: "Opportunities",
      description: "Explore jobs, internships, and career pathways.",
    };
  }

  if (pathname.startsWith("/recruiter/dashboard")) {
    return {
      title: "Recruiter Dashboard",
      eyebrow: "Recruiting",
      description: "Manage posted opportunities and applicant activity.",
    };
  }

  if (pathname.startsWith("/profile/edit")) {
    return {
      title: "Edit Profile",
      eyebrow: "Account",
      description: "Keep your academic, skills, and career details current.",
    };
  }

  if (pathname.startsWith("/profile")) {
    return {
      title: "Profile",
      eyebrow: "Account",
      description: "Your academic identity and career interests.",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      title: "Settings",
      eyebrow: "Account",
      description: "Manage account security and preferences.",
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      title: "Admin Roles",
      eyebrow: "Administration",
      description: "Manage role assignments and platform access.",
    };
  }

  return {
    title: "DECP Platform",
    eyebrow: "Workspace",
    description: "Department engagement and career development.",
  };
};

const MainLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const normalizedRole = user?.role?.toUpperCase();
  const isStudent = normalizedRole === "STUDENT";
  const isAlumni = normalizedRole === "ALUMNI";
  const isAdmin = normalizedRole === "ADMIN";
  const canCreateJob = isAlumni || isAdmin;
  const pageMeta = useMemo(() => getPageMeta(location.pathname), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navSections = [
    {
      label: "Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/feed", label: "Engagement", icon: MessageCircle },
        { to: "/jobs", label: "Career Hub", icon: BriefcaseBusiness },
        {
          to: "/notifications",
          label: "Notifications",
          icon: Bell,
          trailing: <NotificationBadge compact />,
        },
      ],
    },
    {
      label: "Career",
      items: [
        canCreateJob && { to: "/jobs/create", label: "Post Opportunity", icon: PlusCircle },
        isAlumni && { to: "/recruiter/dashboard", label: "Recruiter Dashboard", icon: BarChart3 },
        isStudent && { to: "/jobs/saved", label: "Saved Jobs", icon: Bookmark },
        isStudent && { to: "/applications/me", label: "My Applications", icon: ClipboardList },
      ].filter(Boolean),
    },
    {
      label: "Admin",
      items: [isAdmin && { to: "/admin/roles", label: "Role Management", icon: ShieldCheck }].filter(Boolean),
    },
    {
      label: "Account",
      items: [
        { to: "/profile", label: "Profile", icon: UserRound },
        { to: "/settings/change-password", label: "Settings", icon: Settings },
      ],
    },
  ].filter((section) => section.items.length > 0);

  const renderNavItem = (item) => {
    const NavIcon = item.icon;

    return (
      <NavLink className="sidebar-nav__item" key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
        <span className="sidebar-nav__item-main">
          <NavIcon size={18} aria-hidden="true" />
          <span>{item.label}</span>
        </span>
        {item.trailing && <span className="sidebar-nav__item-trailing">{item.trailing}</span>}
      </NavLink>
    );
  };

  return (
    <div className="app-shell">
      <button
        className={`sidebar-backdrop${sidebarOpen ? " sidebar-backdrop--visible" : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`} id="primary-navigation">
        <div className="sidebar-header">
          <div className="brand" aria-label="DECP Platform">
            <span className="brand-mark">D</span>
            <span>
              <span className="brand-name">DECP</span>
              <span className="brand-caption">Engagement & Careers</span>
            </span>
          </div>
          <button
            className="sidebar-close ui-icon-button"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navSections.map((section) => (
            <section className="sidebar-nav__section" key={section.label}>
              <h2 className="sidebar-nav__section-title">{section.label}</h2>
              <div className="sidebar-nav__items">{section.items.map(renderNavItem)}</div>
            </section>
          ))}
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-heading">
            <button
              className="sidebar-toggle ui-icon-button"
              type="button"
              aria-controls="primary-navigation"
              aria-expanded={sidebarOpen}
              aria-label="Open navigation"
              title="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <div>
              <p className="topbar-eyebrow">{pageMeta.eyebrow}</p>
              <h1>{pageMeta.title}</h1>
              <p className="topbar-description">{pageMeta.description}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-user" aria-label="Signed in user">
              <p className="user-email">{user?.email}</p>
              <p className="user-role">{user?.role}</p>
            </div>
            <NotificationDropdown />
            <button className="topbar-logout ui-button ui-button--secondary" type="button" onClick={handleLogout}>
              <LogOut size={17} aria-hidden="true" />
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
