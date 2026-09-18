import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_STYLES } from './defectDetailPage.js';
import { findFixedWidthsWiderThan, hasMobileBreakpointBelow } from '../lib/a11y/cssResponsiveChecks.js';

const MOBILE_VIEWPORT_WIDTH = 375;

test('AC10: no fixed pixel width in the page CSS would overflow a 375px mobile viewport', () => {
  assert.deepEqual(findFixedWidthsWiderThan(PAGE_STYLES, MOBILE_VIEWPORT_WIDTH), []);
});

test('AC10: the page defines a mobile breakpoint at or above the 375px reference viewport', () => {
  assert.equal(hasMobileBreakpointBelow(PAGE_STYLES, MOBILE_VIEWPORT_WIDTH), true);
});
