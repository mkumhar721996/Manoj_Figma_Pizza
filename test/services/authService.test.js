const { test } = require('node:test');
const assert = require('node:assert/strict');

const { createUserRepository } = require('../../src/services/userRepository');
const { createPasswordResetRepository } = require('../../src/services/passwordResetRepository');
const { createPasswordResetService } = require('../../src/services/passwordResetService');
const { createAuthService } = require('../../src/services/authService');
const { createTestResetRequest } = require('../helpers/createTestResetRequest');

test('AC8: logging in with the new password grants access', async () => {
  const userRepository = createUserRepository();
  const resetRepository = createPasswordResetRepository();
  const emailSender = { sendResetEmail: async () => {} };
  const smsSender = { sendOtpSms: async () => {} };
  const service = createPasswordResetService({
    userRepository,
    resetRepository,
    emailSender,
    smsSender,
    resetLinkBaseUrl: 'https://slicehouse.example/reset-link.html',
  });
  const authService = createAuthService({ userRepository });

  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: null });
  const { requestId } = createTestResetRequest(resetRepository, { userId: 'user-1' });
  await service.setNewPassword({ requestId, newPassword: 'SliceHouse2024', confirmPassword: 'SliceHouse2024' });

  const loginResult = await authService.login({ identifier: 'jordan.baker@example.com', password: 'SliceHouse2024' });

  assert.equal(loginResult.success, true);
});

test('AC8 (negative control): wrong password is rejected', async () => {
  const userRepository = createUserRepository();
  const authService = createAuthService({ userRepository });
  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: null });

  const loginResult = await authService.login({ identifier: 'jordan.baker@example.com', password: 'wrong-password' });

  assert.equal(loginResult.success, false);
});
