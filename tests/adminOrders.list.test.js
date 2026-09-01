const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, ADMIN_TOKEN } = require('./helpers/testServer');

test('GET /admin/orders returns all orders in a single unified list', async () => {
  const seeded = [
    { id: 'order-1', customerName: 'Alice', status: 'PLACED' },
    { id: 'order-2', customerName: 'Bob', status: 'PREPARING' },
    { id: 'order-3', customerName: 'Carol', status: 'DELIVERED' },
  ];
  const server = await startServer({ orders: seeded });
  try {
    const response = await fetch(`${server.baseUrl}/admin/orders`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.length, seeded.length);
    const ids = body.map((order) => order.id).sort();
    assert.deepEqual(ids, seeded.map((order) => order.id).sort());
  } finally {
    await server.close();
  }
});
