const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { createUserRepository } = require('../../src/services/userRepository');
const { createPasswordResetRepository } = require('../../src/services/passwordResetRepository');
const { createPasswordResetService } = require('../../src/services/passwordResetService');
const { createTestResetRequest } = require('../helpers/createTestResetRequest');

function buildService({ now } = {}) {
  const userRepository = createUserRepository();
  const resetRepository = createPasswordResetRepository();
  const emailSender = { sendResetEmail: async () => {} };
  const smsSender = { sendOtpSms: async () => {} };

  let sendResetEmailCalls = [];
  let sendOtpSmsCalls = [];
  emailSender.sendResetEmail = async (args) => { sendResetEmailCalls.push(args); };
  smsSender.sendOtpSms = async (args) => { sendOtpSmsCalls.push(args); };

  const service = createPasswordResetService({
    userRepository,
    resetRepository,
    emailSender,
    smsSender,
    resetLinkBaseUrl: 'https://slicehouse.example/reset-link.html',
    ...(now ? { now } : {}),
  });

  return { service, userRepository, resetRepository, emailSender, smsSender, sendResetEmailCalls, sendOtpSmsCalls };
}

test('AC2: valid identifier sends a password-reset email', async () => {
  const { service, userRepository, sendResetEmailCalls } = buildService();
  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: 'hash' });

  await service.requestPasswordReset({ identifier: 'jordan.baker@example.com' });

  assert.equal(sendResetEmailCalls.length, 1);
  assert.equal(sendResetEmailCalls[0].to, 'jordan.baker@example.com');
  assert.match(sendResetEmailCalls[0].resetLink, /\/reset-link\.html\?token=/);
});

test('AC3: valid identifier sends an OTP SMS', async () => {
  const { service, userRepository, sendOtpSmsCalls } = buildService();
  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: 'hash' });

  await service.requestPasswordReset({ identifier: 'jordan.baker@example.com' });

  assert.equal(sendOtpSmsCalls.length, 1);
  assert.match(sendOtpSmsCalls[0].otp, /^\d{6}$/);
});

test('AC4: clicking a valid reset link leads to the set-new-password screen', async () => {
  const { service, resetRepository } = buildService();
  const { requestId, token } = createTestResetRequest(resetRepository);

  const result = await service.verifyResetLink({ token });

  assert.deepEqual(result, { valid: true, requestId });
});

test('AC5: correct OTP leads to the set-new-password screen', async () => {
  const { service, resetRepository } = buildService();
  const { requestId } = createTestResetRequest(resetRepository, { otpCode: '482913' });

  const result = await service.verifyOtp({ requestId, otp: '482913' });

  assert.deepEqual(result, { valid: true });
});

test('AC6: incorrect OTP is rejected and does not allow proceeding', async () => {
  const { service, resetRepository } = buildService();
  const { requestId } = createTestResetRequest(resetRepository, { otpCode: '482913' });

  const result = await service.verifyOtp({ requestId, otp: '000000' });

  assert.equal(result.valid, false);
  assert.equal(result.reason, 'incorrect');
});

test('AC7: submitting a new password on a valid session updates the account password', async () => {
  const { service, resetRepository, userRepository } = buildService();
  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: null });
  const { requestId } = createTestResetRequest(resetRepository, { userId: 'user-1' });

  const result = await service.setNewPassword({ requestId, newPassword: 'SliceHouse2024', confirmPassword: 'SliceHouse2024' });

  assert.equal(result.success, true);
  const updatedUser = userRepository.findById('user-1');
  assert.notEqual(updatedUser.passwordHash, null);
});

test('AC9: Facebook-originated account can set a first app password that coexists with Facebook login', async () => {
  const { service, resetRepository, userRepository } = buildService();
  const fbUser = userRepository.create({ id: 'user-fb', email: 'morgan.lee@example.com', facebookId: 'fb-123', passwordHash: null });
  const { requestId } = createTestResetRequest(resetRepository, { userId: fbUser.id });

  await service.setNewPassword({ requestId, newPassword: 'SliceHouse2024', confirmPassword: 'SliceHouse2024' });

  const updatedUser = userRepository.findById(fbUser.id);
  assert.equal(updatedUser.facebookId, 'fb-123');
  assert.notEqual(updatedUser.passwordHash, null);
});

test('AC10: unregistered identifier gets the same generic success message and no email/SMS sent', async () => {
  const { service, userRepository, sendResetEmailCalls } = buildService();
  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: 'hash' });

  const registeredResult = await service.requestPasswordReset({ identifier: 'jordan.baker@example.com' });
  const unregisteredResult = await service.requestPasswordReset({ identifier: 'unknown@example.com' });

  assert.deepEqual(unregisteredResult, registeredResult);
  assert.equal(sendResetEmailCalls.length, 1);
});

test('AC11: a reset link older than 1 hour is rejected as expired', async () => {
  const { service, resetRepository } = buildService();
  const { token } = createTestResetRequest(resetRepository, { resetTokenExpiresAt: new Date(Date.now() - 1000) });

  const result = await service.verifyResetLink({ token });

  assert.deepEqual(result, { valid: false, reason: 'expired' });
});

test('AC12: an OTP older than 5 minutes is rejected as expired', async () => {
  const { service, resetRepository } = buildService();
  const { requestId } = createTestResetRequest(resetRepository, { otpCode: '482913', otpExpiresAt: new Date(Date.now() - 1000) });

  const result = await service.verifyOtp({ requestId, otp: '482913' });

  assert.deepEqual(result, { valid: false, reason: 'expired' });
});

test('AC13: 3 incorrect OTP attempts locks out further attempts on that request', async () => {
  const { service, resetRepository } = buildService();
  const { requestId } = createTestResetRequest(resetRepository, { otpCode: '482913' });

  await service.verifyOtp({ requestId, otp: '000000' });
  await service.verifyOtp({ requestId, otp: '111111' });
  await service.verifyOtp({ requestId, otp: '222222' });
  const lockedAttempt = await service.verifyOtp({ requestId, otp: '482913' });

  assert.deepEqual(lockedAttempt, { valid: false, reason: 'locked' });
});

test('AC14: a password that fails the policy is rejected and the account is not updated', async () => {
  const { service, resetRepository, userRepository } = buildService();
  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: 'original-hash' });
  const { requestId } = createTestResetRequest(resetRepository, { userId: 'user-1' });
  const before = userRepository.findById('user-1');

  const result = await service.setNewPassword({ requestId, newPassword: 'abc123', confirmPassword: 'abc123' });

  assert.deepEqual(result, { success: false, reason: 'policy_violation' });
  const after = userRepository.findById('user-1');
  assert.equal(after.passwordHash, before.passwordHash);
});

test('AC15: using one method invalidates the other outstanding method', async () => {
  const { service, resetRepository } = buildService();
  const { requestId, token, otpCode } = createTestResetRequest(resetRepository, { otpCode: '482913' });

  await service.verifyResetLink({ token });
  const otpResult = await service.verifyOtp({ requestId, otp: otpCode });

  assert.deepEqual(otpResult, { valid: false, reason: 'invalidated' });
});

test('AC16: a 6th reset request within an hour for the same identifier sends no new link/OTP', async () => {
  const { service, userRepository, sendResetEmailCalls, sendOtpSmsCalls } = buildService();
  userRepository.create({ id: 'user-1', email: 'sam.rivera@example.com', passwordHash: 'hash' });

  for (let i = 0; i < 5; i += 1) {
    await service.requestPasswordReset({ identifier: 'sam.rivera@example.com' });
  }
  sendResetEmailCalls.length = 0;
  sendOtpSmsCalls.length = 0;

  await service.requestPasswordReset({ identifier: 'sam.rivera@example.com' });

  assert.equal(sendResetEmailCalls.length, 0);
  assert.equal(sendOtpSmsCalls.length, 0);
});
