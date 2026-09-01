const http = require('http');
const { handleListOrders, handleAdvanceOrder } = require('./routes/adminOrders');

const ADVANCE_PATH = /^\/admin\/orders\/([^/]+)\/advance$/;

function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/admin/orders') {
      handleListOrders(req, res);
      return;
    }

    const advanceMatch = url.pathname.match(ADVANCE_PATH);
    if (req.method === 'POST' && advanceMatch) {
      handleAdvanceOrder(req, res, advanceMatch[1]);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}

module.exports = { createApp };
