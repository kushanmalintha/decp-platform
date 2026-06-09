import { useEffect, useMemo, useRef, useState } from "react";
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
  Moon,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../auth/useAuth";
import NotificationBadge from "../components/notifications/NotificationBadge";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import "./MainLayout.css";

const THEME_STORAGE_KEY = "decp-theme";

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
};

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
  const settingsMenuRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const normalizedRole = user?.role?.toUpperCase();
  const isStudent = normalizedRole === "STUDENT";
  const isAlumni = normalizedRole === "ALUMNI";
  const isAdmin = normalizedRole === "ADMIN";
  const canCreateJob = isAlumni || isAdmin;
  const isDarkTheme = theme === "dark";
  const pageMeta = useMemo(() => getPageMeta(location.pathname), [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle("sidebar-drawer-open", sidebarOpen);

    return () => {
      document.body.classList.remove("sidebar-drawer-open");
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!settingsMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!settingsMenuRef.current?.contains(event.target)) {
        setSettingsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSettingsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsMenuOpen]);

  const handleLogout = async () => {
    setSettingsMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
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
      items: [{ to: "/profile", label: "Profile", icon: UserRound }],
    },
  ].filter((section) => section.items.length > 0);

  const renderNavItem = (item) => {
    const NavIcon = item.icon;

    return (
      <NavLink
        className="sidebar-nav__item"
        key={item.to}
        to={item.to}
        onClick={() => {
          setSidebarOpen(false);
          setSettingsMenuOpen(false);
        }}
      >
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
              onClick={() => {
                setSidebarOpen(true);
                setSettingsMenuOpen(false);
              }}
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
            <NotificationDropdown />
            <div className="topbar-settings" ref={settingsMenuRef}>
              <button
                className={`topbar-settings__trigger ui-icon-button${
                  settingsMenuOpen ? " topbar-settings__trigger--active" : ""
                }`}
                type="button"
                aria-haspopup="menu"
                aria-expanded={settingsMenuOpen}
                aria-label="Open settings menu"
                title="Settings"
                onClick={() => setSettingsMenuOpen((isOpen) => !isOpen)}
              >
                <Settings size={18} aria-hidden="true" />
              </button>

              {settingsMenuOpen && (
                <div className="topbar-settings__menu" role="menu" aria-label="Settings menu">
                  <button
                    className="topbar-settings__item topbar-settings__item--toggle ui-button ui-button--secondary"
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isDarkTheme}
                    onClick={handleThemeToggle}
                  >
                    <span className="topbar-settings__item-main">
                      {isDarkTheme ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
                      Dark Mode
                    </span>
                    <span className="topbar-settings__switch" aria-hidden="true">
                      <span />
                    </span>
                  </button>
                  <button
                    className="topbar-settings__item ui-button ui-button--secondary"
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={17} aria-hidden="true" />
                    Logout
                  </button>
                </div>
              )}
            </div>
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
