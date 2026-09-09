'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('../helpers/testServer');

test('AC1: POST /api/signup with a valid email and password creates a user with status unverified', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const res = await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'newuser@example.com', password: 'test1234' }),
  });

  assert.equal(res.status, 201);
  const user = server.userRepository.findByEmail('newuser@example.com');
  assert.ok(user);
  assert.equal(user.status, 'unverified');
});

test('AC2: POST /api/signup with a valid email and password dispatches a verification email to that address', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'newuser2@example.com', password: 'test1234' }),
  });

  assert.equal(server.emailSender.sentEmails.length, 1);
  assert.equal(server.emailSender.sentEmails[0].email, 'newuser2@example.com');
});

test('AC3: POST /api/signup with an already-registered verified email returns 409 nudging the user to log in or recover their password', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const token = server.userRepository.create({
    email: 'verified@example.com',
    passwordHash: 'irrelevant',
  }).verificationToken;
  server.userRepository.markVerified(server.userRepository.findByEmail('verified@example.com'));
  void token;

  const res = await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'verified@example.com', password: 'test1234' }),
  });

  assert.equal(res.status, 409);
  const body = await res.json();
  assert.match(body.message, /log in|password/i);
});

test('AC4: POST /api/signup with an already-registered unverified email resends the verification email instead of creating a new account', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pending@example.com', password: 'test1234' }),
  });

  const res = await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pending@example.com', password: 'anotherPass1' }),
  });

  assert.equal(res.status, 200);
  assert.equal(server.emailSender.sentEmails.length, 2);
  assert.equal(server.emailSender.sentEmails[1].email, 'pending@example.com');

  const usersWithEmail = [server.userRepository.findByEmail('pending@example.com')];
  assert.equal(usersWithEmail.length, 1);
});

test('AC5: POST /api/signup with an already-registered unverified email tells the user to check their inbox', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pending2@example.com', password: 'test1234' }),
  });

  const res = await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pending2@example.com', password: 'test1234' }),
  });

  const body = await res.json();
  assert.match(body.message, /check your inbox/i);
});

test('AC9: POST /api/signup with an invalid email and password returns 400 with validation errors and does not create a user or send an email', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const res = await fetch(`${server.baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.some((e) => e.field === 'email'));
  assert.ok(body.errors.some((e) => e.field === 'password'));
  assert.equal(server.userRepository.findByEmail('not-an-email'), null);
  assert.equal(server.emailSender.sentEmails.length, 0);
});
