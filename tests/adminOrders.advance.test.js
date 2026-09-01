const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, ADMIN_TOKEN } = require('./helpers/testServer');

test('POST /admin/orders/:id/advance moves a non-final order to the next status', async () => {
  const server = await startServer({
    orders: [{ id: 'order-1', customerName: 'Alice', status: 'PLACED' }],
  });
  try {
    const response = await fetch(`${server.baseUrl}/admin/orders/order-1/advance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'PREPARING');
  } finally {
    await server.close();
  }
});
