const { URL } = require('url');
const { parseCookies } = require('./utils/cookies');
const { getSession } = require('./session');
const { requireAuth } = require('./middleware/requireAuth');
const { handleAdminRoute } = require('./routes/admin');
const {
  handleGetLogin,
  handlePostLogin,
  handlePostLogout,
  SESSION_COOKIE,
} = require('./routes/auth');

function createApp() {
  return async function handleRequest(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    const method = req.method;

    const cookies = parseCookies(req.headers.cookie);
    req.session = getSession(cookies[SESSION_COOKIE]);

    try {
      if (pathname === '/admin/login' && method === 'GET') {
        return await handleGetLogin(req, res);
      }
      if (pathname === '/admin/login' && method === 'POST') {
        return await handlePostLogin(req, res);
      }
      if (pathname === '/admin/logout' && method === 'POST') {
        return handlePostLogout(req, res, cookies[SESSION_COOKIE]);
      }
      if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        if (!requireAuth(req)) {
          res.writeHead(302, { Location: '/admin/login' });
          return res.end();
        }
        const handled = handleAdminRoute(req, res, pathname, method);
        if (!handled) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  };
}

module.exports = { createApp };
