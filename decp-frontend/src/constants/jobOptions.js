export const JOB_STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
];

export const JOB_TYPE_OPTIONS = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
];

export const WORK_MODE_OPTIONS = [
  { value: "ONSITE", label: "Onsite" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "ENTRY", label: "Entry" },
  { value: "MID", label: "Mid" },
  { value: "SENIOR", label: "Senior" },
];

export const APPLICATION_STATUS_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ACCEPTED", label: "Accepted" },
];

export const APPLICATION_STATUS_TRANSITIONS = {
  APPLIED: ["REVIEWING"],
  REVIEWING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["ACCEPTED", "REJECTED"],
  REJECTED: [],
  ACCEPTED: [],
};

export const JOB_OPTION_LABELS = [
  ...JOB_STATUS_OPTIONS,
  ...JOB_TYPE_OPTIONS,
  ...WORK_MODE_OPTIONS,
  ...EXPERIENCE_LEVEL_OPTIONS,
  ...APPLICATION_STATUS_OPTIONS,
].reduce((labels, option) => ({ ...labels, [option.value]: option.label }), {});

export const getNextApplicationStatuses = (status) => APPLICATION_STATUS_TRANSITIONS[status] ?? [];

export const DEFAULT_JOB_QUERY = {
  page: 0,
  size: 10,
  sort: "createdAt,desc",
};
