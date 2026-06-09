import {
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_STATUS_OPTIONS,
  JOB_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../../constants/jobOptions";
import { Search, SlidersHorizontal, X } from "lucide-react";

const renderOptions = (options) =>
  options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ));

const JobFilters = ({ filters, onChange, onApply, onClear, disabled = false }) => (
  <form className="job-filters" onSubmit={onApply}>
    <div className="job-filters__header">
      <div>
        <p>Search & Filters</p>
        <h2>Refine opportunities</h2>
      </div>
      <SlidersHorizontal size={20} aria-hidden="true" />
    </div>

    <div className="job-filters__grid">
      <label className="job-filters__wide">
        Keyword
        <span className="job-filter-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="text"
            name="keyword"
            value={filters.keyword}
            onChange={onChange}
            placeholder="Title, skill, or company"
          />
        </span>
      </label>

      <label>
        Status
        <select name="status" value={filters.status} onChange={onChange}>
          <option value="">Any status</option>
          {renderOptions(JOB_STATUS_OPTIONS)}
        </select>
      </label>

      <label>
        Job Type
        <select name="jobType" value={filters.jobType} onChange={onChange}>
          <option value="">Any type</option>
          {renderOptions(JOB_TYPE_OPTIONS)}
        </select>
      </label>

      <label>
        Work Mode
        <select name="workMode" value={filters.workMode} onChange={onChange}>
          <option value="">Any mode</option>
          {renderOptions(WORK_MODE_OPTIONS)}
        </select>
      </label>

      <label>
        Location
        <input type="text" name="location" value={filters.location} onChange={onChange} placeholder="City or country" />
      </label>

      <label>
        Experience
        <select name="experienceLevel" value={filters.experienceLevel} onChange={onChange}>
          <option value="">Any level</option>
          {renderOptions(EXPERIENCE_LEVEL_OPTIONS)}
        </select>
      </label>

      <label>
        Posted By
        <input
          type="email"
          name="postedByEmail"
          value={filters.postedByEmail}
          onChange={onChange}
          placeholder="recruiter@example.com"
        />
      </label>
    </div>

    <div className="job-filters__actions">
      <button type="submit" disabled={disabled}>
        Apply Filters
      </button>
      <button
        className="job-button job-button--secondary"
        type="button"
        onClick={onClear}
        disabled={disabled}
      >
        <X size={16} aria-hidden="true" />
        Clear Filters
      </button>
    </div>
  </form>
);

export default JobFilters;
