import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  ClipboardList,
  MessageCircle,
  PlusCircle,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { getPosts } from "../../api/feedApi";
import {
  getJobs,
  getMyApplications,
  getRecruiterDashboard,
  getSavedJobs,
} from "../../api/jobApi";
import { getCurrentUserProfile } from "../../api/userApi";
import { useAuth } from "../../auth/useAuth";
import { JOB_OPTION_LABELS } from "../../constants/jobOptions";
import "./Dashboard.css";

const DASHBOARD_JOB_QUERY = {
  page: 0,
  size: 4,
  sort: "createdAt,desc",
  status: "OPEN",
};

const DASHBOARD_FEED_QUERY = {
  page: 0,
  size: 4,
  sort: "createdAt,desc",
};

const normalizeRole = (role) => role?.toUpperCase?.() ?? "";

const normalizePage = (pageData) => {
  if (Array.isArray(pageData)) {
    return {
      content: pageData,
      totalElements: pageData.length,
    };
  }

  return {
    content: Array.isArray(pageData?.content) ? pageData.content : [],
    totalElements: Number.isInteger(pageData?.totalElements) ? pageData.totalElements : null,
  };
};

const getErrorMessage = (error, fallback) => error.response?.data?.message ?? error.message ?? fallback;

const formatDate = (value) => {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return JOB_OPTION_LABELS[value] ?? value;
};

const formatNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getFirstName = (profile, user) => {
  const rawName = profile?.name || user?.email?.split("@")[0] || "there";
  return rawName.split(" ")[0];
};

const getCount = (page) => page?.totalElements ?? page?.content?.length ?? 0;

const getProfileCompletion = (profile, user) => {
  const fields = [
    { label: "Email", value: profile?.email || user?.email },
    { label: "Name", value: profile?.name },
    { label: "University", value: profile?.university },
    { label: "Degree", value: profile?.degree },
    { label: "Graduation Year", value: profile?.graduationYear },
    { label: "Bio", value: profile?.bio },
    { label: "Skills", value: Array.isArray(profile?.skills) && profile.skills.filter(Boolean).length > 0 },
    { label: "LinkedIn or GitHub", value: profile?.linkedinUrl || profile?.githubUrl },
  ];
  const completed = fields.filter((field) => Boolean(field.value)).length;
  const percentage = Math.round((completed / fields.length) * 100);

  return {
    completed,
    fields,
    missing: fields.filter((field) => !field.value).map((field) => field.label),
    percentage,
  };
};

const getRequestLabel = (key) =>
  ({
    applications: "applications",
    jobsPage: "career opportunities",
    postsPage: "engagement updates",
    profile: "profile",
    recruiterDashboard: "recruiter dashboard",
    savedJobsPage: "saved jobs",
  })[key] ?? "dashboard data";

const Dashboard = () => {
  const { user } = useAuth();
  const normalizedRole = normalizeRole(user?.role);
  const isStudent = normalizedRole === "STUDENT";
  const isAlumni = normalizedRole === "ALUMNI";
  const isAdmin = normalizedRole === "ADMIN";
  const canPostOpportunity = isAlumni || isAdmin;
  const [dashboardData, setDashboardData] = useState({
    applications: [],
    jobsPage: normalizePage([]),
    postsPage: normalizePage([]),
    profile: null,
    recruiterDashboard: null,
    savedJobsPage: normalizePage([]),
  });
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setWarnings([]);

      const requests = [
        { key: "profile", promise: getCurrentUserProfile() },
        { key: "jobsPage", promise: getJobs(DASHBOARD_JOB_QUERY) },
        { key: "postsPage", promise: getPosts(DASHBOARD_FEED_QUERY) },
      ];

      if (isStudent) {
        requests.push(
          { key: "savedJobsPage", promise: getSavedJobs({ page: 0, size: 4, sort: "createdAt,desc" }) },
          { key: "applications", promise: getMyApplications() },
        );
      }

      if (isAlumni) {
        requests.push({ key: "recruiterDashboard", promise: getRecruiterDashboard() });
      }

      const results = await Promise.allSettled(requests.map((request) => request.promise));

      if (!isMounted) {
        return;
      }

      const nextData = {
        applications: [],
        jobsPage: normalizePage([]),
        postsPage: normalizePage([]),
        profile: null,
        recruiterDashboard: null,
        savedJobsPage: normalizePage([]),
      };
      const nextWarnings = [];

      results.forEach((result, index) => {
        const key = requests[index].key;

        if (result.status === "fulfilled") {
          if (key === "jobsPage" || key === "postsPage" || key === "savedJobsPage") {
            nextData[key] = normalizePage(result.value);
            return;
          }

          if (key === "applications") {
            nextData.applications = Array.isArray(result.value) ? result.value : [];
            return;
          }

          nextData[key] = result.value ?? null;
          return;
        }

        nextWarnings.push(
          `Unable to load ${getRequestLabel(key)}: ${getErrorMessage(result.reason, "Please try again later.")}`,
        );
      });

      setDashboardData(nextData);
      setWarnings(nextWarnings);
      setLoading(false);
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [isAlumni, isStudent]);

  const profileCompletion = useMemo(
    () => getProfileCompletion(dashboardData.profile, user),
    [dashboardData.profile, user],
  );

  const quickActions = useMemo(
    () =>
      [
        { to: "/profile/edit", label: "Update Profile", icon: UserRound },
        { to: "/jobs", label: "Explore Career Hub", icon: BriefcaseBusiness },
        { to: "/feed", label: "View Engagement", icon: MessageCircle },
        isStudent && { to: "/applications/me", label: "Track Applications", icon: ClipboardList },
        isStudent && { to: "/jobs/saved", label: "Saved Jobs", icon: Bookmark },
        canPostOpportunity && { to: "/jobs/create", label: "Post Opportunity", icon: PlusCircle },
        isAlumni && { to: "/recruiter/dashboard", label: "Recruiter Dashboard", icon: BarChart3 },
        isAdmin && { to: "/admin/roles", label: "Role Management", icon: ShieldCheck },
        { to: "/settings/change-password", label: "Account Settings", icon: Settings },
      ].filter(Boolean),
    [canPostOpportunity, isAdmin, isAlumni, isStudent],
  );

  const metricCards = useMemo(
    () =>
      [
        {
          label: "Profile Completion",
          value: `${profileCompletion.percentage}%`,
          helper: `${profileCompletion.completed}/${profileCompletion.fields.length} profile fields`,
        },
        {
          label: "Open Opportunities",
          value: formatNumber(getCount(dashboardData.jobsPage)),
          helper: "Career items available",
        },
        {
          label: "Engagement Updates",
          value: formatNumber(getCount(dashboardData.postsPage)),
          helper: "Recent feed activity",
        },
        isStudent && {
          label: "Applications",
          value: formatNumber(dashboardData.applications.length),
          helper: "Submitted by you",
        },
        isStudent && {
          label: "Saved Jobs",
          value: formatNumber(getCount(dashboardData.savedJobsPage)),
          helper: "Bookmarked opportunities",
        },
        isAlumni && {
          label: "Posted Jobs",
          value: formatNumber(dashboardData.recruiterDashboard?.jobsPosted),
          helper: "Shared with DECP",
        },
        isAlumni && {
          label: "Total Applications",
          value: formatNumber(dashboardData.recruiterDashboard?.totalApplications),
          helper: "Across your postings",
        },
      ].filter(Boolean),
    [dashboardData, isAlumni, isStudent, profileCompletion],
  );

  const jobs = dashboardData.jobsPage.content;
  const posts = dashboardData.postsPage.content;
  const applications = dashboardData.applications.slice(0, 3);
  const savedJobs = dashboardData.savedJobsPage.content.slice(0, 3);
  const missingProfileItems = profileCompletion.missing.slice(0, 3);

  return (
    <section className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <p className="dashboard-welcome__eyebrow">{normalizedRole || "Member"} Workspace</p>
          <h2>Welcome back, {getFirstName(dashboardData.profile, user)}.</h2>
          <p>
            Use this overview to keep your profile current, follow department updates, and move through
            career actions without hunting through the platform.
          </p>
        </div>
        <Link className="dashboard-welcome__cta" to="/jobs">
          Explore opportunities
        </Link>
      </div>

      {warnings.length > 0 && (
        <div className="dashboard-warning" role="status">
          Some dashboard cards could not refresh. The rest of the page is still available.
        </div>
      )}

      <div className="dashboard-metrics" aria-label="Dashboard summary">
        {metricCards.map((metric) => (
          <article className="dashboard-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{loading ? "..." : metric.value}</strong>
            <p>{metric.helper}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel--wide" aria-labelledby="dashboard-opportunities-heading">
          <div className="dashboard-panel__header">
            <div>
              <h2 id="dashboard-opportunities-heading">Career Opportunities</h2>
              <p>Open roles and internships most recently shared through DECP.</p>
            </div>
            <Link to="/jobs">View all</Link>
          </div>

          {loading ? (
            <div className="dashboard-state">Loading opportunities...</div>
          ) : jobs.length > 0 ? (
            <div className="dashboard-list">
              {jobs.map((job) => (
                <Link className="dashboard-list-item" key={job.id} to={`/jobs/${job.id}`}>
                  <div>
                    <h3>{formatValue(job.title)}</h3>
                    <p>{formatValue(job.companyName)}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Type</dt>
                      <dd>{formatValue(job.jobType)}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{formatValue(job.location)}</dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <h3>No open opportunities yet</h3>
              <p>New jobs and internships will appear here when they are shared.</p>
              <Link to="/jobs">Browse Career Hub</Link>
            </div>
          )}
        </section>

        <section className="dashboard-panel" aria-labelledby="dashboard-profile-heading">
          <div className="dashboard-panel__header">
            <div>
              <h2 id="dashboard-profile-heading">Profile Readiness</h2>
              <p>Complete profile details to improve career relevance.</p>
            </div>
          </div>

          <div className="dashboard-progress">
            <div>
              <strong>{profileCompletion.percentage}%</strong>
              <span>Complete</span>
            </div>
            <progress max="100" value={profileCompletion.percentage}>
              {profileCompletion.percentage}%
            </progress>
          </div>

          {missingProfileItems.length > 0 ? (
            <div className="dashboard-checklist">
              <p>Next fields to add</p>
              <ul>
                {missingProfileItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="dashboard-complete">Your profile has the core details filled in.</div>
          )}

          <Link className="dashboard-secondary-link" to="/profile/edit">
            Edit profile
          </Link>
        </section>

        <section className="dashboard-panel" aria-labelledby="dashboard-actions-heading">
          <div className="dashboard-panel__header">
            <div>
              <h2 id="dashboard-actions-heading">Quick Actions</h2>
              <p>Common paths based on your role.</p>
            </div>
          </div>

          <div className="dashboard-actions">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;

              return (
                <Link className="dashboard-action" key={action.to} to={action.to}>
                  <ActionIcon size={18} aria-hidden="true" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="dashboard-panel dashboard-panel--wide" aria-labelledby="dashboard-feed-heading">
          <div className="dashboard-panel__header">
            <div>
              <h2 id="dashboard-feed-heading">Recent Engagement</h2>
              <p>Latest department discussions and job-generated updates.</p>
            </div>
            <Link to="/feed">Open feed</Link>
          </div>

          {loading ? (
            <div className="dashboard-state">Loading engagement updates...</div>
          ) : posts.length > 0 ? (
            <div className="dashboard-feed-list">
              {posts.map((post) => (
                <Link className="dashboard-feed-item" key={post.id} to={`/feed/posts/${post.id}`}>
                  <div>
                    <h3>{post.authorEmail || "Department update"}</h3>
                    <p>{post.content || "No content provided."}</p>
                  </div>
                  <span>{formatDate(post.createdAt)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <h3>No engagement updates yet</h3>
              <p>Posts, announcements, and job activity will appear here when the feed is active.</p>
              <Link to="/feed">Go to Engagement</Link>
            </div>
          )}
        </section>

        {isStudent && (
          <section className="dashboard-panel" aria-labelledby="dashboard-student-heading">
            <div className="dashboard-panel__header">
              <div>
                <h2 id="dashboard-student-heading">Student Career Tracker</h2>
                <p>Saved jobs and application activity in one place.</p>
              </div>
            </div>

            <div className="dashboard-mini-list">
              <h3>Applications</h3>
              {loading ? (
                <p>Loading applications...</p>
              ) : applications.length > 0 ? (
                applications.map((application) => (
                  <Link key={application.id ?? application.appliedAt} to="/applications/me">
                    <span>{formatValue(application.status)}</span>
                    <small>{formatDate(application.appliedAt)}</small>
                  </Link>
                ))
              ) : (
                <p>No applications submitted yet.</p>
              )}
            </div>

            <div className="dashboard-mini-list">
              <h3>Saved Jobs</h3>
              {loading ? (
                <p>Loading saved jobs...</p>
              ) : savedJobs.length > 0 ? (
                savedJobs.map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`}>
                    <span>{formatValue(job.title)}</span>
                    <small>{formatValue(job.companyName)}</small>
                  </Link>
                ))
              ) : (
                <p>No saved jobs yet.</p>
              )}
            </div>
          </section>
        )}

        {isAlumni && (
          <section className="dashboard-panel" aria-labelledby="dashboard-recruiter-heading">
            <div className="dashboard-panel__header">
              <div>
                <h2 id="dashboard-recruiter-heading">Recruiter Snapshot</h2>
                <p>Application status across your posted opportunities.</p>
              </div>
              <Link to="/recruiter/dashboard">Details</Link>
            </div>

            {loading ? (
              <div className="dashboard-state">Loading recruiter stats...</div>
            ) : (
              <dl className="dashboard-status-grid">
                <div>
                  <dt>Reviewing</dt>
                  <dd>{formatNumber(dashboardData.recruiterDashboard?.reviewing)}</dd>
                </div>
                <div>
                  <dt>Shortlisted</dt>
                  <dd>{formatNumber(dashboardData.recruiterDashboard?.shortlisted)}</dd>
                </div>
                <div>
                  <dt>Accepted</dt>
                  <dd>{formatNumber(dashboardData.recruiterDashboard?.accepted)}</dd>
                </div>
                <div>
                  <dt>Rejected</dt>
                  <dd>{formatNumber(dashboardData.recruiterDashboard?.rejected)}</dd>
                </div>
              </dl>
            )}
          </section>
        )}
      </div>

      {warnings.length > 0 && (
        <details className="dashboard-warning-details">
          <summary>Dashboard refresh details</summary>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

export default Dashboard;
