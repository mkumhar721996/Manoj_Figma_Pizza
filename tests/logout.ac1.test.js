const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, request } = require('./helpers/testServer');

test('AC1: logout invalidates the server-side session', async () => {
  const { server, port, sessionStore } = await startTestServer();
  try {
    const sid = sessionStore.create('user-1');
    assert.ok(sessionStore.get(sid), 'session should exist before logout');

    await request(port, {
      method: 'POST',
      path: '/logout',
      headers: { Cookie: `sid=${sid}` },
    });

    assert.equal(
      sessionStore.get(sid),
      null,
      'session should be destroyed server-side after logout'
    );
  } finally {
    await stopTestServer(server);
  }
});
