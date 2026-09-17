const { createUserRepository } = require('./services/userRepository');
const { createPasswordResetRepository } = require('./services/passwordResetRepository');
const { createPasswordResetService } = require('./services/passwordResetService');
const { createAuthService } = require('./services/authService');
const { sendResetEmail } = require('./services/notifiers/emailSender');
const { sendOtpSms } = require('./services/notifiers/smsSender');

function createDefaultDeps() {
  const userRepository = createUserRepository();
  const resetRepository = createPasswordResetRepository();
  const emailSender = { sendResetEmail };
  const smsSender = { sendOtpSms };

  const passwordResetService = createPasswordResetService({
    userRepository,
    resetRepository,
    emailSender,
    smsSender,
    resetLinkBaseUrl: process.env.RESET_LINK_BASE_URL || 'http://localhost:3027/reset-link.html',
  });
  const authService = createAuthService({ userRepository });

  return { userRepository, resetRepository, passwordResetService, authService };
}

module.exports = { createDefaultDeps };
