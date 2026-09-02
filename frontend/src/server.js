import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const webPort = process.env.ARC_WEB_PORT || 3001;
const backendPort = process.env.ARC_DEV_PORT || 8001;

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

function proxyToBackend(req, res) {
  const proxyReq = http.request(
    { host: '127.0.0.1', port: backendPort, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend unavailable' }));
  });
  req.pipe(proxyReq);
}

function serveStaticFile(req, res) {
  const requestedPath = req.url === '/' ? '/index.html' : req.url;
  const resolvedPath = path.join(publicDir, path.normalize(requestedPath));

  if (!resolvedPath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const contentType = CONTENT_TYPES[path.extname(resolvedPath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxyToBackend(req, res);
    return;
  }
  serveStaticFile(req, res);
});

server.listen(webPort, () => {
  console.log(`Frontend listening on port ${webPort}`);
});
