export const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

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
