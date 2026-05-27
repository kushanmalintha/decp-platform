const DASHBOARD_METRICS = [
  { key: "jobsPosted", label: "Jobs Posted" },
  { key: "openJobs", label: "Open Jobs" },
  { key: "closedJobs", label: "Closed Jobs" },
  { key: "totalApplications", label: "Total Applications" },
  { key: "applied", label: "Applied" },
  { key: "reviewing", label: "Reviewing" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

const formatNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const RecruiterDashboardCards = ({ dashboard }) => (
  <div className="recruiter-dashboard-cards">
    {DASHBOARD_METRICS.map((metric) => (
      <article className="recruiter-dashboard-card" key={metric.key}>
        <span>{metric.label}</span>
        <strong>{formatNumber(dashboard?.[metric.key])}</strong>
      </article>
    ))}
  </div>
);

export default RecruiterDashboardCards;
