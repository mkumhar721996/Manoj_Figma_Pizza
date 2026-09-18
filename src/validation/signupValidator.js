'use strict';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_PATTERN = /(?=.*[A-Za-z])(?=.*\d)/;

function validateSignupInput({ email, password }) {
  const errors = [];

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  }

  if (
    !password ||
    password.length < MIN_PASSWORD_LENGTH ||
    !PASSWORD_PATTERN.test(password)
  ) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include a letter and a number.`,
    });
  }

  return errors;
}

module.exports = { validateSignupInput };
