import { PROJECT_MEMBERS } from "../data/projectMembers.js";
import { NewDefectInput, PRIORITIES, SEVERITIES } from "../models/defect.js";

export type ValidationErrors = Record<string, string>;

const VALID_MEMBER_NAMES = new Set(PROJECT_MEMBERS.map((member) => member.name));

const REQUIRED_FIELDS: Array<keyof NewDefectInput> = [
  "title",
  "description",
  "severity",
  "priority",
  "reporter",
];

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  severity: "Severity",
  priority: "Priority",
  reporter: "Reporter",
};

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function trimmedOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateNewDefect(input: Partial<NewDefectInput>): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const field of REQUIRED_FIELDS) {
    if (isBlank(input[field] as unknown)) {
      errors[field] = `${FIELD_LABELS[field]} is required`;
    }
  }

  const severity = trimmedOrUndefined(input.severity);
  if (severity && !SEVERITIES.includes(severity as never)) {
    errors.severity = `Severity must be one of: ${SEVERITIES.join(", ")}`;
  }

  const priority = trimmedOrUndefined(input.priority);
  if (priority && !PRIORITIES.includes(priority as never)) {
    errors.priority = `Priority must be one of: ${PRIORITIES.join(", ")}`;
  }

  const reporter = trimmedOrUndefined(input.reporter);
  if (reporter && !VALID_MEMBER_NAMES.has(reporter)) {
    errors.reporter = "Reporter must be a current project member";
  }

  const assignee = trimmedOrUndefined(input.assignee);
  if (assignee && !VALID_MEMBER_NAMES.has(assignee)) {
    errors.assignee = "Assignee must be a current project member";
  }

  if (input.attachments !== undefined && !isStringArray(input.attachments)) {
    errors.attachments = "Attachments must be a list of file names";
  }

  if (input.screenshots !== undefined && !isStringArray(input.screenshots)) {
    errors.screenshots = "Screenshots must be a list of file names";
  }

  return errors;
}
