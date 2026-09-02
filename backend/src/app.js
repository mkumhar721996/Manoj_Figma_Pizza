'use strict';

const { menuItems } = require('./menuItems');

/**
 * Plain Node http request handler for the menu API.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleRequest(req, res) {
  if (req.method === 'GET' && req.url === '/api/menu-items') {
    const activeItems = menuItems.filter((item) => item.active);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(activeItems));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

module.exports = { handleRequest };
