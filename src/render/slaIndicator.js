const LABELS = {
  BREACHED: 'SLA breached',
  AT_RISK: 'SLA at risk',
};

export function renderSlaIndicator(status) {
  const label = LABELS[status];
  if (!label) return '';
  return `<p role="status" class="sla-indicator sla-indicator--${status.toLowerCase()}">${label}</p>`;
}
