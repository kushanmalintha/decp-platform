import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";

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

const getLikes = (job) => Number(job?.likes ?? job?.likeCount ?? 0);
const getCommentCount = (job) => Number(job?.commentCount ?? job?.commentsCount ?? 0);
const isLikedByCurrentUser = (job) => Boolean(job?.likedByCurrentUser);

const isInteractiveTarget = (target) => Boolean(target.closest("a, button, input, select, textarea, label"));

const JobCard = ({ job, onLike, children }) => {
  const navigate = useNavigate();

  const goToDetails = () => {
    if (job?.id) {
      navigate(`/jobs/${job.id}`);
    }
  };

  const handleCardClick = (event) => {
    if (!isInteractiveTarget(event.target)) {
      goToDetails();
    }
  };

  const handleCardKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === " ") && !isInteractiveTarget(event.target)) {
      event.preventDefault();
      goToDetails();
    }
  };

  return (
    <article
      className="job-card job-card--clickable"
      tabIndex={job?.id ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="job-card__header">
        <div>
          <h2>{formatValue(job.title)}</h2>
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

      {(onLike || job?.id) && (
        <div className="job-card__actions">
          {onLike && (
            <button
              className={`job-button job-button--secondary${isLikedByCurrentUser(job) ? " job-button--liked" : ""}`}
              type="button"
              onClick={() => onLike(job)}
              title={isLikedByCurrentUser(job) ? "Remove like" : "Like job"}
            >
              <Heart size={16} fill={isLikedByCurrentUser(job) ? "currentColor" : "none"} aria-hidden="true" />
              {getLikes(job)}
            </button>
          )}
          {job?.id && (
            <Link className="job-button job-button--secondary" to={`/jobs/${job.id}#job-comments`} title="View comments">
              <MessageCircle size={16} aria-hidden="true" />
              {getCommentCount(job)}
            </Link>
          )}
        </div>
      )}

      {children}
    </article>
  );
};

export default JobCard;
