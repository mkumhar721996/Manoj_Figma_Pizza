'use strict';

const http = require('node:http');
const { createApp } = require('../../src/app');
const { createUserRepository } = require('../../src/repositories/userRepository');

function createFakeEmailSender() {
  const sentEmails = [];
  return {
    sentEmails,
    sendVerificationEmail(user, token) {
      sentEmails.push({ email: user.email, token });
      return Promise.resolve();
    },
  };
}

async function startTestServer() {
  const userRepository = createUserRepository();
  const emailSender = createFakeEmailSender();
  const app = createApp({ userRepository, emailSender });
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  return {
    userRepository,
    emailSender,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

module.exports = { startTestServer };
