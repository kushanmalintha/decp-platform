import { useEffect, useMemo, useState } from "react";

import { getSavedJobs } from "../../api/jobApi";
import JobActions from "../../components/jobs/JobActions";
import JobCard from "../../components/jobs/JobCard";
import { DEFAULT_JOB_QUERY } from "../../constants/jobOptions";
import "./Jobs.css";

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "Saved jobs are available to students only.";
  }

  if (error.response?.status === 404) {
    return "Saved jobs could not be found.";
  }

  return error.response?.data?.message ?? error.message ?? fallback;
};

const normalizePage = (pageData) => {
  if (Array.isArray(pageData)) {
    return {
      content: pageData,
      number: 0,
      totalPages: 1,
      first: true,
      last: true,
      totalElements: pageData.length,
    };
  }

  return {
    content: Array.isArray(pageData?.content) ? pageData.content : [],
    number: Number.isInteger(pageData?.number) ? pageData.number : 0,
    totalPages: Number.isInteger(pageData?.totalPages) ? pageData.totalPages : null,
    first: Boolean(pageData?.first),
    last: Boolean(pageData?.last),
    totalElements: Number.isInteger(pageData?.totalElements) ? pageData.totalElements : null,
  };
};

const SavedJobs = () => {
  const [pageNumber, setPageNumber] = useState(DEFAULT_JOB_QUERY.page);
  const [savedJobsPage, setSavedJobsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      page: pageNumber,
      size: DEFAULT_JOB_QUERY.size,
    }),
    [pageNumber],
  );

  useEffect(() => {
    let isMounted = true;

    const loadSavedJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const pageData = await getSavedJobs(query);

        if (isMounted) {
          setSavedJobsPage(normalizePage(pageData));
        }
      } catch (loadError) {
        if (isMounted) {
          setSavedJobsPage(null);
          setError(getErrorMessage(loadError, "Unable to load saved jobs."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSavedJobs();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSaveChange = (jobId, isSaved) => {
    if (isSaved) {
      return;
    }

    setSavedJobsPage((currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      return {
        ...currentPage,
        content: currentPage.content.filter((job) => job.id !== jobId),
        totalElements: Number.isInteger(currentPage.totalElements)
          ? Math.max(currentPage.totalElements - 1, 0)
          : currentPage.totalElements,
      };
    });
  };

  const jobs = savedJobsPage?.content ?? [];
  const currentPage = savedJobsPage?.number ?? pageNumber;
  const totalPages = savedJobsPage?.totalPages;
  const isFirstPage = currentPage <= 0 || savedJobsPage?.first;
  const isLastPage =
    savedJobsPage?.last ||
    (Number.isInteger(totalPages) && totalPages > 0 && currentPage >= totalPages - 1) ||
    (!Number.isInteger(totalPages) && jobs.length === 0);

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>Saved Jobs</h1>
          <p>Keep track of opportunities you want to revisit.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="jobs-state">Loading saved jobs...</div>
      ) : jobs.length > 0 ? (
        <>
          <div className="jobs-list">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job}>
                <JobActions
                  key={`${job.id}-saved`}
                  jobId={job.id}
                  jobStatus={job.status}
                  initialSaved
                  showApply={false}
                  onSaveChange={(isSaved) => handleSaveChange(job.id, isSaved)}
                />
              </JobCard>
            ))}
          </div>

          <div className="jobs-pagination" aria-label="Saved jobs pagination">
            <button
              className="job-button job-button--secondary"
              type="button"
              onClick={() => setPageNumber((page) => Math.max(page - 1, 0))}
              disabled={isFirstPage || loading}
            >
              Previous
            </button>
            <span>
              Page {currentPage + 1}
              {Number.isInteger(totalPages) ? ` of ${totalPages}` : ""}
            </span>
            <button
              className="job-button job-button--secondary"
              type="button"
              onClick={() => setPageNumber((page) => page + 1)}
              disabled={isLastPage || loading}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="jobs-state">You have not saved any jobs yet.</div>
      )}
    </section>
  );
};

export default SavedJobs;
