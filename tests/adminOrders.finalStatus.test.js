const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, ADMIN_TOKEN } = require('./helpers/testServer');

test('final-status orders expose no advance action and reject advance attempts', async () => {
  const server = await startServer({
    orders: [
      { id: 'order-final', customerName: 'Alice', status: 'DELIVERED' },
      { id: 'order-open', customerName: 'Bob', status: 'PLACED' },
    ],
  });
  try {
    const listResponse = await fetch(`${server.baseUrl}/admin/orders`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const orders = await listResponse.json();
    const finalOrder = orders.find((order) => order.id === 'order-final');
    const openOrder = orders.find((order) => order.id === 'order-open');
    assert.equal(finalOrder.canAdvance, false);
    assert.equal(openOrder.canAdvance, true);

    const advanceResponse = await fetch(`${server.baseUrl}/admin/orders/order-final/advance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    assert.equal(advanceResponse.status, 409);

    const afterResponse = await fetch(`${server.baseUrl}/admin/orders`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const afterOrders = await afterResponse.json();
    const stillFinal = afterOrders.find((order) => order.id === 'order-final');
    assert.equal(stillFinal.status, 'DELIVERED');
  } finally {
    await server.close();
  }
});
