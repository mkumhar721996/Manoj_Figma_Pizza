const crypto = require('crypto');

class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  create(userId) {
    const id = crypto.randomUUID();
    this.sessions.set(id, { id, userId, createdAt: Date.now() });
    return id;
  }

  get(id) {
    if (!id) return null;
    return this.sessions.get(id) || null;
  }

  destroy(id) {
    return this.sessions.delete(id);
  }
}

module.exports = { SessionStore };
