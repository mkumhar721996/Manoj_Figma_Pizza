const TRUSTED_PROXY_SECRET_HEADER = 'x-gateway-secret';

// x-user-role/x-user-id are only trustworthy if a reverse proxy authenticates
// the caller and injects them itself, stripping any values the client sent.
// TRUSTED_PROXY_SECRET is the shared secret that proxy attaches to prove a
// request actually passed through it; without it configured, an attacker
// could set these headers directly and impersonate any role.
function attachUser(req) {
  const proxySecret = process.env.TRUSTED_PROXY_SECRET;
  if (proxySecret && req.headers[TRUSTED_PROXY_SECRET_HEADER] !== proxySecret) {
    req.user = null;
    return;
  }

  const role = req.headers['x-user-role'];
  const id = req.headers['x-user-id'] || 'anonymous';
  req.user = role ? { id, role } : null;
}

module.exports = { attachUser };
