import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDefectDetailPage, renderAccessDeniedPage, renderNotFoundPage } from './defectDetailPage.js';

const dto = {
  title: 'Login button is unresponsive',
  description: 'Clicking login does nothing on Safari.',
  severity: 'HIGH',
  priority: 'P1',
  reporter: { name: 'Ada Lovelace' },
  assignee: { name: 'Grace Hopper' },
  component: 'Authentication',
  status: 'IN_PROGRESS',
  createdBy: { name: 'Alan Turing' },
  createdAt: '2026-01-05T10:00:00Z',
  updatedBy: { name: 'Margaret Hamilton' },
  updatedAt: '2026-02-01T09:30:00Z',
  attachments: [{ id: 'a1', filename: 'screenshot.png', url: '/files/a1' }],
  slaStatus: 'AT_RISK',
};

test('AC1/AC9/AC10: renders a single accessible, responsive document with all sections', () => {
  const html = renderDefectDetailPage(dto);

  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, 'exactly one page-level h1');
  assert.match(html, /Login button is unresponsive/);
  assert.match(html, /screenshot\.png/);
  assert.match(html, /Alan Turing/);
  assert.match(html, /role="status"/);
  assert.match(html, /@media \(max-width: 600px\)/);
});

test('AC5/AC6: omits the SLA indicator when the status is ON_TRACK or null', () => {
  const onTrackHtml = renderDefectDetailPage({ ...dto, slaStatus: 'ON_TRACK' });
  assert.doesNotMatch(onTrackHtml, /role="status"/);

  const noPolicyHtml = renderDefectDetailPage({ ...dto, slaStatus: null });
  assert.doesNotMatch(noPolicyHtml, /role="status"/);
});

test('AC8: renders an access denied page', () => {
  const html = renderAccessDeniedPage();
  assert.match(html, /access denied/i);
});

test('renders a not found page for a missing defect', () => {
  const html = renderNotFoundPage();
  assert.match(html, /not found/i);
});
