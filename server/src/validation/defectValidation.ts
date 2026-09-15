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

export function validateNewDefect(input: Partial<NewDefectInput>): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const field of REQUIRED_FIELDS) {
    if (isBlank(input[field] as unknown)) {
      errors[field] = `${FIELD_LABELS[field]} is required`;
    }
  }

  if (!isBlank(input.severity) && !SEVERITIES.includes(input.severity as never)) {
    errors.severity = `Severity must be one of: ${SEVERITIES.join(", ")}`;
  }

  if (!isBlank(input.priority) && !PRIORITIES.includes(input.priority as never)) {
    errors.priority = `Priority must be one of: ${PRIORITIES.join(", ")}`;
  }

  if (!isBlank(input.reporter) && !VALID_MEMBER_NAMES.has(input.reporter as string)) {
    errors.reporter = "Reporter must be a current project member";
  }

  if (!isBlank(input.assignee) && !VALID_MEMBER_NAMES.has(input.assignee as string)) {
    errors.assignee = "Assignee must be a current project member";
  }

  return errors;
}
