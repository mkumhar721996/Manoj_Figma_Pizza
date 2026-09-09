'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('../helpers/testServer');

test('AC10: GET /api/verify-email/:token with a valid token transitions the matching user to verified', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'toverify@example.com', password: 'test1234' }),
  });

  const token = server.emailSender.sentEmails[0].token;

  await fetch(`${server.baseUrl}/api/verify-email/${token}`);

  const user = server.userRepository.findByEmail('toverify@example.com');
  assert.equal(user.status, 'verified');
});

test('AC11: GET /api/verify-email/:token with a valid token grants access', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'toverify2@example.com', password: 'test1234' }),
  });

  const token = server.emailSender.sentEmails[0].token;

  const res = await fetch(`${server.baseUrl}/api/verify-email/${token}`);

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.match(body.message, /verified|access/i);

  const loginRes = await fetch(`${server.baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'toverify2@example.com', password: 'test1234' }),
  });
  assert.equal(loginRes.status, 200);
});
