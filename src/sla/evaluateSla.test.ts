import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateSla } from './evaluateSla.ts';
import type { Defect, SlaRule } from './types.ts';

const rule: SlaRule = {
  projectId: 'proj-1',
  priority: 'P1',
  atRiskThresholdHours: 24,
  breachThresholdHours: 48,
};

const defect: Defect = {
  id: 'd-1',
  projectId: 'proj-1',
  priority: 'P1',
  status: 'Open',
  createdAt: new Date('2026-09-14T00:00:00Z'),
};

// AC1: at-risk / breached thresholds, including boundaries and a second priority tier.
test('returns AT_RISK once age crosses the at-risk threshold', () => {
  const now = new Date('2026-09-15T06:00:00Z'); // 30h old
  assert.deepEqual(evaluateSla(defect, rule, now), { status: 'AT_RISK', isTerminal: false });
});

test('returns AT_RISK exactly at the at-risk threshold boundary', () => {
  const now = new Date('2026-09-15T00:00:00Z'); // exactly 24h old
  assert.deepEqual(evaluateSla(defect, rule, now), { status: 'AT_RISK', isTerminal: false });
});

test('returns BREACHED once age crosses the breach threshold', () => {
  const now = new Date('2026-09-16T02:00:00Z'); // 50h old
  assert.deepEqual(evaluateSla(defect, rule, now), { status: 'BREACHED', isTerminal: false });
});

test('returns BREACHED exactly at the breach threshold boundary', () => {
  const now = new Date('2026-09-16T00:00:00Z'); // exactly 48h old
  assert.deepEqual(evaluateSla(defect, rule, now), { status: 'BREACHED', isTerminal: false });
});

test('applies a tighter threshold for a higher-priority defect', () => {
  const p0Rule: SlaRule = {
    projectId: 'proj-1',
    priority: 'P0',
    atRiskThresholdHours: 4,
    breachThresholdHours: 8,
  };
  const p0Defect: Defect = { ...defect, priority: 'P0' };
  const now = new Date('2026-09-14T05:00:00Z'); // 5h old
  assert.deepEqual(evaluateSla(p0Defect, p0Rule, now), { status: 'AT_RISK', isTerminal: false });
});

// AC2: within SLA, no breach.
test('returns ON_TRACK when the defect is within SLA', () => {
  const now = new Date('2026-09-14T02:00:00Z'); // 2h old
  assert.deepEqual(evaluateSla(defect, rule, now), { status: 'ON_TRACK', isTerminal: false });
});

test('returns ON_TRACK just under the at-risk threshold boundary', () => {
  const now = new Date('2026-09-14T23:59:59Z'); // 23h59m59s old
  assert.deepEqual(evaluateSla(defect, rule, now), { status: 'ON_TRACK', isTerminal: false });
});

// AC3: terminal transition reflects the state computed at closure.
test('reflects the AT_RISK state computed at the terminal transition', () => {
  const closed: Defect = { ...defect, status: 'Closed', terminalAt: new Date('2026-09-15T06:00:00Z') };
  assert.deepEqual(evaluateSla(closed, rule, new Date('2026-09-15T06:00:01Z')), {
    status: 'AT_RISK',
    isTerminal: true,
  });
});

test('freezes state at the terminal transition for Cancelled defects too', () => {
  const cancelled: Defect = { ...defect, status: 'Cancelled', terminalAt: new Date('2026-09-16T02:00:00Z') };
  assert.deepEqual(evaluateSla(cancelled, rule, new Date('2026-09-16T02:00:01Z')), {
    status: 'BREACHED',
    isTerminal: true,
  });
});

test('reports ON_TRACK with isTerminal true when the defect closed healthy', () => {
  const closedHealthy: Defect = { ...defect, status: 'Closed', terminalAt: new Date('2026-09-14T02:00:00Z') };
  assert.deepEqual(evaluateSla(closedHealthy, rule, new Date('2026-09-20T00:00:00Z')), {
    status: 'ON_TRACK',
    isTerminal: true,
  });
});

// AC4: no further escalation after the terminal transition, even much later.
test('does not re-escalate an AT_RISK terminal snapshot when evaluated long after', () => {
  const closed: Defect = { ...defect, status: 'Closed', terminalAt: new Date('2026-09-15T06:00:00Z') };
  const muchLater = new Date('2030-01-01T00:00:00Z');
  assert.deepEqual(evaluateSla(closed, rule, muchLater), { status: 'AT_RISK', isTerminal: true });
});

test('does not change a BREACHED terminal snapshot when evaluated long after', () => {
  const closed: Defect = { ...defect, status: 'Closed', terminalAt: new Date('2026-09-16T02:00:00Z') };
  const muchLater = new Date('2030-01-01T00:00:00Z');
  assert.deepEqual(evaluateSla(closed, rule, muchLater), { status: 'BREACHED', isTerminal: true });
});

// AC5: no rule configured.
test('returns null when no rule is provided', () => {
  assert.equal(evaluateSla(defect, undefined, new Date()), null);
});
