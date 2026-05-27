import { Link } from "react-router-dom";

import { JOB_OPTION_LABELS } from "../../constants/jobOptions";
import JobStatusBadge from "./JobStatusBadge";

const formatDate = (value) => {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return JOB_OPTION_LABELS[value] ?? value;
};

const JobCard = ({ job, children }) => (
  <article className="job-card">
    <div className="job-card__header">
      <div>
        <h2>
          <Link to={`/jobs/${job.id}`}>{formatValue(job.title)}</Link>
        </h2>
        <p>{formatValue(job.companyName)}</p>
      </div>
      <JobStatusBadge status={job.status} />
    </div>

    <dl className="job-card__meta">
      <div>
        <dt>Location</dt>
        <dd>{formatValue(job.location)}</dd>
      </div>
      <div>
        <dt>Type</dt>
        <dd>{formatValue(job.jobType)}</dd>
      </div>
      <div>
        <dt>Work Mode</dt>
        <dd>{formatValue(job.workMode)}</dd>
      </div>
      <div>
        <dt>Experience</dt>
        <dd>{formatValue(job.experienceLevel)}</dd>
      </div>
      <div>
        <dt>Salary</dt>
        <dd>{formatValue(job.salaryRange)}</dd>
      </div>
      <div>
        <dt>Posted</dt>
        <dd>{formatDate(job.createdAt)}</dd>
      </div>
    </dl>

    {children}
  </article>
);

export default JobCard;
