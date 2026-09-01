const http = require('http');
const { createApp } = require('./app');
const { createOrderStore } = require('./orders/orderStore');

const orderStore = createOrderStore();
const app = createApp(orderStore);
const port = process.env.ARC_DEV_PORT || 8004;

http.createServer(app).listen(port, () => {
  console.log(`Order status server listening on port ${port}`);
});
