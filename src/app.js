const http = require("http");
const { URL } = require("url");
const { parseBody } = require("./lib/parseBody");
const { requireAuth } = require("./middleware/requireAuth");
const { handleLoginPage, handleLoginSubmit } = require("./routes/auth");
const { handleDashboard, handleAccount } = require("./routes/protected");

function createApp() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const query = Object.fromEntries(url.searchParams);

    if (req.method === "GET" && url.pathname === "/login") {
      handleLoginPage(req, res, query);
      return;
    }

    if (req.method === "POST" && url.pathname === "/login") {
      let body;
      try {
        body = await parseBody(req);
      } catch (err) {
        res.writeHead(err.status || 400, { "Content-Type": "text/plain" });
        res.end("Bad Request");
        return;
      }
      handleLoginSubmit(req, res, body);
      return;
    }

    if (req.method === "GET" && url.pathname === "/dashboard") {
      const user = requireAuth(req, res, url.pathname);
      if (user) handleDashboard(req, res, user);
      return;
    }

    if (req.method === "GET" && url.pathname === "/account") {
      const user = requireAuth(req, res, url.pathname);
      if (user) handleAccount(req, res, user);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });
}

module.exports = { createApp };
