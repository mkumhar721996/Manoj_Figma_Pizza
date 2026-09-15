import { escapeHtml } from './escapeHtml.js';
import { renderDefectFieldsPanel } from './defectFieldsPanel.js';
import { renderAuditInfo } from './auditInfo.js';
import { renderAttachmentsSection } from './attachmentsSection.js';
import { renderSlaIndicator } from './slaIndicator.js';

// Contrast-checked against WCAG 2.1 AA (>= 4.5:1 for normal text) in
// src/lib/a11y/contrastRatio.test.js — keep this as the single source of truth for both the
// rendered CSS and that verification so the two can't drift apart.
export const SLA_INDICATOR_COLORS = {
  at_risk: { background: '#fff3cd', text: '#664d03' },
  breached: { background: '#f8d7da', text: '#842029' },
};

export const PAGE_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 1rem; max-width: 60rem; margin-inline: auto; }
  a, button { min-height: 44px; display: inline-flex; align-items: center; }
  .defect-fields, .audit-info { display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1rem; }
  .attachments-list { list-style: none; padding: 0; }
  .attachments-list li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.5rem 0; flex-wrap: wrap; }
  .sla-indicator { padding: 0.5rem 1rem; border-radius: 0.25rem; font-weight: bold; }
  .sla-indicator--at_risk { background: ${SLA_INDICATOR_COLORS.at_risk.background}; color: ${SLA_INDICATOR_COLORS.at_risk.text}; }
  .sla-indicator--breached { background: ${SLA_INDICATOR_COLORS.breached.background}; color: ${SLA_INDICATOR_COLORS.breached.text}; }
  @media (max-width: 600px) {
    .defect-fields, .audit-info { grid-template-columns: 1fr; }
    .attachments-list li { flex-direction: column; }
  }
`;

function documentShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${PAGE_STYLES}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export function renderDefectDetailPage(dto) {
  const body = `
    <main>
      <h1>${escapeHtml(dto.title)}</h1>
      ${renderSlaIndicator(dto.slaStatus)}
      ${renderDefectFieldsPanel(dto)}
      ${renderAttachmentsSection(dto.attachments)}
      ${renderAuditInfo(dto)}
    </main>
  `;
  return documentShell(dto.title, body);
}

export function renderAccessDeniedPage() {
  return documentShell(
    'Access denied',
    '<main><h1>Access denied</h1><p>You do not have permission to view this defect.</p></main>',
  );
}

export function renderNotFoundPage() {
  return documentShell('Defect not found', '<main><h1>Defect not found</h1><p>This defect could not be found.</p></main>');
}
