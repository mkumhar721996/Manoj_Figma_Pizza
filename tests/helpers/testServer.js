const { createApp } = require('../../src/app');

function startTestServer() {
  const server = createApp();
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

module.exports = { startTestServer };
