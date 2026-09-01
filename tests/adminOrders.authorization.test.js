const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, ADMIN_TOKEN, CUSTOMER_TOKEN } = require('./helpers/testServer');

test('non-admin access to the order management list and advance action is denied', async () => {
  const server = await startServer({
    orders: [{ id: 'order-1', customerName: 'Alice', status: 'PLACED' }],
  });
  try {
    const noTokenResponse = await fetch(`${server.baseUrl}/admin/orders`);
    assert.equal(noTokenResponse.status, 401);

    const customerListResponse = await fetch(`${server.baseUrl}/admin/orders`, {
      headers: { Authorization: `Bearer ${CUSTOMER_TOKEN}` },
    });
    assert.equal(customerListResponse.status, 403);

    const customerAdvanceResponse = await fetch(`${server.baseUrl}/admin/orders/order-1/advance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CUSTOMER_TOKEN}` },
    });
    assert.equal(customerAdvanceResponse.status, 403);

    const adminCheckResponse = await fetch(`${server.baseUrl}/admin/orders`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const adminOrders = await adminCheckResponse.json();
    assert.equal(adminOrders.find((order) => order.id === 'order-1').status, 'PLACED');
  } finally {
    await server.close();
  }
});
