const { createApp } = require('../../src/app');

const ADMIN_TOKEN = 'test-admin-token';
process.env.ADMIN_API_TOKEN = ADMIN_TOKEN;

function startTestServer() {
  const server = createApp();
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function adminHeaders(extra = {}) {
  return { Authorization: `Bearer ${ADMIN_TOKEN}`, ...extra };
}

module.exports = { startTestServer, adminHeaders, ADMIN_TOKEN };
