const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, extractCookie } = require('./helpers/testServer');
const { getCredentials } = require('../src/config/credentials');

test('AC1: unauthenticated user is redirected to login', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const dashboardResponse = await fetch(`${server.baseUrl}/admin`, { redirect: 'manual' });
  assert.equal(dashboardResponse.status, 302);
  assert.equal(dashboardResponse.headers.get('location'), '/admin/login');

  const ordersResponse = await fetch(`${server.baseUrl}/admin/orders`, { redirect: 'manual' });
  assert.equal(ordersResponse.status, 302);
  assert.equal(ordersResponse.headers.get('location'), '/admin/login');
});

test('AC2: correct credentials grant access to the admin panel', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());
  const [username, password] = getCredentials();

  const loginResponse = await fetch(`${server.baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }).toString(),
    redirect: 'manual',
  });
  assert.equal(loginResponse.status, 302);
  assert.equal(loginResponse.headers.get('location'), '/admin');
  const sessionCookie = extractCookie(loginResponse, 'sid');
  assert.ok(sessionCookie, 'expected a session cookie to be set');

  const dashboardResponse = await fetch(`${server.baseUrl}/admin`, {
    headers: { Cookie: sessionCookie },
    redirect: 'manual',
  });
  assert.equal(dashboardResponse.status, 200);
});

test('AC3: incorrect credentials show an error and deny access', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const loginResponse = await fetch(`${server.baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'wrong', password: 'wrong' }).toString(),
    redirect: 'manual',
  });
  assert.equal(loginResponse.status, 200);
  const body = await loginResponse.text();
  assert.match(body, /Invalid username or password/);
  assert.equal(loginResponse.headers.get('set-cookie'), null);

  const dashboardResponse = await fetch(`${server.baseUrl}/admin`, { redirect: 'manual' });
  assert.equal(dashboardResponse.status, 302);
  assert.equal(dashboardResponse.headers.get('location'), '/admin/login');
});

test('AC4: logout ends the session and returns to the login page', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());
  const [username, password] = getCredentials();

  const loginResponse = await fetch(`${server.baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }).toString(),
    redirect: 'manual',
  });
  const sessionCookie = extractCookie(loginResponse, 'sid');

  const logoutResponse = await fetch(`${server.baseUrl}/admin/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
    redirect: 'manual',
  });
  assert.equal(logoutResponse.status, 302);
  assert.equal(logoutResponse.headers.get('location'), '/admin/login');

  const dashboardResponse = await fetch(`${server.baseUrl}/admin`, {
    headers: { Cookie: sessionCookie },
    redirect: 'manual',
  });
  assert.equal(dashboardResponse.status, 302);
  assert.equal(dashboardResponse.headers.get('location'), '/admin/login');
});

test('AC5: authenticated session persists without re-prompting for login', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());
  const [username, password] = getCredentials();

  const loginResponse = await fetch(`${server.baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }).toString(),
    redirect: 'manual',
  });
  const sessionCookie = extractCookie(loginResponse, 'sid');

  for (let i = 0; i < 3; i += 1) {
    const response = await fetch(`${server.baseUrl}/admin`, {
      headers: { Cookie: sessionCookie },
      redirect: 'manual',
    });
    assert.equal(response.status, 200);
  }
});
