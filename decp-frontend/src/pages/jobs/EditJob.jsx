import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getJobById, updateJob } from "../../api/jobApi";
import JobForm from "../../components/jobs/JobForm";
import JobStatusBadge from "../../components/jobs/JobStatusBadge";
import "./Jobs.css";

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "You do not have permission to edit this job.";
  }

  if (error.response?.status === 404) {
    return "This job could not be found.";
  }

  if (error.response?.status === 400 || error.response?.status === 409) {
    return error.response?.data?.message ?? "Closed jobs cannot be edited.";
  }

  return error.response?.data?.message ?? error.message ?? fallback;
};

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
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
            setError(getErrorMessage(loadError, "Unable to load job."));
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

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      await updateJob(id, payload);
      setSuccess("Job updated successfully.");
      window.setTimeout(() => {
        navigate(`/jobs/${id}`, { replace: true });
      }, 600);
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Unable to update job."));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="jobs-page">
        <div className="jobs-state">Loading job...</div>
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
            <h1>Edit Job</h1>
          </div>
          <Link className="job-button job-button--secondary" to="/jobs">
            Back to Jobs
          </Link>
        </div>
        <div className="form-error">{error}</div>
      </section>
    );
  }

  const isClosed = job?.status === "CLOSED";

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>Edit Job</h1>
          <p>{job?.title ?? "Update job details"}</p>
        </div>
        <Link className="job-button job-button--secondary" to={`/jobs/${id}`}>
          Back to Job
        </Link>
      </div>

      {job?.status && (
        <div className="job-management-status">
          <JobStatusBadge status={job.status} />
        </div>
      )}

      {success && <div className="form-success">{success}</div>}
      {error && <div className="form-error">{error}</div>}

      {isClosed ? (
        <div className="jobs-state">Closed jobs cannot be edited.</div>
      ) : (
        <JobForm initialValues={job} onSubmit={handleSubmit} submitLabel="Update Job" submitting={submitting} />
      )}
    </section>
  );
};

export default EditJob;
