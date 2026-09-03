function identifyUser(req) {
  const role = req.headers['x-role'] === 'admin' ? 'admin' : 'customer';
  req.user = { role };
}

function requireAdmin(req, res) {
  if (req.user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden: admin privileges required' }));
    return false;
  }
  return true;
}

module.exports = { identifyUser, requireAdmin };
