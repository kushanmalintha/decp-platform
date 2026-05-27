import { useMemo, useState } from "react";

import {
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../../constants/jobOptions";

const FIELD_NAMES = [
  "title",
  "description",
  "companyName",
  "location",
  "jobType",
  "workMode",
  "salaryRange",
  "applicationDeadline",
  "requirements",
  "responsibilities",
  "skillsRequired",
  "experienceLevel",
];

const FIELD_LABELS = {
  title: "Title",
  description: "Description",
  companyName: "Company Name",
  location: "Location",
  jobType: "Job Type",
  workMode: "Work Mode",
  salaryRange: "Salary Range",
  applicationDeadline: "Application Deadline",
  requirements: "Requirements",
  responsibilities: "Responsibilities",
  skillsRequired: "Skills Required",
  experienceLevel: "Experience Level",
};

const EMPTY_FORM = FIELD_NAMES.reduce((formData, fieldName) => ({ ...formData, [fieldName]: "" }), {});

const renderOptions = (options) =>
  options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ));

const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const toSkillsText = (value) => {
  if (Array.isArray(value)) {
    return value.map((skill) => skill?.toString().trim()).filter(Boolean).join(", ");
  }

  return typeof value === "string" ? value : "";
};

const normalizeInitialValues = (initialValues = {}) => ({
  ...EMPTY_FORM,
  ...FIELD_NAMES.reduce((formData, fieldName) => {
    if (fieldName === "applicationDeadline") {
      return { ...formData, [fieldName]: toDateInputValue(initialValues[fieldName]) };
    }

    if (fieldName === "skillsRequired") {
      return { ...formData, [fieldName]: toSkillsText(initialValues[fieldName]) };
    }

    return { ...formData, [fieldName]: initialValues[fieldName] ?? "" };
  }, {}),
});

const getPayload = (formData) => ({
  ...formData,
  skillsRequired: formData.skillsRequired
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean),
});

const JobForm = ({
  initialValues,
  onSubmit,
  submitLabel = "Save Job",
  submitting = false,
  disabled = false,
}) => {
  const normalizedInitialValues = useMemo(() => normalizeInitialValues(initialValues), [initialValues]);
  const [formData, setFormData] = useState(normalizedInitialValues);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = FIELD_NAMES.reduce((errors, fieldName) => {
      const value = formData[fieldName];

      if (!value || !value.toString().trim()) {
        return { ...errors, [fieldName]: `${FIELD_LABELS[fieldName]} is required.` };
      }

      if (fieldName === "skillsRequired" && getPayload(formData).skillsRequired.length === 0) {
        return { ...errors, [fieldName]: "Enter at least one skill." };
      }

      return errors;
    }, {});

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit(getPayload(formData));
  };

  const isDisabled = disabled || submitting;

  return (
    <form className="job-form" onSubmit={handleSubmit} noValidate>
      <label>
        Title
        <input name="title" type="text" value={formData.title} onChange={handleChange} disabled={isDisabled} />
        {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
      </label>

      <label>
        Company Name
        <input
          name="companyName"
          type="text"
          value={formData.companyName}
          onChange={handleChange}
          disabled={isDisabled}
        />
        {fieldErrors.companyName && <span className="field-error">{fieldErrors.companyName}</span>}
      </label>

      <label>
        Location
        <input
          name="location"
          type="text"
          value={formData.location}
          onChange={handleChange}
          disabled={isDisabled}
        />
        {fieldErrors.location && <span className="field-error">{fieldErrors.location}</span>}
      </label>

      <label>
        Job Type
        <select name="jobType" value={formData.jobType} onChange={handleChange} disabled={isDisabled}>
          <option value="">Select job type</option>
          {renderOptions(JOB_TYPE_OPTIONS)}
        </select>
        {fieldErrors.jobType && <span className="field-error">{fieldErrors.jobType}</span>}
      </label>

      <label>
        Work Mode
        <select name="workMode" value={formData.workMode} onChange={handleChange} disabled={isDisabled}>
          <option value="">Select work mode</option>
          {renderOptions(WORK_MODE_OPTIONS)}
        </select>
        {fieldErrors.workMode && <span className="field-error">{fieldErrors.workMode}</span>}
      </label>

      <label>
        Experience Level
        <select
          name="experienceLevel"
          value={formData.experienceLevel}
          onChange={handleChange}
          disabled={isDisabled}
        >
          <option value="">Select experience</option>
          {renderOptions(EXPERIENCE_LEVEL_OPTIONS)}
        </select>
        {fieldErrors.experienceLevel && <span className="field-error">{fieldErrors.experienceLevel}</span>}
      </label>

      <label>
        Salary Range
        <input
          name="salaryRange"
          type="text"
          value={formData.salaryRange}
          onChange={handleChange}
          disabled={isDisabled}
        />
        {fieldErrors.salaryRange && <span className="field-error">{fieldErrors.salaryRange}</span>}
      </label>

      <label>
        Application Deadline
        <input
          name="applicationDeadline"
          type="date"
          value={formData.applicationDeadline}
          onChange={handleChange}
          disabled={isDisabled}
        />
        {fieldErrors.applicationDeadline && (
          <span className="field-error">{fieldErrors.applicationDeadline}</span>
        )}
      </label>

      <label className="job-form__wide">
        Description
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isDisabled}
          rows={5}
        />
        {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
      </label>

      <label className="job-form__wide">
        Requirements
        <textarea
          name="requirements"
          value={formData.requirements}
          onChange={handleChange}
          disabled={isDisabled}
          rows={4}
        />
        {fieldErrors.requirements && <span className="field-error">{fieldErrors.requirements}</span>}
      </label>

      <label className="job-form__wide">
        Responsibilities
        <textarea
          name="responsibilities"
          value={formData.responsibilities}
          onChange={handleChange}
          disabled={isDisabled}
          rows={4}
        />
        {fieldErrors.responsibilities && <span className="field-error">{fieldErrors.responsibilities}</span>}
      </label>

      <label className="job-form__wide">
        Skills Required
        <input
          name="skillsRequired"
          type="text"
          value={formData.skillsRequired}
          onChange={handleChange}
          disabled={isDisabled}
          placeholder="React, Spring Boot, SQL"
        />
        {fieldErrors.skillsRequired && <span className="field-error">{fieldErrors.skillsRequired}</span>}
      </label>

      <div className="job-form__actions">
        <button type="submit" disabled={isDisabled}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
