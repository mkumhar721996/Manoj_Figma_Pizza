const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const { createApp } = require('../../src/app');
const { createDefaultDeps } = require('../../src/deps');

let server;
let baseUrl;

before(async () => {
  const app = createApp(createDefaultDeps());
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('AC1: forgot-password page presents a field to enter the registered email or mobile number', async () => {
  const res = await fetch(`${baseUrl}/forgot-password.html`);
  const text = await res.text();

  assert.equal(res.status, 200);
  assert.match(text, /id="forgot-identifier"/);
});

test('AC1: login page contains the "Forgot password?" link', async () => {
  const res = await fetch(`${baseUrl}/login.html`);
  const text = await res.text();

  assert.equal(res.status, 200);
  assert.match(text, /Forgot password\?/);
});
