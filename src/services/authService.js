const { findUserByEmail } = require("../data/users");
const { verifyPassword } = require("./passwordHash");

// Returns the user on success, or null on any failure (unknown email or
// wrong password) so callers cannot distinguish which field was invalid.
function verifyCredentials(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

module.exports = { verifyCredentials };
