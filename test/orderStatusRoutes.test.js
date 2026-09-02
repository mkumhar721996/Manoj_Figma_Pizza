const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const { createOrderStore } = require('../src/orders/orderStore');

function startServer(orderStore) {
  const server = http.createServer(createApp(orderStore));
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function baseUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}

test('GET /api/orders/:orderNumber/status returns the order status (AC1)', async (t) => {
  const orderStore = createOrderStore();
  orderStore.createOrder('ORD-1', 'Placed');
  const server = await startServer(orderStore);
  t.after(() => server.close());

  const res = await fetch(`${baseUrl(server)}/api/orders/ORD-1/status`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(body, { orderNumber: 'ORD-1', status: 'Placed' });
});

test('status reflects an update made after creation (AC2)', async (t) => {
  const orderStore = createOrderStore();
  orderStore.createOrder('ORD-2', 'Placed');
  orderStore.updateOrderStatus('ORD-2', 'In Progress');
  const server = await startServer(orderStore);
  t.after(() => server.close());

  const res = await fetch(`${baseUrl(server)}/api/orders/ORD-2/status`);
  const body = await res.json();

  assert.equal(body.status, 'In Progress');
});

test('status route returns 200 with no auth header/cookie needed (AC3)', async (t) => {
  const orderStore = createOrderStore();
  orderStore.createOrder('ORD-3', 'Placed');
  const server = await startServer(orderStore);
  t.after(() => server.close());

  const res = await fetch(`${baseUrl(server)}/api/orders/ORD-3/status`);

  assert.equal(res.status, 200);
});

test('unknown order number returns 404, not an auth error (AC3)', async (t) => {
  const orderStore = createOrderStore();
  const server = await startServer(orderStore);
  t.after(() => server.close());

  const res = await fetch(`${baseUrl(server)}/api/orders/DOES-NOT-EXIST/status`);

  assert.equal(res.status, 404);
});

test('a Done order remains retrievable after status reaches Done (AC4)', async (t) => {
  const orderStore = createOrderStore();
  orderStore.createOrder('ORD-4', 'Placed');
  orderStore.updateOrderStatus('ORD-4', 'Done');
  const server = await startServer(orderStore);
  t.after(() => server.close());

  const res = await fetch(`${baseUrl(server)}/api/orders/ORD-4/status`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.status, 'Done');
});
