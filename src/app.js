const fs = require('fs');
const path = require('path');
const url = require('url');
const { handleGetOrderStatus } = require('./orders/orderStatusRoutes');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

const PAGE_ALIASES = {
  '/order-status': '/order-status.html',
  '/confirmation': '/confirmation.html',
};

function createApp(orderStore) {
  return function requestListener(req, res) {
    const pathname = decodeURIComponent(url.parse(req.url).pathname);

    const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (req.method === 'GET' && statusMatch) {
      handleGetOrderStatus(orderStore, statusMatch[1], res);
      return;
    }

    if (req.method === 'GET') {
      serveStatic(pathname, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  };
}

function serveStatic(pathname, res) {
  const filePath = PAGE_ALIASES[pathname] || (pathname === '/' ? '/index.html' : pathname);
  const resolved = path.join(PUBLIC_DIR, filePath);

  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    const ext = path.extname(resolved);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

module.exports = { createApp };
