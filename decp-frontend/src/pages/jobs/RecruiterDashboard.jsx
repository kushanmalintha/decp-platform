import { useEffect, useState } from "react";

import { getRecruiterDashboard } from "../../api/jobApi";
import RecruiterDashboardCards from "../../components/jobs/RecruiterDashboardCards";
import "./Jobs.css";

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "The recruiter dashboard is available to alumni recruiters only.";
  }

  return error.response?.data?.message ?? error.message ?? fallback;
};

const RecruiterDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const dashboardData = await getRecruiterDashboard();

        if (isMounted) {
          setDashboard(dashboardData ?? {});
        }
      } catch (loadError) {
        if (isMounted) {
          setDashboard(null);
          setError(getErrorMessage(loadError, "Unable to load recruiter dashboard."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>Recruiter Dashboard</h1>
          <p>Track jobs and application progress for your posted opportunities.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="jobs-state">Loading recruiter dashboard...</div>
      ) : (
        <RecruiterDashboardCards dashboard={dashboard} />
      )}
    </section>
  );
};

export default RecruiterDashboard;
