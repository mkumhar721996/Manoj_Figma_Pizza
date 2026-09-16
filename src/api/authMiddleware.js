function attachUser(req) {
  const role = req.headers['x-user-role'];
  const id = req.headers['x-user-id'] || 'unknown';
  req.user = role ? { id, role } : undefined;
}

module.exports = { attachUser };
