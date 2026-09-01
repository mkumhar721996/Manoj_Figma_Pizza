const http = require('http');
const { loadEnv } = require('./config/loadEnv');

loadEnv();

const { createApp } = require('./app');

const port = process.env.ARC_DEV_PORT || 8005;
const server = http.createServer(createApp());

server.listen(port, () => {
  console.log(`Admin server listening on port ${port}`);
});

module.exports = server;
