const { test } = require('node:test');
const assert = require('node:assert/strict');
const { passwordsMatch } = require('./passwordMatch');

test('passwordsMatch returns true when password and confirmation are identical', () => {
  assert.equal(passwordsMatch('SliceHouse2024', 'SliceHouse2024'), true);
});

test('passwordsMatch returns false when password and confirmation differ', () => {
  assert.equal(passwordsMatch('SliceHouse2024', 'Different2024'), false);
});
