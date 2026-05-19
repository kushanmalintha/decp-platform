import { useEffect, useMemo, useState } from "react";

import { getJobs } from "../../api/jobApi";
import JobCard from "../../components/jobs/JobCard";
import JobFilters from "../../components/jobs/JobFilters";
import { DEFAULT_JOB_QUERY } from "../../constants/jobOptions";
import "./Jobs.css";

const EMPTY_FILTERS = {
  keyword: "",
  status: "",
  postedByEmail: "",
  jobType: "",
  workMode: "",
  location: "",
  experienceLevel: "",
};

const getErrorMessage = (error, fallback) => error.response?.data?.message ?? error.message ?? fallback;

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

const JobList = () => {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [pageNumber, setPageNumber] = useState(DEFAULT_JOB_QUERY.page);
  const [jobsPage, setJobsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      ...DEFAULT_JOB_QUERY,
      ...appliedFilters,
      page: pageNumber,
    }),
    [appliedFilters, pageNumber],
  );

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const pageData = await getJobs(query);

        if (isMounted) {
          setJobsPage(normalizePage(pageData));
        }
      } catch (loadError) {
        if (isMounted) {
          setJobsPage(null);
          setError(getErrorMessage(loadError, "Unable to load jobs."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setDraftFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters(draftFilters);
    setPageNumber(0);
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPageNumber(0);
  };

  const jobs = jobsPage?.content ?? [];
  const currentPage = jobsPage?.number ?? pageNumber;
  const totalPages = jobsPage?.totalPages;
  const isFirstPage = currentPage <= 0 || jobsPage?.first;
  const isLastPage =
    jobsPage?.last || (Number.isInteger(totalPages) && totalPages > 0 && currentPage >= totalPages - 1);

  return (
    <section className="jobs-page">
      <div className="jobs-page__header">
        <div>
          <h1>Jobs</h1>
          <p>Browse open and closed opportunities shared through DECP.</p>
        </div>
      </div>

      <JobFilters
        filters={draftFilters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        disabled={loading}
      />

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="jobs-state">Loading jobs...</div>
      ) : jobs.length > 0 ? (
        <>
          <div className="jobs-list">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className="jobs-pagination" aria-label="Jobs pagination">
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
        <div className="jobs-state">
          No jobs match the current filters. Try clearing filters or adjusting your search.
        </div>
      )}
    </section>
  );
};

export default JobList;
