import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart } from "lucide-react";

import { closeJob, createJobComment, getJobById, getJobComments, getSavedJobs, likeJob } from "../../api/jobApi";
import { useAuth } from "../../auth/useAuth";
import JobActions from "../../components/jobs/JobActions";
import JobStatusBadge from "../../components/jobs/JobStatusBadge";
import { JOB_OPTION_LABELS } from "../../constants/jobOptions";
import { getApiErrorMessage } from "../../utils/apiError";
import "./Jobs.css";

const getErrorMessage = (error, fallback) => getApiErrorMessage(error, fallback);

const getCloseErrorMessage = (error) => {
  if (error.response?.status === 403) {
    return "You do not have permission to close this job.";
  }

  if (error.response?.status === 404) {
    return "This job could not be found.";
  }

  return getApiErrorMessage(error, "Unable to close this job.");
};

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

const formatDateTime = (value) => {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return JOB_OPTION_LABELS[value] ?? value;
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString().trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeComments = (commentsData) => {
  if (Array.isArray(commentsData)) {
    return commentsData;
  }

  if (Array.isArray(commentsData?.content)) {
    return commentsData.content;
  }

  return [];
};

const getLikes = (job) => Number(job?.likes ?? job?.likeCount ?? 0);

const toggleJobLike = (job) => ({
  ...job,
  likes: Math.max(0, Number(job?.likes ?? job?.likeCount ?? 0) + (job?.likedByCurrentUser ? -1 : 1)),
  likedByCurrentUser: !job?.likedByCurrentUser,
});

const renderLongValue = (value) => {
  if (Array.isArray(value)) {
    const items = normalizeList(value);

    if (items.length === 0) {
      return <p>Not provided</p>;
    }

    return (
      <ul className="job-detail-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p>{formatValue(value)}</p>;
};

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [isSaved, setIsSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadJob = async () => {
      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const jobData = await getJobById(id);

        if (isMounted) {
          setJob(jobData);
          setNotFound(!jobData);
        }
      } catch (loadError) {
        if (isMounted) {
          setJob(null);

          if (loadError.response?.status === 404) {
            setNotFound(true);
          } else {
            setError(getErrorMessage(loadError, "Unable to load job details."));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentsError("");

      try {
        const commentsData = await getJobComments(id);

        if (isMounted) {
          setComments(normalizeComments(commentsData));
        }
      } catch (loadError) {
        if (isMounted) {
          setComments([]);
          setCommentsError(getErrorMessage(loadError, "Unable to load comments."));
        }
      } finally {
        if (isMounted) {
          setCommentsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadSavedState = async () => {
      if (user?.role?.toUpperCase() !== "STUDENT" || !id) {
        setIsSaved(null);
        return;
      }

      try {
        const savedJobsData = await getSavedJobs({ page: 0, size: 1000 });
        const savedJobs = Array.isArray(savedJobsData) ? savedJobsData : savedJobsData?.content ?? [];
        const currentJobId = Number(id);

        if (isMounted) {
          setIsSaved(savedJobs.some((savedJob) => Number(savedJob.id) === currentJobId));
        }
      } catch {
        if (isMounted) {
          setIsSaved(null);
        }
      }
    };

    loadSavedState();

    return () => {
      isMounted = false;
    };
  }, [id, user?.role]);

  useEffect(() => {
    if (!loading && window.location.hash === "#job-comments") {
      window.setTimeout(() => {
        document.getElementById("job-comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [loading]);

  const skills = useMemo(() => normalizeList(job?.skillsRequired), [job?.skillsRequired]);
  const normalizedRole = user?.role?.toUpperCase();
  const isStudent = normalizedRole === "STUDENT";
  const isAlumni = normalizedRole === "ALUMNI";
  const isAdmin = normalizedRole === "ADMIN";
  const isClosed = job?.status === "CLOSED";
  const isOwner =
    job?.postedByEmail?.toLowerCase() === user?.email?.toLowerCase();
  const canEditJob = job?.id && !isClosed && (isAdmin || (isAlumni && isOwner));
  const canCloseJob = job?.id && !isClosed && (isAdmin || (isAlumni && isOwner));
  const canViewApplications = job?.id && isAlumni && isOwner;

  const handleCloseJob = async () => {
    setClosing(true);
    setSuccess("");
    setError("");

    try {
      const closedJob = await closeJob(job.id);
      setJob((currentJob) => ({
        ...currentJob,
        ...closedJob,
        status: closedJob?.status ?? "CLOSED",
      }));
      setSuccess("Job closed successfully.");
    } catch (closeError) {
      setError(getCloseErrorMessage(closeError));
    } finally {
      setClosing(false);
    }
  };

  const handleLikeJob = async () => {
    setError("");
    const originalJob = job;

    setJob((currentJob) => toggleJobLike(currentJob));

    try {
      await likeJob(job.id);
    } catch (likeError) {
      setJob(originalJob);
      setError(getErrorMessage(likeError, "Unable to update this like."));
    }
  };

  const handleCreateComment = async (event) => {
    event.preventDefault();

    if (!commentContent.trim()) {
      setError("Comment content is required.");
      return;
    }

    setCommenting(true);
    setError("");

    try {
      const createdComment = await createJobComment(job.id, { content: commentContent.trim() });
      setComments((currentComments) => [...currentComments, createdComment]);
      setCommentContent("");
    } catch (commentError) {
      setError(getErrorMessage(commentError, "Unable to add this comment."));
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <section className="jobs-page">
        <div className="jobs-state">Loading job details...</div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="jobs-page">
        <div className="jobs-page__header">
          <div>
            <h1>Job Not Found</h1>
            <p>This job may have been removed or is no longer available.</p>
          </div>
          <Link className="job-button job-button--secondary" to="/jobs">
            Back to Jobs
          </Link>
        </div>
      </section>
    );
  }

  if (error && !job) {
    return (
      <section className="jobs-page">
        <div className="jobs-page__header">
          <div>
            <h1>Job Details</h1>
          </div>
          <Link className="job-button job-button--secondary" to="/jobs">
            Back to Jobs
          </Link>
        </div>
        <div className="form-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>{formatValue(job?.title)}</h1>
          <p>{formatValue(job?.companyName)}</p>
        </div>
        <div className="job-management-actions">
          {canEditJob && (
            <Link className="job-button job-button--secondary" to={`/jobs/${job.id}/edit`}>
              Edit Job
            </Link>
          )}
          {canViewApplications && (
            <Link className="job-button job-button--secondary" to={`/jobs/${job.id}/applications`}>
              View Applications
            </Link>
          )}
          {canCloseJob && (
            <button type="button" onClick={handleCloseJob} disabled={closing}>
              {closing ? "Closing..." : "Close Job"}
            </button>
          )}
          <Link className="job-button job-button--secondary" to="/jobs">
            Back to Jobs
          </Link>
        </div>
      </div>

      <article className="job-details">
        <div className="job-details__topline">
          <JobStatusBadge status={job?.status} />
          <span>Posted {formatDate(job?.createdAt)}</span>
          {isClosed && <span className="job-actions__note">This job is closed.</span>}
        </div>

        {success && <div className="form-success">{success}</div>}
        {error && <div className="form-error">{error}</div>}

        <div className="job-social-actions">
          <button
            className={`job-button job-button--secondary${job?.likedByCurrentUser ? " job-button--liked" : ""}`}
            type="button"
            onClick={handleLikeJob}
            title={job?.likedByCurrentUser ? "Remove like" : "Like job"}
          >
            <Heart size={16} fill={job?.likedByCurrentUser ? "currentColor" : "none"} aria-hidden="true" />
            {getLikes(job)}
          </button>
        </div>

        {isStudent && (
          <JobActions
            key={`${job?.id}-${isSaved}`}
            jobId={job?.id}
            jobStatus={job?.status}
            initialSaved={isSaved}
            onSaveChange={setIsSaved}
          />
        )}

        <dl className="job-details__grid">
          <div>
            <dt>Posted By</dt>
            <dd>{formatValue(job?.postedByEmail)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{formatValue(job?.location)}</dd>
          </div>
          <div>
            <dt>Job Type</dt>
            <dd>{formatValue(job?.jobType)}</dd>
          </div>
          <div>
            <dt>Work Mode</dt>
            <dd>{formatValue(job?.workMode)}</dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>{formatValue(job?.experienceLevel)}</dd>
          </div>
          <div>
            <dt>Salary</dt>
            <dd>{formatValue(job?.salaryRange)}</dd>
          </div>
          <div>
            <dt>Application Deadline</dt>
            <dd>{formatDate(job?.applicationDeadline)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{formatValue(job?.status)}</dd>
          </div>
        </dl>

        <section className="job-details__section" aria-labelledby="job-description-heading">
          <h2 id="job-description-heading">Description</h2>
          {renderLongValue(job?.description)}
        </section>

        <section className="job-details__section" aria-labelledby="job-requirements-heading">
          <h2 id="job-requirements-heading">Requirements</h2>
          {renderLongValue(job?.requirements)}
        </section>

        <section className="job-details__section" aria-labelledby="job-responsibilities-heading">
          <h2 id="job-responsibilities-heading">Responsibilities</h2>
          {renderLongValue(job?.responsibilities)}
        </section>

        <section className="job-details__section" aria-labelledby="job-skills-heading">
          <h2 id="job-skills-heading">Skills Required</h2>
          {skills.length > 0 ? (
            <ul className="job-skills">
              {skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p>Not provided</p>
          )}
        </section>

        <section className="job-comments" id="job-comments" aria-labelledby="job-comments-heading">
          <div className="job-comments__header">
            <h2 id="job-comments-heading">Comments</h2>
            <span>{comments.length}</span>
          </div>

          <form className="job-comment-form" aria-label="Job comment form" onSubmit={handleCreateComment}>
            <label>
              Comment
              <textarea
                name="content"
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
                placeholder="Share a question or note about this job"
                rows={3}
                disabled={commenting}
              />
            </label>
            <div className="job-form__actions">
              <button type="submit" disabled={commenting}>
                {commenting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>

          {commentsError && <div className="form-error">{commentsError}</div>}
          {commentsLoading ? (
            <div className="jobs-state">Loading comments...</div>
          ) : comments.length > 0 ? (
            <div className="job-comments-list">
              {comments.map((comment, index) => (
                <article className="job-comment" key={comment.id ?? `${comment.authorEmail}-${comment.createdAt}-${index}`}>
                  <div className="job-comment__meta">
                    <strong>{comment.authorEmail || "Unknown author"}</strong>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p>{comment.content || "No content provided."}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="jobs-state">No comments yet.</div>
          )}
        </section>
      </article>
    </section>
  );
};

export default JobDetails;
