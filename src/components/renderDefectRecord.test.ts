import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderDefectRecord } from './renderDefectRecord.ts';
import type { Defect, SlaRule } from '../sla/types.ts';

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

// AC1 / AC2: indicator present when at risk/breached, absent when within SLA.
test('shows an SLA indicator when the defect is at risk', () => {
  const html = renderDefectRecord(defect, [rule], new Date('2026-09-15T06:00:00Z'));
  assert.match(html, /data-testid="sla-indicator"/);
  assert.match(html, /At Risk/);
});

test('shows no SLA indicator when the defect is within SLA', () => {
  const html = renderDefectRecord(defect, [rule], new Date('2026-09-14T02:00:00Z'));
  assert.doesNotMatch(html, /data-testid="sla-indicator"/);
});

// AC3 / AC4: terminal transition freezes the indicator, no further escalation.
test('never shows an escalation beyond what was frozen at closure', () => {
  const closed: Defect = { ...defect, status: 'Closed', terminalAt: new Date('2026-09-15T06:00:00Z') };
  const html = renderDefectRecord(closed, [rule], new Date('2030-01-01T00:00:00Z'));
  assert.match(html, /At Risk/i);
  assert.doesNotMatch(html, /Breached/i);
});

// AC5: no SLA rules configured for the project.
test('shows no SLA indicator when no rule is configured', () => {
  const html = renderDefectRecord(defect, [], new Date());
  assert.doesNotMatch(html, /data-testid="sla-indicator"/);
});

test('shows no SLA indicator when rules exist for other projects/priorities only', () => {
  const otherProjectRule: SlaRule = {
    projectId: 'proj-9',
    priority: 'P1',
    atRiskThresholdHours: 1,
    breachThresholdHours: 2,
  };
  const html = renderDefectRecord(defect, [otherProjectRule], new Date('2026-09-20T00:00:00Z'));
  assert.doesNotMatch(html, /data-testid="sla-indicator"/);
});

// Security: untrusted defect IDs must not be able to inject markup/script.
test('escapes HTML-significant characters in the defect id', () => {
  const malicious: Defect = { ...defect, id: '"><script>alert(1)</script>' };
  const html = renderDefectRecord(malicious, [rule], new Date('2026-09-14T02:00:00Z'));
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

// AC6: rendering the full record end-to-end performs no network call.
test('does not call fetch when rendering a breached defect end-to-end', () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    return Promise.resolve(new Response());
  }) as typeof fetch;
  try {
    const overdue: Defect = { ...defect, createdAt: new Date('2026-09-10T00:00:00Z') };
    const html = renderDefectRecord(overdue, [rule], new Date('2026-09-16T00:00:00Z'));
    assert.match(html, /Breached/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
