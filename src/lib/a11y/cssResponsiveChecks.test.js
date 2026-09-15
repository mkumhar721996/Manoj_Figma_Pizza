import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findFixedWidthsWiderThan, hasMobileBreakpointBelow } from './cssResponsiveChecks.js';

test('findFixedWidthsWiderThan flags px widths that would overflow a narrow viewport', () => {
  assert.deepEqual(findFixedWidthsWiderThan('.card { width: 800px; }', 375), ['800px']);
  assert.deepEqual(findFixedWidthsWiderThan('.card { width: 100px; max-width: 60rem; }', 375), []);
});

test('findFixedWidthsWiderThan ignores non-pixel units such as rem or %', () => {
  assert.deepEqual(findFixedWidthsWiderThan('body { max-width: 60rem; width: 100%; }', 375), []);
});

test('hasMobileBreakpointBelow finds a max-width media query at or below the given viewport', () => {
  assert.equal(hasMobileBreakpointBelow('@media (max-width: 600px) { .a { color: red; } }', 375), true);
  assert.equal(hasMobileBreakpointBelow('@media (max-width: 300px) { .a { color: red; } }', 375), false);
  assert.equal(hasMobileBreakpointBelow('body { color: red; }', 375), false);
});
