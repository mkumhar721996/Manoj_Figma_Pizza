import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSlaIndicator } from './slaIndicator.js';

test('AC4: renders a visible breach badge when status is BREACHED', () => {
  const html = renderSlaIndicator('BREACHED');
  assert.match(html, /role="status"/);
  assert.match(html, /breach/i);
});

test('AC4: renders a visible at-risk badge when status is AT_RISK', () => {
  const html = renderSlaIndicator('AT_RISK');
  assert.match(html, /role="status"/);
  assert.match(html, /at.risk/i);
});

test('AC5: renders nothing when the defect is within SLA (ON_TRACK)', () => {
  const html = renderSlaIndicator('ON_TRACK');
  assert.equal(html, '');
});

test('AC6: renders nothing when no SLA policy is configured (null)', () => {
  const html = renderSlaIndicator(null);
  assert.equal(html, '');
});
