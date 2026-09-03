const crypto = require('crypto');

function extractBearerToken(req) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Admin identity is proven by possession of a server-configured secret token
// (ADMIN_API_TOKEN), never by a client-supplied role label such as `x-role`,
// which any caller could set to whatever value they like.
function identifyUser(req) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  const providedToken = extractBearerToken(req);
  const isAdmin = Boolean(adminToken) && Boolean(providedToken) && timingSafeEqual(providedToken, adminToken);
  req.user = { role: isAdmin ? 'admin' : 'customer' };
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
