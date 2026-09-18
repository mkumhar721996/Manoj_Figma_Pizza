import type { SlaEvaluation } from '../sla/types.ts';

export function renderSlaIndicator(evaluation: SlaEvaluation | null): string {
  if (evaluation === null || evaluation.status === 'ON_TRACK') {
    return '';
  }

  const label = evaluation.status === 'BREACHED' ? 'Breached' : 'At Risk';
  const text = evaluation.isTerminal ? `Closed – ${label}` : label;

  return `<span data-testid="sla-indicator">${text}</span>`;
}
