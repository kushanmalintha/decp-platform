import { JOB_OPTION_LABELS } from "../../constants/jobOptions";

const ApplicationStatusBadge = ({ status }) => {
  const normalizedStatus = status || "UNKNOWN";
  const label = JOB_OPTION_LABELS[normalizedStatus] ?? normalizedStatus;

  return (
    <span className={`application-status-badge application-status-badge--${normalizedStatus.toLowerCase()}`}>
      {label}
    </span>
  );
};

export default ApplicationStatusBadge;
