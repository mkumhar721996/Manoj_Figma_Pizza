export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type DefectStatus = 'Open' | 'InProgress' | 'Closed' | 'Cancelled';

export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export interface SlaRule {
  projectId: string;
  priority: Priority;
  atRiskThresholdHours: number;
  breachThresholdHours: number;
}

export interface Defect {
  id: string;
  projectId: string;
  priority: Priority;
  status: DefectStatus;
  createdAt: Date;
  /** Set when the defect transitions to a terminal status (Closed/Cancelled). */
  terminalAt?: Date;
}

export interface SlaEvaluation {
  status: SlaStatus;
  isTerminal: boolean;
}
