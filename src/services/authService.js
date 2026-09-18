'use strict';

const crypto = require('node:crypto');
const { STATUS_UNVERIFIED, STATUS_VERIFIED } = require('../repositories/userRepository');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedKey] = passwordHash.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), Buffer.from(derivedKey, 'hex'));
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

const RESULT_CREATED = 'created';
const RESULT_EMAIL_TAKEN = 'email_taken';
const RESULT_VERIFICATION_RESENT = 'verification_resent';

const LOGIN_SUCCESS = 'login_success';
const LOGIN_UNVERIFIED = 'login_unverified';
const LOGIN_INVALID_CREDENTIALS = 'login_invalid_credentials';

function createAuthService({ userRepository, emailSender }) {
  return {
    async registerUser(email, password) {
      const existingUser = userRepository.findByEmail(email);

      if (existingUser && existingUser.status === STATUS_VERIFIED) {
        return { result: RESULT_EMAIL_TAKEN };
      }

      if (existingUser && existingUser.status === STATUS_UNVERIFIED) {
        await emailSender.sendVerificationEmail(existingUser, existingUser.verificationToken);
        return { result: RESULT_VERIFICATION_RESENT, user: existingUser };
      }

      const passwordHash = hashPassword(password);
      const verificationToken = generateVerificationToken();
      const user = userRepository.create({ email, passwordHash, verificationToken });
      await emailSender.sendVerificationEmail(user, verificationToken);
      return { result: RESULT_CREATED, user };
    },

    verifyEmail(token) {
      const user = userRepository.findByVerificationToken(token);
      if (!user) return null;
      return userRepository.markVerified(user);
    },

    login(email, password) {
      const user = userRepository.findByEmail(email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return { result: LOGIN_INVALID_CREDENTIALS };
      }

      if (user.status !== STATUS_VERIFIED) {
        return { result: LOGIN_UNVERIFIED };
      }

      return { result: LOGIN_SUCCESS, user };
    },
  };
}

module.exports = {
  createAuthService,
  RESULT_CREATED,
  RESULT_EMAIL_TAKEN,
  RESULT_VERIFICATION_RESENT,
  LOGIN_SUCCESS,
  LOGIN_UNVERIFIED,
  LOGIN_INVALID_CREDENTIALS,
};
