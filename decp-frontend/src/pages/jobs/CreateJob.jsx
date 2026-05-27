import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createJob } from "../../api/jobApi";
import JobForm from "../../components/jobs/JobForm";
import "./Jobs.css";

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "You do not have permission to create jobs.";
  }

  return error.response?.data?.message ?? error.message ?? fallback;
};

const getCreatedJobId = (jobData) => jobData?.id ?? jobData?.jobId;

const CreateJob = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const createdJob = await createJob(payload);
      const createdJobId = getCreatedJobId(createdJob);

      setSuccess("Job created successfully.");
      window.setTimeout(() => {
        navigate(createdJobId ? `/jobs/${createdJobId}` : "/jobs", { replace: true });
      }, 600);
    } catch (createError) {
      setError(getErrorMessage(createError, "Unable to create job."));
      setSubmitting(false);
    }
  };

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>Create Job</h1>
          <p>Publish a new opportunity for DECP students.</p>
        </div>
        <Link className="job-button job-button--secondary" to="/jobs">
          Back to Jobs
        </Link>
      </div>

      {success && <div className="form-success">{success}</div>}
      {error && <div className="form-error">{error}</div>}

      <JobForm onSubmit={handleSubmit} submitLabel="Create Job" submitting={submitting} />
    </section>
  );
};

export default CreateJob;
