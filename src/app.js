const fs = require('fs');
const path = require('path');
const { handleApiRequest } = require('./routes/authRoutes');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DESIGN_SYSTEM_DIR = path.join(__dirname, '..', 'design-system');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function resolveStaticPath(requestPath) {
  if (requestPath === '/') return { root: PUBLIC_DIR, relativePath: '/login.html' };
  if (requestPath.startsWith('/design-system/')) {
    return { root: DESIGN_SYSTEM_DIR, relativePath: requestPath.slice('/design-system'.length) };
  }
  return { root: PUBLIC_DIR, relativePath: requestPath };
}

function serveStatic(req, res) {
  const requestPath = req.url.split('?')[0];
  const { root, relativePath } = resolveStaticPath(requestPath);
  const resolved = path.join(root, relativePath);

  if (!resolved.startsWith(root)) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(resolved);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function createApp(deps) {
  return function requestListener(req, res) {
    if (req.url.startsWith('/api/')) {
      handleApiRequest(req, res, deps).catch((err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal_error' }));
      });
      return;
    }
    serveStatic(req, res);
  };
}

module.exports = { createApp };
