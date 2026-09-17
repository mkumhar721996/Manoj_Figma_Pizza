const crypto = require('crypto');
const { meetsPolicy } = require('../utils/passwordPolicy');
const { generateResetToken, generateOtp } = require('../utils/tokens');
const { hashPassword } = require('../utils/passwordHasher');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;
const MAX_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const GENERIC_MESSAGE =
  'If that email or mobile number matches a registered account, we have sent a password reset link to the email on file and a one-time code by SMS.';

function normalize(identifier) {
  return String(identifier).trim().toLowerCase();
}

function createPasswordResetService({
  userRepository,
  resetRepository,
  emailSender,
  smsSender,
  resetLinkBaseUrl,
  now = () => new Date(),
}) {
  async function requestPasswordReset({ identifier }) {
    const normalized = normalize(identifier);
    const user = userRepository.findByIdentifier(normalized);

    if (user) {
      const currentTime = now();
      const since = new Date(currentTime.getTime() - RATE_LIMIT_WINDOW_MS);
      const recentCount = resetRepository.countRequestsSince(normalized, since);

      if (recentCount < MAX_REQUESTS_PER_HOUR) {
        const resetToken = generateResetToken();
        const otpCode = generateOtp();
        const request = {
          id: crypto.randomUUID(),
          userId: user.id,
          identifierUsed: normalized,
          resetToken,
          resetTokenExpiresAt: new Date(currentTime.getTime() + RESET_TOKEN_TTL_MS),
          otpCode,
          otpExpiresAt: new Date(currentTime.getTime() + OTP_TTL_MS),
          otpAttempts: 0,
          otpLocked: false,
          linkInvalidated: false,
          otpInvalidated: false,
          createdAt: currentTime,
        };
        resetRepository.create(request);
        await emailSender.sendResetEmail({
          to: user.email || normalized,
          resetLink: `${resetLinkBaseUrl}?token=${resetToken}`,
        });
        await smsSender.sendOtpSms({ to: user.mobile || normalized, otp: otpCode });
      }
    }

    return { message: GENERIC_MESSAGE };
  }

  async function verifyResetLink({ token }) {
    const request = resetRepository.findByToken(token);
    if (!request) return { valid: false, reason: 'invalid' };
    if (request.linkInvalidated) return { valid: false, reason: 'invalidated' };
    if (now() > request.resetTokenExpiresAt) return { valid: false, reason: 'expired' };

    resetRepository.update(request.id, { otpInvalidated: true });
    return { valid: true, requestId: request.id };
  }

  async function verifyOtp({ requestId, otp }) {
    const request = resetRepository.findById(requestId);
    if (!request) return { valid: false, reason: 'invalid' };
    if (request.otpInvalidated) return { valid: false, reason: 'invalidated' };
    if (request.otpLocked) return { valid: false, reason: 'locked' };
    if (now() > request.otpExpiresAt) return { valid: false, reason: 'expired' };

    if (otp === request.otpCode) {
      resetRepository.update(request.id, { linkInvalidated: true });
      return { valid: true };
    }

    const attempts = request.otpAttempts + 1;
    const locked = attempts >= MAX_OTP_ATTEMPTS;
    resetRepository.update(request.id, { otpAttempts: attempts, otpLocked: locked });
    if (locked) return { valid: false, reason: 'locked' };
    return { valid: false, reason: 'incorrect', attemptsRemaining: MAX_OTP_ATTEMPTS - attempts };
  }

  async function verifyOtpForIdentifier({ identifier, otp }) {
    const request = resetRepository.findLatestByIdentifier(normalize(identifier));
    if (!request) return { valid: false, reason: 'incorrect' };
    const result = await verifyOtp({ requestId: request.id, otp });
    return result.valid ? { ...result, requestId: request.id } : result;
  }

  async function setNewPassword({ requestId, newPassword, confirmPassword }) {
    const request = resetRepository.findById(requestId);
    if (!request) return { success: false, reason: 'invalid_request' };
    if (newPassword !== confirmPassword) return { success: false, reason: 'password_mismatch' };
    if (!meetsPolicy(newPassword)) return { success: false, reason: 'policy_violation' };

    const passwordHash = await hashPassword(newPassword);
    userRepository.update(request.userId, { passwordHash });
    resetRepository.update(request.id, { linkInvalidated: true, otpInvalidated: true });
    return { success: true };
  }

  return { requestPasswordReset, verifyResetLink, verifyOtp, verifyOtpForIdentifier, setNewPassword };
}

module.exports = { createPasswordResetService, GENERIC_MESSAGE };
