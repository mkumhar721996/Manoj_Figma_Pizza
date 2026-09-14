const { handleLogout } = require('./routes/auth/logout');
const { handleDashboard } = require('./routes/protected/dashboard');

function handleLogin(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Login page');
}

function createApp(sessionStore) {
  return function requestHandler(req, res) {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/login') {
      return handleLogin(req, res);
    }
    if (req.method === 'GET' && url.pathname === '/dashboard') {
      return handleDashboard(req, res, sessionStore);
    }
    if (req.method === 'POST' && url.pathname === '/logout') {
      return handleLogout(req, res, sessionStore);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  };
}

module.exports = { createApp };
