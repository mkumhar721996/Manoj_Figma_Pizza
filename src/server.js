const http = require('node:http');
const { createApp } = require('./api/app');
const { DefectRepository } = require('./domain/defectRepository');

const port = process.env.ARC_DEV_PORT || 8020;
const repo = new DefectRepository();
const app = createApp(repo);

const server = http.createServer((req, res) => {
  app(req, res).catch((err) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
