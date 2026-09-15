import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from './session.js';

const secret = 'test-session-secret';

test('a token issued for a user verifies back to that same user id', () => {
  const token = createSessionToken('user-member-a', secret);
  const result = verifySessionToken(token, secret);
  assert.equal(result, 'user-member-a');
});

test('a tampered token (different user id spliced in) is rejected', () => {
  const token = createSessionToken('user-member-a', secret);
  const [payload] = token.split('.');
  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const [, expiresAt] = decoded.split(':');
  const forgedPayload = Buffer.from(`user-outsider:${expiresAt}`, 'utf8').toString('base64url');
  const [, signature] = token.split('.');
  const forgedToken = `${forgedPayload}.${signature}`;

  assert.equal(verifySessionToken(forgedToken, secret), null);
});

test('an expired token is rejected', () => {
  const token = createSessionToken('user-member-a', secret, { ttlMs: -1000 });
  assert.equal(verifySessionToken(token, secret), null);
});

test('a token signed with a different secret is rejected', () => {
  const token = createSessionToken('user-member-a', secret);
  assert.equal(verifySessionToken(token, 'a-different-secret'), null);
});

test('a malformed token is rejected without throwing', () => {
  assert.equal(verifySessionToken('not-a-real-token', secret), null);
  assert.equal(verifySessionToken('', secret), null);
});
