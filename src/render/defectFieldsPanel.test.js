import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDefectFieldsPanel } from './defectFieldsPanel.js';

const mockDefect = {
  title: 'Login button is unresponsive',
  description: 'Clicking the login button does nothing on Safari.',
  severity: 'HIGH',
  priority: 'P1',
  reporter: { name: 'Ada Lovelace' },
  assignee: { name: 'Grace Hopper' },
  component: 'Authentication',
  status: 'IN_PROGRESS',
};

test('AC1: renders every defect field for an authorised viewer', () => {
  const html = renderDefectFieldsPanel(mockDefect);
  assert.match(html, /Login button is unresponsive/);
  assert.match(html, /Clicking the login button does nothing on Safari\./);
  assert.match(html, /HIGH/);
  assert.match(html, /P1/);
  assert.match(html, /Ada Lovelace/);
  assert.match(html, /Grace Hopper/);
  assert.match(html, /Authentication/);
  assert.match(html, /IN_PROGRESS/);
});

test('AC1: renders an unassigned placeholder when there is no assignee', () => {
  const html = renderDefectFieldsPanel({ ...mockDefect, assignee: null });
  assert.match(html, /Unassigned/i);
});
