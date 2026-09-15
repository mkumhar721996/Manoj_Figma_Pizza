import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateIds, getHeadingLevels, hasSkippedHeadingLevel, countLandmarks, linksMissingAccessibleName } from './htmlStructureChecks.js';

test('findDuplicateIds reports ids that appear more than once (axe: duplicate-id)', () => {
  assert.deepEqual(findDuplicateIds('<div id="a"></div><span id="b"></span>'), []);
  assert.deepEqual(findDuplicateIds('<div id="a"></div><span id="a"></span>'), ['a']);
});

test('getHeadingLevels extracts heading levels in document order', () => {
  assert.deepEqual(getHeadingLevels('<h1>Title</h1><h2>A</h2><h2>B</h2>'), [1, 2, 2]);
});

test('hasSkippedHeadingLevel is false for a properly nested outline (axe: heading-order)', () => {
  assert.equal(hasSkippedHeadingLevel([1, 2, 2, 2]), false);
});

test('hasSkippedHeadingLevel is true when a level is skipped', () => {
  assert.equal(hasSkippedHeadingLevel([1, 3]), true);
});

test('countLandmarks counts main landmarks (axe: landmark-one-main)', () => {
  assert.equal(countLandmarks('<main><h1>x</h1></main>', 'main'), 1);
  assert.equal(countLandmarks('<div>no landmark</div>', 'main'), 0);
});

test('linksMissingAccessibleName flags anchors with no discernible text (axe: link-name)', () => {
  assert.deepEqual(linksMissingAccessibleName('<a href="/x">Download file.png</a>'), []);
  assert.deepEqual(linksMissingAccessibleName('<a href="/x"></a>'), ['/x']);
});
