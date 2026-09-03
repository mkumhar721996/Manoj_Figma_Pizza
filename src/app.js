const http = require('http');
const { identifyUser, requireAdmin } = require('./middleware/auth');
const { listMenuItems } = require('./routes/menuItems');
const {
  listAdminMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuItem,
} = require('./routes/adminMenuItems');

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function createApp() {
  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const { method } = req;
    identifyUser(req);

    try {
      if (method === 'GET' && pathname === '/api/menu-items') {
        return sendJson(res, 200, listMenuItems());
      }

      if (pathname.startsWith('/api/admin/')) {
        if (!requireAdmin(req, res)) return;
      }

      if (pathname === '/api/admin/menu-items') {
        if (method === 'GET') {
          return sendJson(res, 200, listAdminMenuItems());
        }
        if (method === 'POST') {
          const body = await readJsonBody(req);
          return sendJson(res, 201, createMenuItem(body));
        }
      }

      const itemMatch = pathname.match(/^\/api\/admin\/menu-items\/([^/]+)$/);
      if (itemMatch && method === 'PUT') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, updateMenuItem(itemMatch[1], body));
      }

      const toggleMatch = pathname.match(/^\/api\/admin\/menu-items\/([^/]+)\/toggle$/);
      if (toggleMatch && method === 'PATCH') {
        return sendJson(res, 200, toggleMenuItem(toggleMatch[1]));
      }

      return sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message });
    }
  });
}

module.exports = { createApp };
