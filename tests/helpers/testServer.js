const http = require('http');
const { createApp } = require('../../src/app');

async function startTestServer() {
  const server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;
  return {
    baseUrl,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function extractCookie(response, name) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${name}=([^;]*)`));
  return match ? match[0] : null;
}

module.exports = { startTestServer, extractCookie };
