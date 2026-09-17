const crypto = require('crypto');

function normalize(identifier) {
  return String(identifier).trim().toLowerCase();
}

function createUserRepository() {
  const usersById = new Map();
  const idByIdentifier = new Map();

  function create(user) {
    const id = user.id || crypto.randomUUID();
    const record = {
      id,
      email: user.email || null,
      mobile: user.mobile || null,
      passwordHash: user.passwordHash || null,
      facebookId: user.facebookId || null,
    };
    usersById.set(id, record);
    if (record.email) idByIdentifier.set(normalize(record.email), id);
    if (record.mobile) idByIdentifier.set(normalize(record.mobile), id);
    return record;
  }

  function findById(id) {
    return usersById.get(id) || null;
  }

  function findByIdentifier(identifier) {
    const id = idByIdentifier.get(normalize(identifier));
    return id ? usersById.get(id) : null;
  }

  function update(id, patch) {
    const existing = usersById.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    usersById.set(id, updated);
    return updated;
  }

  return { create, findById, findByIdentifier, update };
}

module.exports = { createUserRepository };
