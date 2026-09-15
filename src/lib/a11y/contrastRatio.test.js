import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, meetsWcagAA } from './contrastRatio.js';

test('black on white has the maximum contrast ratio of 21:1', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01);
});

test('identical colors have a contrast ratio of 1:1', () => {
  assert.ok(Math.abs(contrastRatio('#664d03', '#664d03') - 1) < 0.01);
});

test('contrast ratio is symmetric regardless of argument order', () => {
  assert.ok(Math.abs(contrastRatio('#664d03', '#fff3cd') - contrastRatio('#fff3cd', '#664d03')) < 0.001);
});

test('AC9: meetsWcagAA is true at or above 4.5:1 for normal text, false below it', () => {
  assert.equal(meetsWcagAA(4.5), true);
  assert.equal(meetsWcagAA(4.49), false);
});
