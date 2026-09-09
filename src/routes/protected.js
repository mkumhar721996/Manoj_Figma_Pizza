function handleDashboard(req, res, user) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<h1>Dashboard</h1><p>Welcome, ${user.email}</p>`);
}

function handleAccount(req, res, user) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<h1>Account</h1><p>${user.email}</p>`);
}

module.exports = { handleDashboard, handleAccount };
