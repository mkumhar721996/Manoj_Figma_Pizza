import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSlaStatus } from './computeSlaStatus.js';

const HOUR = 3_600_000;

test('AC4: returns BREACHED when elapsed time exceeds the breach threshold', () => {
  const defect = { createdAt: new Date(Date.now() - 50 * HOUR) };
  const policy = { atRiskHours: 24, breachHours: 48 };
  assert.equal(computeSlaStatus(defect, policy), 'BREACHED');
});

test('AC4: returns AT_RISK when elapsed time exceeds the at-risk threshold but not breach', () => {
  const defect = { createdAt: new Date(Date.now() - 30 * HOUR) };
  const policy = { atRiskHours: 24, breachHours: 48 };
  assert.equal(computeSlaStatus(defect, policy), 'AT_RISK');
});

test('AC5: returns ON_TRACK when a policy is configured but the defect is within SLA', () => {
  const defect = { createdAt: new Date() };
  const policy = { atRiskHours: 24, breachHours: 48 };
  assert.equal(computeSlaStatus(defect, policy), 'ON_TRACK');
});

test('AC6: returns null when no SLA policy is configured for the project', () => {
  const defect = { createdAt: new Date() };
  assert.equal(computeSlaStatus(defect, null), null);
});
