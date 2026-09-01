const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, ADMIN_TOKEN } = require('./helpers/testServer');

test('GET /admin/orders reflects a status just advanced', async () => {
  const server = await startServer({
    orders: [{ id: 'order-1', customerName: 'Alice', status: 'PLACED' }],
  });
  try {
    await fetch(`${server.baseUrl}/admin/orders/order-1/advance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    const response = await fetch(`${server.baseUrl}/admin/orders`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await response.json();
    const order = body.find((candidate) => candidate.id === 'order-1');
    assert.equal(order.status, 'PREPARING');
  } finally {
    await server.close();
  }
});
