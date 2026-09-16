import type { Defect, SlaEvaluation, SlaRule } from './types.ts';

const TERMINAL_STATUSES = new Set<Defect['status']>(['Closed', 'Cancelled']);

const HOUR_MS = 1000 * 60 * 60;

export function evaluateSla(
  defect: Defect,
  rule: SlaRule | undefined,
  now: Date
): SlaEvaluation | null {
  if (!rule) {
    return null;
  }

  const isTerminal = TERMINAL_STATUSES.has(defect.status);
  const evaluationClock = isTerminal && defect.terminalAt ? defect.terminalAt : now;
  const ageHours = (evaluationClock.getTime() - defect.createdAt.getTime()) / HOUR_MS;

  let status: SlaEvaluation['status'] = 'ON_TRACK';
  if (ageHours >= rule.breachThresholdHours) {
    status = 'BREACHED';
  } else if (ageHours >= rule.atRiskThresholdHours) {
    status = 'AT_RISK';
  }

  return { status, isTerminal };
}
