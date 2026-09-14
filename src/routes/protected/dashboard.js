const { requireAuth } = require('../../middleware/auth');
const { setNoCache } = require('../../middleware/noCache');

function handleDashboard(req, res, sessionStore) {
  const session = requireAuth(req, res, sessionStore);
  if (!session) return;

  setNoCache(res);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Protected dashboard content');
}

module.exports = { handleDashboard };
