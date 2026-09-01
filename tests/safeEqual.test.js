const test = require('node:test');
const assert = require('node:assert/strict');
const { safeEqual } = require('../src/utils/safeEqual');

test('safeEqual returns true for identical strings', () => {
  assert.equal(safeEqual('changeme123', 'changeme123'), true);
});

test('safeEqual returns false for different strings of the same length', () => {
  assert.equal(safeEqual('changeme123', 'changeme124'), false);
});

test('safeEqual returns false for strings of different lengths', () => {
  assert.equal(safeEqual('short', 'a-much-longer-value'), false);
});

test('safeEqual returns false when either value is undefined', () => {
  assert.equal(safeEqual(undefined, 'changeme123'), false);
  assert.equal(safeEqual('changeme123', undefined), false);
});
