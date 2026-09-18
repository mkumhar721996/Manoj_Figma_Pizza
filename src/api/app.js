const http = require('node:http');
const { handleDefectsRequest } = require('./defectsRouter');

function createApp(repo) {
  return http.createServer((req, res) => {
    handleDefectsRequest(req, res, repo).catch(() => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
  });
}

module.exports = { createApp };
