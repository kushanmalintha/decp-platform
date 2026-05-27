import { APPLICATION_STATUS_OPTIONS, getNextApplicationStatuses } from "../../constants/jobOptions";

const ApplicationStatusSelector = ({ status, onUpdate, updating = false, disabled = false }) => {
  const nextStatuses = getNextApplicationStatuses(status);
  const hasNextStatus = nextStatuses.length > 0;

  const handleChange = (event) => {
    const nextStatus = event.target.value;

    if (nextStatus) {
      onUpdate(nextStatus);
    }
  };

  return (
    <label className="application-status-selector">
      Next Status
      <select value="" onChange={handleChange} disabled={!hasNextStatus || updating || disabled}>
        <option value="">{hasNextStatus ? "Select next status" : "No next status"}</option>
        {APPLICATION_STATUS_OPTIONS.filter((option) => nextStatuses.includes(option.value)).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default ApplicationStatusSelector;
