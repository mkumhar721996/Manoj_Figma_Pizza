const { test } = require('node:test');
const assert = require('node:assert/strict');

const { createUserRepository } = require('../../src/services/userRepository');
const { createPasswordResetRepository } = require('../../src/services/passwordResetRepository');
const { createPasswordResetService } = require('../../src/services/passwordResetService');

function buildService() {
  const userRepository = createUserRepository();
  const resetRepository = createPasswordResetRepository();
  const emailSender = { sendResetEmail: async () => {} };
  const otpCalls = [];
  const smsSender = { sendOtpSms: async (args) => { otpCalls.push(args); } };
  const service = createPasswordResetService({
    userRepository,
    resetRepository,
    emailSender,
    smsSender,
    resetLinkBaseUrl: 'https://slicehouse.example/reset-link.html',
  });
  return { service, userRepository, resetRepository, otpCalls };
}

test('verifyOtpForIdentifier resolves the correct pending request for a registered identifier', async () => {
  const { service, userRepository, otpCalls } = buildService();
  userRepository.create({ id: 'user-1', email: 'jordan.baker@example.com', passwordHash: 'hash' });

  await service.requestPasswordReset({ identifier: 'jordan.baker@example.com' });
  const otpSent = otpCalls[0].otp;

  const result = await service.verifyOtpForIdentifier({ identifier: 'jordan.baker@example.com', otp: otpSent });
  assert.equal(result.valid, true);
  assert.ok(result.requestId);
});

test('verifyOtpForIdentifier rejects an identifier with no pending request without leaking existence', async () => {
  const { service } = buildService();

  const result = await service.verifyOtpForIdentifier({ identifier: 'nobody@example.com', otp: '123456' });

  assert.equal(result.valid, false);
  assert.equal(result.requestId, undefined);
});
