const { verifyPassword } = require('../utils/passwordHasher');

function normalize(identifier) {
  return String(identifier).trim().toLowerCase();
}

function createAuthService({ userRepository }) {
  async function login({ identifier, password }) {
    const user = userRepository.findByIdentifier(normalize(identifier));
    if (!user || !user.passwordHash) return { success: false };

    const matches = await verifyPassword(password, user.passwordHash);
    if (!matches) return { success: false };

    return { success: true, userId: user.id };
  }

  return { login };
}

module.exports = { createAuthService };
