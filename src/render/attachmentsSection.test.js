import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAttachmentsSection } from './attachmentsSection.js';

test('AC2: lists each attachment with its filename and a download link', () => {
  const html = renderAttachmentsSection([{ id: 'a1', filename: 'screenshot.png', url: '/files/a1' }]);
  assert.match(html, /screenshot\.png/);
  assert.match(html, /href="\/files\/a1"/);
  assert.match(html, /Download screenshot\.png/i);
});

test('AC3: shows an empty-state message when there are no attachments', () => {
  const html = renderAttachmentsSection([]);
  assert.match(html, /no attachments/i);
});
