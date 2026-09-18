import { escapeHtml } from './escapeHtml.js';

function field(term, value) {
  return `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd>`;
}

export function renderDefectFieldsPanel(defect) {
  const assigneeName = defect.assignee ? defect.assignee.name : 'Unassigned';
  return `
    <section aria-labelledby="defect-fields-heading">
      <h2 id="defect-fields-heading">Details</h2>
      <dl class="defect-fields">
        ${field('Title', defect.title)}
        ${field('Description', defect.description)}
        ${field('Severity', defect.severity)}
        ${field('Priority', defect.priority)}
        ${field('Reporter', defect.reporter.name)}
        ${field('Assignee', assigneeName)}
        ${field('Component', defect.component)}
        ${field('Status', defect.status)}
      </dl>
    </section>
  `;
}
