const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const { createApp } = require('../../src/app');
const { createUserRepository } = require('../../src/services/userRepository');
const { createPasswordResetRepository } = require('../../src/services/passwordResetRepository');
const { createPasswordResetService } = require('../../src/services/passwordResetService');
const { createAuthService } = require('../../src/services/authService');
const { createTestResetRequest } = require('../helpers/createTestResetRequest');

let server;
let baseUrl;
let deps;

before(async () => {
  const userRepository = createUserRepository();
  const resetRepository = createPasswordResetRepository();
  const emailSender = { sendResetEmail: async () => {} };
  const smsSender = { sendOtpSms: async () => {} };
  const passwordResetService = createPasswordResetService({
    userRepository,
    resetRepository,
    emailSender,
    smsSender,
    resetLinkBaseUrl: 'http://localhost/reset-link.html',
  });
  const authService = createAuthService({ userRepository });
  deps = { userRepository, resetRepository, passwordResetService, authService };

  const app = createApp(deps);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('verify-link response flags Facebook-originated accounts so the client can show the app-password copy', async () => {
  const fbUser = deps.userRepository.create({ id: 'user-fb', email: 'morgan.lee@example.com', facebookId: 'fb-123', passwordHash: null });
  const { token } = createTestResetRequest(deps.resetRepository, { userId: fbUser.id });

  const res = await fetch(`${baseUrl}/api/auth/reset/verify-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.valid, true);
  assert.equal(body.isFacebookAccount, true);
});

test('verify-link response does not flag a regular account as Facebook-originated', async () => {
  const user = deps.userRepository.create({ id: 'user-regular', email: 'jordan.baker@example.com', passwordHash: 'hash' });
  const { token } = createTestResetRequest(deps.resetRepository, { userId: user.id });

  const res = await fetch(`${baseUrl}/api/auth/reset/verify-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const body = await res.json();

  assert.equal(body.isFacebookAccount, false);
});
