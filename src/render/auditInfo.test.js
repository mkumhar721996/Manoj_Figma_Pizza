import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAuditInfo } from './auditInfo.js';

test('AC11: displays created-by/at and last-modified-by/at metadata', () => {
  const html = renderAuditInfo({
    createdBy: { name: 'Ada Lovelace' },
    createdAt: '2026-01-05T10:00:00Z',
    updatedBy: { name: 'Grace Hopper' },
    updatedAt: '2026-02-01T09:30:00Z',
  });
  assert.match(html, /Ada Lovelace/);
  assert.match(html, /Grace Hopper/);
  assert.match(html, /2026-01-05/);
  assert.match(html, /2026-02-01/);
});
