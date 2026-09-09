'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSignupInput } = require('../../src/validation/signupValidator');

test('AC8: returns a field error for a missing email', () => {
  const errors = validateSignupInput({ email: '', password: 'test1234' });
  assert.ok(errors.some((e) => e.field === 'email'));
});

test('AC8: returns a field error for a malformed email', () => {
  const errors = validateSignupInput({ email: 'not-an-email', password: 'test1234' });
  assert.ok(errors.some((e) => e.field === 'email'));
});

test('AC8: returns a field error for a password below minimum requirements', () => {
  const errors = validateSignupInput({ email: 'visitor@example.com', password: 'short' });
  assert.ok(errors.some((e) => e.field === 'password'));
});

test('AC8: returns no errors for a valid email and password', () => {
  const errors = validateSignupInput({ email: 'visitor@example.com', password: 'test1234' });
  assert.deepEqual(errors, []);
});
