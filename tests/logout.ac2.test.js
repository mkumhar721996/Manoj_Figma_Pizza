const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, request } = require('./helpers/testServer');

test('AC2: logout redirects to the login page', async () => {
  const { server, port, sessionStore } = await startTestServer();
  try {
    const sid = sessionStore.create('user-1');

    const res = await request(port, {
      method: 'POST',
      path: '/logout',
      headers: { Cookie: `sid=${sid}` },
    });

    assert.ok(
      res.statusCode === 302 || res.statusCode === 303,
      `expected a redirect status, got ${res.statusCode}`
    );
    assert.equal(res.headers.location, '/login');
  } finally {
    await stopTestServer(server);
  }
});
