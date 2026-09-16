import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveSlaRule } from './resolveSlaRule.ts';
import type { Defect, SlaRule } from './types.ts';

const defect: Defect = {
  id: 'd-1',
  projectId: 'proj-1',
  priority: 'P1',
  status: 'Open',
  createdAt: new Date('2026-09-14T00:00:00Z'),
};

const rule: SlaRule = {
  projectId: 'proj-1',
  priority: 'P1',
  atRiskThresholdHours: 24,
  breachThresholdHours: 48,
};

test('picks the matching project+priority rule among several configured', () => {
  const rules: SlaRule[] = [
    { projectId: 'proj-2', priority: 'P1', atRiskThresholdHours: 1, breachThresholdHours: 2 },
    { projectId: 'proj-1', priority: 'P0', atRiskThresholdHours: 1, breachThresholdHours: 2 },
    rule,
  ];
  assert.deepEqual(resolveSlaRule(rules, defect), rule);
});

test('returns undefined when no rule matches the project', () => {
  assert.equal(resolveSlaRule([], defect), undefined);
});

test('returns undefined when a rule exists for the project but not this priority', () => {
  const otherPriorityRule: SlaRule = {
    projectId: 'proj-1',
    priority: 'P2',
    atRiskThresholdHours: 24,
    breachThresholdHours: 48,
  };
  assert.equal(resolveSlaRule([otherPriorityRule], defect), undefined);
});
