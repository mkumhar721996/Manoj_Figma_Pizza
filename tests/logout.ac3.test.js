const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, request } = require('./helpers/testServer');

test('AC3: after logout, navigating to a protected page redirects to login', async () => {
  const { server, port, sessionStore } = await startTestServer();
  try {
    const sid = sessionStore.create('user-1');

    await request(port, {
      method: 'POST',
      path: '/logout',
      headers: { Cookie: `sid=${sid}` },
    });

    const res = await request(port, {
      method: 'GET',
      path: '/dashboard',
      headers: { Cookie: `sid=${sid}` },
    });

    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.location, '/login');
    assert.doesNotMatch(res.body, /Protected dashboard content/);
  } finally {
    await stopTestServer(server);
  }
});
