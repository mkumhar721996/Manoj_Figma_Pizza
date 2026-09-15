export const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Defect {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  priority: Priority;
  reporter: string;
  component?: string;
  assignee?: string;
  attachments: string[];
  screenshots: string[];
  createdAt: string;
}

export interface NewDefectInput {
  title: string;
  description: string;
  severity: string;
  priority: string;
  reporter: string;
  component?: string;
  assignee?: string;
  attachments?: string[];
  screenshots?: string[];
}

export interface ProjectMember {
  id: string;
  name: string;
}

export class DefectApiError extends Error {
  errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super("Defect validation failed");
    this.name = "DefectApiError";
    this.errors = errors;
  }
}

export async function createDefect(input: NewDefectInput): Promise<Defect> {
  const response = await fetch("/api/defects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new DefectApiError(body.errors ?? {});
  }

  return (await response.json()) as Defect;
}

export async function getDefect(id: string): Promise<Defect> {
  const response = await fetch(`/api/defects/${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error(`Failed to load defect ${id}`);
  }

  return (await response.json()) as Defect;
}

export async function getProjectMembers(): Promise<ProjectMember[]> {
  const response = await fetch("/api/project-members");

  if (!response.ok) {
    throw new Error("Failed to load project members");
  }

  return (await response.json()) as ProjectMember[];
}
