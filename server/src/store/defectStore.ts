import { Defect, NewDefectInput } from "../models/defect.js";
import { validateNewDefect, ValidationErrors } from "../validation/defectValidation.js";
import * as idGenerator from "./idGenerator.js";

export class DefectValidationError extends Error {
  errors: ValidationErrors;

  constructor(errors: ValidationErrors) {
    super("Defect validation failed");
    this.errors = errors;
  }
}

let defects: Defect[] = [];

export function createDefect(input: NewDefectInput): Defect {
  const errors = validateNewDefect(input);
  if (Object.keys(errors).length > 0) {
    throw new DefectValidationError(errors);
  }

  const id = idGenerator.generate();

  const defect: Defect = {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    severity: input.severity.trim() as Defect["severity"],
    priority: input.priority.trim() as Defect["priority"],
    reporter: input.reporter.trim(),
    component: input.component?.trim() || undefined,
    assignee: input.assignee?.trim() || undefined,
    attachments: input.attachments ?? [],
    screenshots: input.screenshots ?? [],
    createdAt: new Date().toISOString(),
  };

  defects.push(defect);
  return defect;
}

export function getDefect(id: string): Defect | undefined {
  return defects.find((defect) => defect.id === id);
}

export function listDefects(): Defect[] {
  return defects;
}

export function resetStore(): void {
  defects = [];
}
