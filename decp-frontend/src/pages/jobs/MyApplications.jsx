import { useEffect, useState } from "react";

import { getMyApplications } from "../../api/jobApi";
import ApplicationStatusBadge from "../../components/jobs/ApplicationStatusBadge";
import "./Jobs.css";

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "Applications are available to students only.";
  }

  if (error.response?.status === 404) {
    return "Your applications could not be found.";
  }

  return error.response?.data?.message ?? error.message ?? fallback;
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

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      setLoading(true);
      setError("");

      try {
        const applicationData = await getMyApplications();

        if (isMounted) {
          setApplications(Array.isArray(applicationData) ? applicationData : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setApplications([]);
          setError(getErrorMessage(loadError, "Unable to load your applications."));
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
  }, []);

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>My Applications</h1>
          <p>Review the jobs you have applied to and their current status.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="jobs-state">Loading applications...</div>
      ) : applications.length > 0 ? (
        <div className="applications-list">
          {applications.map((application) => (
            <article className="application-card" key={application.id ?? `${application.jobId}-${application.appliedAt}`}>
              <div className="application-card__header">
                <div>
                  <h2>Application</h2>
                  <p>{formatValue(application.applicantEmail ?? application.studentEmail)}</p>
                </div>
                <ApplicationStatusBadge status={application.status} />
              </div>

              <dl className="application-card__meta">
                <div>
                  <dt>Applicant Email</dt>
                  <dd>{formatValue(application.applicantEmail ?? application.studentEmail)}</dd>
                </div>
                <div>
                  <dt>Applied At</dt>
                  <dd>{formatDateTime(application.appliedAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="jobs-state">You have not applied to any jobs yet.</div>
      )}
    </section>
  );
};

export default MyApplications;
