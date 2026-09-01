function requireAuth(req) {
  return Boolean(req.session && req.session.isAdmin === true);
}

module.exports = { requireAuth };
