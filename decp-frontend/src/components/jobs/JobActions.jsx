import { useState } from "react";

import { applyToJob, saveJob, unsaveJob } from "../../api/jobApi";
import { useAuth } from "../../auth/useAuth";

const STUDENT_ROLE = "STUDENT";

const getFriendlyErrorMessage = (error, action) => {
  const status = error.response?.status;

  if (status === 403) {
    return "You do not have permission to do that.";
  }

  if (status === 404) {
    return action === "unsave" ? "This job was not in your saved jobs." : "This job could not be found.";
  }

  if (status === 409) {
    return action === "apply" ? "You have already applied to this job." : "This job is already saved.";
  }

  if (status === 400 && action === "apply") {
    return "Applications are closed for this job.";
  }

  return error.response?.data?.message ?? error.message ?? "Something went wrong. Please try again.";
};

const JobActions = ({
  jobId,
  jobStatus,
  initialSaved = null,
  showApply = true,
  showSave = true,
  onSaveChange,
}) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [hasApplied, setHasApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  if (user?.role?.toUpperCase() !== STUDENT_ROLE || !jobId) {
    return null;
  }

  const isClosed = jobStatus === "CLOSED";
  const disableApply = isClosed || hasApplied || applying;
  const disableSaveActions = saving || unsaving;

  const handleSave = async () => {
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      await saveJob(jobId);
      setIsSaved(true);
      onSaveChange?.(true);
      setSuccess("Job saved successfully.");
    } catch (saveError) {
      const message = getFriendlyErrorMessage(saveError, "save");
      setError(message);

      if (saveError.response?.status === 409) {
        setIsSaved(true);
        onSaveChange?.(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async () => {
    setUnsaving(true);
    setSuccess("");
    setError("");

    try {
      await unsaveJob(jobId);
      setIsSaved(false);
      onSaveChange?.(false);
      setSuccess("Job removed from saved jobs.");
    } catch (unsaveError) {
      const message = getFriendlyErrorMessage(unsaveError, "unsave");
      setError(message);

      if (unsaveError.response?.status === 404) {
        setIsSaved(false);
        onSaveChange?.(false);
      }
    } finally {
      setUnsaving(false);
    }
  };

  const handleApply = async () => {
    if (disableApply) {
      return;
    }

    setApplying(true);
    setSuccess("");
    setError("");

    try {
      await applyToJob(jobId);
      setHasApplied(true);
      setSuccess("Application submitted successfully.");
    } catch (applyError) {
      const message = getFriendlyErrorMessage(applyError, "apply");
      setError(message);

      if (applyError.response?.status === 409) {
        setHasApplied(true);
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="job-actions">
      <div className="job-actions__buttons">
        {showSave && isSaved === true && (
          <button
            className="job-button job-button--secondary"
            type="button"
            onClick={handleUnsave}
            disabled={disableSaveActions}
          >
            {unsaving ? "Removing..." : "Unsave Job"}
          </button>
        )}

        {showSave && isSaved !== true && (
          <button type="button" onClick={handleSave} disabled={disableSaveActions}>
            {saving ? "Saving..." : "Save Job"}
          </button>
        )}

        {showApply && (
          <button type="button" onClick={handleApply} disabled={disableApply}>
            {applying ? "Applying..." : hasApplied ? "Applied" : "Apply"}
          </button>
        )}
      </div>

      {isClosed && showApply && <div className="job-actions__note">Applications are closed for this job.</div>}
      {success && <div className="form-success">{success}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export default JobActions;
