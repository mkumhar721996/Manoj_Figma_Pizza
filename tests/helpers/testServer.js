const http = require('http');
const { createApp } = require('../../src/app');
const { SessionStore } = require('../../src/session/sessionStore');

function startTestServer() {
  const sessionStore = new SessionStore();
  const app = createApp(sessionStore);
  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port, sessionStore });
    });
  });
}

function stopTestServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function request(port, { method = 'GET', path = '/', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: 'localhost', port, method, path, headers },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

module.exports = { startTestServer, stopTestServer, request };
