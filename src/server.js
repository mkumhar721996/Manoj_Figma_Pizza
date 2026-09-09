'use strict';

const http = require('node:http');
const { createApp } = require('./app');
const { createUserRepository } = require('./repositories/userRepository');
const { createConsoleEmailSender } = require('./services/emailService');

const port = process.env.ARC_DEV_PORT || 3000;

const app = createApp({
  userRepository: createUserRepository(),
  emailSender: createConsoleEmailSender(),
});

http.createServer(app).listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
