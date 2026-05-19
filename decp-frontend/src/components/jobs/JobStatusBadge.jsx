const JobStatusBadge = ({ status }) => {
  const normalizedStatus = status || "UNKNOWN";

  return (
    <span className={`job-status-badge job-status-badge--${normalizedStatus.toLowerCase()}`}>
      {normalizedStatus}
    </span>
  );
};

export default JobStatusBadge;
