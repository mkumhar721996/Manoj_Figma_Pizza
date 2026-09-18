import { getAuthHeaders } from "../auth/session";

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

function createTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const traceId = createTraceId();
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const method = init.method ?? "GET";
  const headers = { ...getAuthHeaders(), "X-Trace-Id": traceId, ...init.headers };

  try {
    const response = await fetch(url, { ...init, headers });
    const durationMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
    const logMethod = response.ok ? console.log : console.error;
    logMethod("[api]", { traceId, method, url, status: response.status, durationMs: Math.round(durationMs) });
    return response;
  } catch (error) {
    const durationMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
    console.error("[api]", { traceId, method, url, error, durationMs: Math.round(durationMs) });
    throw error;
  }
}

export async function createDefect(input: NewDefectInput): Promise<Defect> {
  const response = await apiFetch("/api/defects", {
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
  const response = await apiFetch(`/api/defects/${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error(`Failed to load defect ${id}`);
  }

  return (await response.json()) as Defect;
}

export async function getProjectMembers(): Promise<ProjectMember[]> {
  const response = await apiFetch("/api/project-members");

  if (!response.ok) {
    throw new Error("Failed to load project members");
  }

  return (await response.json()) as ProjectMember[];
}
