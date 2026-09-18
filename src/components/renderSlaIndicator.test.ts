import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderSlaIndicator } from './renderSlaIndicator.ts';
import type { SlaEvaluation } from '../sla/types.ts';

function evaluation(overrides: Partial<SlaEvaluation>): SlaEvaluation {
  return { status: 'ON_TRACK', isTerminal: false, ...overrides };
}

// AC1: visible at-risk/breached indicator.
test('renders a visible breached badge', () => {
  const html = renderSlaIndicator(evaluation({ status: 'BREACHED' }));
  assert.match(html, /data-testid="sla-indicator"/);
  assert.match(html, /Breached/);
});

test('renders a visible at-risk badge', () => {
  const html = renderSlaIndicator(evaluation({ status: 'AT_RISK' }));
  assert.match(html, /data-testid="sla-indicator"/);
  assert.match(html, /At Risk/);
});

// AC2 / AC5: no indicator when on-track or no evaluation available.
test('renders nothing when status is ON_TRACK', () => {
  assert.equal(renderSlaIndicator(evaluation({ status: 'ON_TRACK' })), '');
});

test('renders nothing when evaluation is null', () => {
  assert.equal(renderSlaIndicator(null), '');
});

// AC3: terminal-qualified badge for closed/cancelled defects.
test('shows a terminal-qualified badge for closed defects', () => {
  const html = renderSlaIndicator(evaluation({ status: 'BREACHED', isTerminal: true }));
  assert.match(html, /closed.*breached/i);
});

test('shows no badge for a defect that closed while still ON_TRACK', () => {
  assert.equal(renderSlaIndicator(evaluation({ status: 'ON_TRACK', isTerminal: true })), '');
});

// AC6: rendering performs no network call.
test('does not trigger any network call when rendering a breached indicator', () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    return Promise.resolve(new Response());
  }) as typeof fetch;
  try {
    renderSlaIndicator(evaluation({ status: 'BREACHED' }));
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
