const http = require('http');
const { createApp } = require('./app');
const { createDefaultDeps } = require('./deps');

const app = createApp(createDefaultDeps());
const server = http.createServer(app);
const port = process.env.PORT || process.env.ARC_WEB_PORT || 3027;

server.listen(port, () => {
  console.log(`Slice House server listening on port ${port}`);
});

module.exports = server;
