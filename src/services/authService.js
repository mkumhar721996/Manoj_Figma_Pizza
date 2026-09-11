const { findUserByEmail } = require("../data/users");
const { hashPassword, verifyPassword } = require("./passwordHash");

// Fixed dummy hash so an unknown email still pays the scrypt cost, keeping
// response timing constant and preventing email enumeration via timing.
const DUMMY_HASH = hashPassword("dummy-password-for-constant-time-comparison");

// Returns the user on success, or null on any failure (unknown email or
// wrong password) so callers cannot distinguish which field was invalid.
function verifyCredentials(email, password) {
  const user = findUserByEmail(email);
  const passwordMatches = verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !passwordMatches) return null;
  return user;
}

module.exports = { verifyCredentials };
