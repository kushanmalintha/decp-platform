const APPLICATION_STATUS_LABELS = {
  APPLIED: "Applied",
  REVIEWING: "Reviewing",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted",
};

const ApplicationStatusBadge = ({ status }) => {
  const normalizedStatus = status || "UNKNOWN";
  const label = APPLICATION_STATUS_LABELS[normalizedStatus] ?? normalizedStatus;

  return (
    <span className={`application-status-badge application-status-badge--${normalizedStatus.toLowerCase()}`}>
      {label}
    </span>
  );
};

export default ApplicationStatusBadge;
