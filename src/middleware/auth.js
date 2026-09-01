const { findUserByToken } = require('../data/userStore');

function authenticate(req) {
  const header = req.headers['authorization'];
  const token = header && header.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  return token ? findUserByToken(token) : undefined;
}

function requireAdmin(user) {
  if (!user) {
    return { status: 401, body: { error: 'Authentication required' } };
  }
  if (user.role !== 'admin') {
    return { status: 403, body: { error: 'Admin access required' } };
  }
  return null;
}

module.exports = { authenticate, requireAdmin };
