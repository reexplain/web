export const DASHBOARD_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

export const PRACTICE_GENERATED_AT_FORMATTER = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const CONCEPT_STATE_LABEL = {
  demonstrated: "Demonstrated",
  developing: "Developing",
  unexplored: "Not yet shown",
} as const;

export const SESSION_STATUS_LABEL = {
  active: "In progress",
  completed: "Completed",
  abandoned: "In progress",
} as const;
