const SOURCE_LABELS = {
  MANUAL: "Manual",
  JOB: "Job",
};

const SourceBadge = ({ sourceType }) => {
  const normalizedSource = sourceType?.toUpperCase?.() ?? "MANUAL";
  const label = SOURCE_LABELS[normalizedSource] ?? normalizedSource;

  return (
    <span className={`feed-source-badge feed-source-badge--${normalizedSource.toLowerCase()}`}>
      {label}
    </span>
  );
};

export default SourceBadge;
