import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getJobApplications, getJobById, updateApplicationStatus } from "../../api/jobApi";
import { useAuth } from "../../auth/useAuth";
import ApplicationStatusBadge from "../../components/jobs/ApplicationStatusBadge";
import ApplicationStatusSelector from "../../components/jobs/ApplicationStatusSelector";
import { getNextApplicationStatuses } from "../../constants/jobOptions";
import { getApiErrorMessage } from "../../utils/apiError";
import "./Jobs.css";

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "You do not have permission to view applications for this job.";
  }

  if (error.response?.status === 404) {
    return "Applications for this job could not be found.";
  }

  if (error.response?.status === 400 || error.response?.status === 409) {
    return getApiErrorMessage(error, "That application status transition is not allowed.");
  }

  return getApiErrorMessage(error, fallback);
};

const isJobOwner = (job, user) =>
  job?.postedByEmail?.toLowerCase() === user?.email?.toLowerCase();

const normalizeApplications = (applicationData) => {
  if (Array.isArray(applicationData)) {
    return applicationData;
  }

  if (Array.isArray(applicationData?.content)) {
    return applicationData.content;
  }

  if (Array.isArray(applicationData?.applications)) {
    return applicationData.applications;
  }

  return [];
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

  return value;
};

const getApplicationKey = (application, index) =>
  application.id ?? `${application.jobId ?? "job"}-${application.appliedAt ?? index}-${index}`;

const JobApplications = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [canManageApplications, setCanManageApplications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      setCanManageApplications(false);

      try {
        const jobData = await getJobById(id);
        const isAlumni = user?.role?.toUpperCase() === "ALUMNI";
        const isOwner = isAlumni && isJobOwner(jobData, user);

        if (!jobData) {
          if (isMounted) {
            setApplications([]);
            setError("This job could not be found.");
          }
          return;
        }

        if (!isOwner) {
          if (isMounted) {
            setApplications([]);
            setError("You can only view applications for jobs you posted.");
          }
          return;
        }

        const applicationData = await getJobApplications(id);

        if (isMounted) {
          setCanManageApplications(true);
          setApplications(normalizeApplications(applicationData));
        }
      } catch (loadError) {
        if (isMounted) {
          setApplications([]);
          setError(getErrorMessage(loadError, "Unable to load job applications."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleStatusUpdate = async (application, status) => {
    if (!canManageApplications) {
      setError("You can only update applications for jobs you posted.");
      return;
    }

    if (!application.id || !getNextApplicationStatuses(application.status).includes(status)) {
      setError("That application status transition is not allowed.");
      return;
    }

    setUpdatingId(application.id);
    setSuccess("");
    setError("");

    try {
      const updatedApplication = await updateApplicationStatus(application.id, status);
      setApplications((currentApplications) =>
        currentApplications.map((currentApplication) =>
          currentApplication.id === application.id
            ? { ...currentApplication, ...updatedApplication, status: updatedApplication?.status ?? status }
            : currentApplication,
        ),
      );
      setSuccess("Application status updated successfully.");
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Unable to update application status."));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>Job Applications</h1>
          <p>Review applicants and move each application through the hiring pipeline.</p>
        </div>
        <Link className="job-button job-button--secondary" to={`/jobs/${id}`}>
          Back to Job
        </Link>
      </div>

      {success && <div className="form-success">{success}</div>}
      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="jobs-state">Loading applications...</div>
      ) : error && applications.length === 0 ? null : applications.length > 0 ? (
        <div className="applications-list">
          {applications.map((application, index) => (
            <article className="application-card" key={getApplicationKey(application, index)}>
              <div className="application-card__header">
                <div>
                  <h2>{formatValue(application.studentEmail ?? application.applicantEmail)}</h2>
                </div>
                <ApplicationStatusBadge status={application.status} />
              </div>

              <dl className="application-card__meta">
                <div>
                  <dt>Applicant Email</dt>
                  <dd>{formatValue(application.studentEmail ?? application.applicantEmail)}</dd>
                </div>
                <div>
                  <dt>Applied At</dt>
                  <dd>{formatDateTime(application.appliedAt)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <ApplicationStatusBadge status={application.status} />
                  </dd>
                </div>
              </dl>

              {canManageApplications && (
                <ApplicationStatusSelector
                  status={application.status}
                  updating={updatingId === application.id}
                  disabled={!application.id}
                  onUpdate={(nextStatus) => handleStatusUpdate(application, nextStatus)}
                />
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="jobs-state">No applications have been submitted for this job yet.</div>
      )}
    </section>
  );
};

export default JobApplications;
