const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, request } = require('./helpers/testServer');

test('AC4: back-button replay of a protected page after logout redirects to login, and the page was never cacheable', async () => {
  const { server, port, sessionStore } = await startTestServer();
  try {
    const sid = sessionStore.create('user-1');

    const beforeLogout = await request(port, {
      method: 'GET',
      path: '/dashboard',
      headers: { Cookie: `sid=${sid}` },
    });
    assert.equal(beforeLogout.statusCode, 200);
    assert.equal(
      beforeLogout.headers['cache-control'],
      'no-store',
      'protected page must not be cacheable, so the browser cannot serve it from cache on back-navigation'
    );

    await request(port, {
      method: 'POST',
      path: '/logout',
      headers: { Cookie: `sid=${sid}` },
    });

    const backButtonReplay = await request(port, {
      method: 'GET',
      path: '/dashboard',
      headers: { Cookie: `sid=${sid}` },
    });

    assert.equal(backButtonReplay.statusCode, 302);
    assert.equal(backButtonReplay.headers.location, '/login');
  } finally {
    await stopTestServer(server);
  }
});
