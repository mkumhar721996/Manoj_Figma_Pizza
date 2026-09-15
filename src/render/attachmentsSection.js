import { escapeHtml } from './escapeHtml.js';

function renderAttachmentItem(attachment) {
  const filename = escapeHtml(attachment.filename);
  return `
    <li>
      <span>${filename}</span>
      <a href="${escapeHtml(attachment.url)}">Download ${filename}</a>
    </li>
  `;
}

export function renderAttachmentsSection(attachments) {
  const body =
    attachments.length === 0
      ? '<p>No attachments have been added to this defect.</p>'
      : `<ul class="attachments-list">${attachments.map(renderAttachmentItem).join('')}</ul>`;

  return `
    <section aria-labelledby="attachments-heading">
      <h2 id="attachments-heading">Attachments</h2>
      ${body}
    </section>
  `;
}
