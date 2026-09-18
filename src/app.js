'use strict';

const { validateSignupInput } = require('./validation/signupValidator');
const {
  createAuthService,
  RESULT_CREATED,
  RESULT_EMAIL_TAKEN,
  RESULT_VERIFICATION_RESENT,
  LOGIN_UNVERIFIED,
  LOGIN_INVALID_CREDENTIALS,
} = require('./services/authService');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(payload);
}

function createApp({ userRepository, emailSender }) {
  const authService = createAuthService({ userRepository, emailSender });

  return async function requestListener(req, res) {
    const url = new URL(req.url, 'http://localhost');

    try {
      if (req.method === 'POST' && url.pathname === '/api/signup') {
        const body = await readJsonBody(req);
        const errors = validateSignupInput(body);
        if (errors.length > 0) {
          return sendJson(res, 400, { errors });
        }

        const { result } = await authService.registerUser(body.email, body.password);

        if (result === RESULT_CREATED) {
          return sendJson(res, 201, {
            message: 'Account created. Please check your inbox to verify your email.',
          });
        }

        if (result === RESULT_EMAIL_TAKEN) {
          return sendJson(res, 409, {
            message: 'That email is already registered. Please log in or recover your password.',
          });
        }

        if (result === RESULT_VERIFICATION_RESENT) {
          return sendJson(res, 200, {
            message: 'Please check your inbox to verify your email.',
          });
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/login') {
        const body = await readJsonBody(req);
        const { result } = authService.login(body.email, body.password);

        if (result === LOGIN_UNVERIFIED) {
          return sendJson(res, 403, {
            message: 'Please check your inbox for the verification link before logging in.',
          });
        }

        if (result === LOGIN_INVALID_CREDENTIALS) {
          return sendJson(res, 401, { message: 'Invalid email or password.' });
        }

        return sendJson(res, 200, { message: 'Access granted.' });
      }

      const verifyMatch = url.pathname.match(/^\/api\/verify-email\/(.+)$/);
      if (req.method === 'GET' && verifyMatch) {
        const token = decodeURIComponent(verifyMatch[1]);
        const user = authService.verifyEmail(token);

        if (!user) {
          return sendJson(res, 400, { message: 'Invalid or expired verification link.' });
        }

        return sendJson(res, 200, { message: 'Email verified. Access granted.' });
      }

      return sendJson(res, 404, { message: 'Not found.' });
    } catch (err) {
      return sendJson(res, 400, { message: 'Invalid request.' });
    }
  };
}

module.exports = { createApp };
