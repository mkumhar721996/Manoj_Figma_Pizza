function attachUser(req) {
  const role = req.headers['x-user-role'];
  const id = req.headers['x-user-id'] || 'anonymous';
  req.user = role ? { id, role } : null;
}

module.exports = { attachUser };
