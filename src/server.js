const http = require('http');
const { createApp } = require('./app');
const { SessionStore } = require('./session/sessionStore');

const sessionStore = new SessionStore();
const app = createApp(sessionStore);
const port = process.env.ARC_WEB_PORT || 3000;

if (require.main === module) {
  http.createServer(app).listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = { app, sessionStore };
