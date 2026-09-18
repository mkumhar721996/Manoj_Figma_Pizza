import { escapeHtml } from './escapeHtml.js';

function formatTimestamp(isoString) {
  return escapeHtml(isoString.slice(0, 10));
}

export function renderAuditInfo({ createdBy, createdAt, updatedBy, updatedAt }) {
  return `
    <section aria-labelledby="audit-info-heading">
      <h2 id="audit-info-heading">Audit information</h2>
      <dl class="audit-info">
        <dt>Created by</dt>
        <dd>${escapeHtml(createdBy.name)}</dd>
        <dt>Created at</dt>
        <dd><time datetime="${escapeHtml(createdAt)}">${formatTimestamp(createdAt)}</time></dd>
        <dt>Last modified by</dt>
        <dd>${escapeHtml(updatedBy.name)}</dd>
        <dt>Last modified at</dt>
        <dd><time datetime="${escapeHtml(updatedAt)}">${formatTimestamp(updatedAt)}</time></dd>
      </dl>
    </section>
  `;
}
