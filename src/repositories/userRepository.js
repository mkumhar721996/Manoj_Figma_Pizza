'use strict';

const STATUS_UNVERIFIED = 'unverified';
const STATUS_VERIFIED = 'verified';

function createUserRepository() {
  const usersByEmail = new Map();

  return {
    STATUS_UNVERIFIED,
    STATUS_VERIFIED,

    findByEmail(email) {
      return usersByEmail.get(email.toLowerCase()) || null;
    },

    create({ email, passwordHash, verificationToken }) {
      const user = {
        email: email.toLowerCase(),
        passwordHash,
        status: STATUS_UNVERIFIED,
        verificationToken,
      };
      usersByEmail.set(user.email, user);
      return user;
    },

    findByVerificationToken(token) {
      for (const user of usersByEmail.values()) {
        if (user.verificationToken === token) return user;
      }
      return null;
    },

    markVerified(user) {
      user.status = STATUS_VERIFIED;
      user.verificationToken = null;
      return user;
    },
  };
}

module.exports = { createUserRepository, STATUS_UNVERIFIED, STATUS_VERIFIED };
