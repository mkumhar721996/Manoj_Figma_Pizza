import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLA_INDICATOR_COLORS, renderDefectDetailPage } from './defectDetailPage.js';
import { contrastRatio, meetsWcagAA } from '../lib/a11y/contrastRatio.js';
import {
  findDuplicateIds,
  getHeadingLevels,
  hasSkippedHeadingLevel,
  countLandmarks,
  linksMissingAccessibleName,
} from '../lib/a11y/htmlStructureChecks.js';

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

test('AC9: the at-risk SLA indicator colors meet WCAG 2.1 AA text contrast (>= 4.5:1)', () => {
  const { background, text } = SLA_INDICATOR_COLORS.at_risk;
  assert.ok(meetsWcagAA(contrastRatio(background, text)));
});

test('AC9: the breached SLA indicator colors meet WCAG 2.1 AA text contrast (>= 4.5:1)', () => {
  const { background, text } = SLA_INDICATOR_COLORS.breached;
  assert.ok(meetsWcagAA(contrastRatio(background, text)));
});

test('AC9: the rendered detail page has no duplicate ids (axe: duplicate-id)', () => {
  const html = renderDefectDetailPage(dto);
  assert.deepEqual(findDuplicateIds(html), []);
});

test('AC9: the rendered detail page has no skipped heading levels (axe: heading-order)', () => {
  const html = renderDefectDetailPage(dto);
  assert.equal(hasSkippedHeadingLevel(getHeadingLevels(html)), false);
});

test('AC9: the rendered detail page has exactly one main landmark (axe: landmark-one-main)', () => {
  const html = renderDefectDetailPage(dto);
  assert.equal(countLandmarks(html, 'main'), 1);
});

test('AC9: every link on the rendered detail page has a discernible name (axe: link-name)', () => {
  const html = renderDefectDetailPage(dto);
  assert.deepEqual(linksMissingAccessibleName(html), []);
});
