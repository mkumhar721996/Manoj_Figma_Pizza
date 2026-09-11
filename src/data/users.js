const { hashPassword } = require("../services/passwordHash");

// Seed data for a from-scratch app: email verification is owned by another
// story, so `verified: true` is assumed as a precondition rather than enforced.
// Only seeded outside production, since there is no real user store yet.
const users = [];

if (process.env.NODE_ENV !== "production") {
  users.push({
    id: "user-1",
    email: "verified.user@example.com",
    passwordHash: hashPassword("test-password"),
    verified: true,
  });
}

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findUserById(id) {
  return users.find((user) => user.id === id) || null;
}

module.exports = { findUserByEmail, findUserById };
