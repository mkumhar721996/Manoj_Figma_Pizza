'use strict';

const http = require('node:http');
const { handleRequest } = require('./app');

const port = process.env.ARC_DEV_PORT || 8001;
const server = http.createServer(handleRequest);

server.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});

module.exports = { server };
