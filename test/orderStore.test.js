const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderStore } = require('../src/orders/orderStore');

test('createOrder stores an order retrievable by getOrder', () => {
  const store = createOrderStore();
  store.createOrder('ORD-1', 'Placed');

  const order = store.getOrder('ORD-1');

  assert.equal(order.orderNumber, 'ORD-1');
  assert.equal(order.status, 'Placed');
});

test('getOrder returns undefined for an unknown order number', () => {
  const store = createOrderStore();

  assert.equal(store.getOrder('DOES-NOT-EXIST'), undefined);
});

test('updateOrderStatus changes the status of an existing order', () => {
  const store = createOrderStore();
  store.createOrder('ORD-2', 'Placed');

  store.updateOrderStatus('ORD-2', 'In Progress');

  assert.equal(store.getOrder('ORD-2').status, 'In Progress');
});
