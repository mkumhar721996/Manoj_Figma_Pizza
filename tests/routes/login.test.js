'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('../helpers/testServer');

test('AC6: POST /api/login for an unverified account returns 403 and does not grant access', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unverified@example.com', password: 'test1234' }),
  });

  const res = await fetch(`${server.baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unverified@example.com', password: 'test1234' }),
  });

  assert.equal(res.status, 403);
});

test('AC7: POST /api/login for an unverified account prompts the user to check their inbox for the verification link', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unverified2@example.com', password: 'test1234' }),
  });

  const res = await fetch(`${server.baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unverified2@example.com', password: 'test1234' }),
  });

  const body = await res.json();
  assert.match(body.message, /check your inbox/i);
  assert.match(body.message, /verification/i);
});
