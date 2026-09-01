const { createApp } = require('../../src/app');
const orderStore = require('../../src/data/orderStore');
const userStore = require('../../src/data/userStore');

const ADMIN_TOKEN = 'admin-test-token';
const CUSTOMER_TOKEN = 'customer-test-token';

async function startServer({ orders = [] } = {}) {
  orderStore.reset(orders);
  userStore.reset([
    { id: 'admin-1', token: ADMIN_TOKEN, role: 'admin' },
    { id: 'customer-1', token: CUSTOMER_TOKEN, role: 'customer' },
  ]);

  const app = createApp();
  await new Promise((resolve) => app.listen(0, resolve));
  const { port } = app.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    close: () => new Promise((resolve) => app.close(resolve)),
  };
}

module.exports = { startServer, ADMIN_TOKEN, CUSTOMER_TOKEN };
