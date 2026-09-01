const crypto = require('crypto');

const sessions = new Map();

function createSession() {
  const id = crypto.randomBytes(24).toString('hex');
  const data = {};
  sessions.set(id, data);
  return { id, data };
}

function getSession(id) {
  if (!id) return null;
  return sessions.get(id) || null;
}

function destroySession(id) {
  sessions.delete(id);
}

module.exports = { createSession, getSession, destroySession };
