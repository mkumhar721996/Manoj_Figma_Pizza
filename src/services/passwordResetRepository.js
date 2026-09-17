function createPasswordResetRepository() {
  const byId = new Map();
  const idByToken = new Map();

  function create(request) {
    byId.set(request.id, request);
    idByToken.set(request.resetToken, request.id);
    return request;
  }

  function findByToken(token) {
    const id = idByToken.get(token);
    return id ? byId.get(id) : null;
  }

  function findById(id) {
    return byId.get(id) || null;
  }

  function update(id, patch) {
    const existing = byId.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    byId.set(id, updated);
    return updated;
  }

  function findLatestByIdentifier(identifierUsed) {
    let latest = null;
    for (const request of byId.values()) {
      if (request.identifierUsed === identifierUsed && (!latest || request.createdAt > latest.createdAt)) {
        latest = request;
      }
    }
    return latest;
  }

  function countRequestsSince(identifierUsed, sinceDate) {
    let count = 0;
    for (const request of byId.values()) {
      if (request.identifierUsed === identifierUsed && request.createdAt >= sinceDate) {
        count += 1;
      }
    }
    return count;
  }

  return { create, findByToken, findById, update, countRequestsSince, findLatestByIdentifier };
}

module.exports = { createPasswordResetRepository };
