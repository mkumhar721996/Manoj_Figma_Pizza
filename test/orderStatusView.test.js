const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const { createOrderStore } = require('../src/orders/orderStore');
const {
  renderStatus,
  renderError,
  lookupAndRender,
} = require('../public/order-status.js');

function startServer(orderStore) {
  const server = http.createServer(createApp(orderStore));
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function baseUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}

function fakeElement() {
  return { textContent: '' };
}

test('renderStatus displays the order number and status text (AC1)', () => {
  const el = fakeElement();

  renderStatus(el, { orderNumber: 'ORD-1', status: 'Placed' });

  assert.equal(el.textContent, 'Order ORD-1: Placed');
});

test('renderError displays a not-found message', () => {
  const el = fakeElement();

  renderError(el, 'Order not found. Please check your order number.');

  assert.equal(el.textContent, 'Order not found. Please check your order number.');
});

test('lookupAndRender fetches the current status from the confirmation page and displays it (AC1)', async (t) => {
  const orderStore = createOrderStore();
  orderStore.createOrder('ORD-1', 'Placed');
  const server = await startServer(orderStore);
  t.after(() => server.close());
  const originalFetch = global.fetch;
  global.fetch = (path) => originalFetch(`${baseUrl(server)}${path}`);
  t.after(() => {
    global.fetch = originalFetch;
  });
  const el = fakeElement();

  await lookupAndRender('ORD-1', el);

  assert.equal(el.textContent, 'Order ORD-1: Placed');
});

test('lookupAndRender reflects a status update on a subsequent call, simulating a page refresh (AC2)', async (t) => {
  const orderStore = createOrderStore();
  orderStore.createOrder('ORD-2', 'Placed');
  const server = await startServer(orderStore);
  t.after(() => server.close());
  const originalFetch = global.fetch;
  global.fetch = (path) => originalFetch(`${baseUrl(server)}${path}`);
  t.after(() => {
    global.fetch = originalFetch;
  });
  const el = fakeElement();

  await lookupAndRender('ORD-2', el);
  assert.equal(el.textContent, 'Order ORD-2: Placed');

  orderStore.updateOrderStatus('ORD-2', 'In Progress');
  await lookupAndRender('ORD-2', el);

  assert.equal(el.textContent, 'Order ORD-2: In Progress');
});

test('lookupAndRender renders a not-found message for an unknown order number', async (t) => {
  const orderStore = createOrderStore();
  const server = await startServer(orderStore);
  t.after(() => server.close());
  const originalFetch = global.fetch;
  global.fetch = (path) => originalFetch(`${baseUrl(server)}${path}`);
  t.after(() => {
    global.fetch = originalFetch;
  });
  const el = fakeElement();

  await lookupAndRender('DOES-NOT-EXIST', el);

  assert.equal(el.textContent, 'Order not found. Please check your order number.');
});
