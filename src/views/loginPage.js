function loginPage({ error } = {}) {
  const errorHtml = error ? `<p class="error">${error}</p>` : '';
  return `<!DOCTYPE html>
<html>
<head><title>Admin Login</title></head>
<body>
  <h1>Admin Login</h1>
  ${errorHtml}
  <form method="POST" action="/admin/login">
    <label>Username <input type="text" name="username" /></label>
    <label>Password <input type="password" name="password" /></label>
    <button type="submit">Log in</button>
  </form>
</body>
</html>`;
}

module.exports = { loginPage };
