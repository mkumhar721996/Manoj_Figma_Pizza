'use strict';

function createConsoleEmailSender() {
  return {
    sendVerificationEmail(user, token) {
      console.log(`Verification email sent to ${user.email} with token ${token}`);
      return Promise.resolve();
    },
  };
}

module.exports = { createConsoleEmailSender };
