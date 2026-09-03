'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { handleRequest } = require('../src/app');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(handleRequest);
    server.listen(0, () => resolve(server));
  });
}

function get(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    http
      .get({ host: '127.0.0.1', port, path }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        });
      })
      .on('error', reject);
  });
}

test('GET /api/menu-items returns only active items and omits inactive ones', async (t) => {
  const server = await startServer();
  t.after(() => server.close());

  const res = await get(server, '/api/menu-items');

  assert.equal(res.status, 200);

  const ids = res.body.map((item) => item.id);
  assert.ok(ids.includes('pizza-margherita'));
  assert.ok(ids.includes('side-garlic-bread'));
  assert.ok(ids.includes('drink-cola'));
  assert.ok(!ids.includes('pizza-discontinued'), 'inactive item must be omitted');
  assert.ok(res.body.every((item) => item.active !== false));
});
