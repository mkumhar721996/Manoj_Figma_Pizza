let counter = 0;

function createTestResetRequest(resetRepository, overrides = {}) {
  counter += 1;
  const id = overrides.id || `req-${counter}`;
  const resetToken = overrides.resetToken || `token-${counter}`;
  const otpCode = overrides.otpCode || '482913';
  const request = {
    id,
    userId: overrides.userId || 'user-1',
    identifierUsed: overrides.identifierUsed || 'jordan.baker@example.com',
    resetToken,
    resetTokenExpiresAt: overrides.resetTokenExpiresAt || new Date(Date.now() + 60 * 60 * 1000),
    otpCode,
    otpExpiresAt: overrides.otpExpiresAt || new Date(Date.now() + 5 * 60 * 1000),
    otpAttempts: overrides.otpAttempts || 0,
    otpLocked: overrides.otpLocked || false,
    linkInvalidated: overrides.linkInvalidated || false,
    otpInvalidated: overrides.otpInvalidated || false,
    createdAt: overrides.createdAt || new Date(),
  };
  resetRepository.create(request);
  return { requestId: id, token: resetToken, userId: request.userId, otpCode };
}

module.exports = { createTestResetRequest };
