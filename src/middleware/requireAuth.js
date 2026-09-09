const { parseCookies, getSession, SESSION_COOKIE_NAME } = require("../session");
const { findUserById } = require("../data/users");

// Checks the session cookie; on failure, redirects to /login, capturing the
// originally requested path as the post-login destination when the request
// is a GET (non-idempotent methods are never captured as redirect targets).
function requireAuth(req, res, pathname) {
  const cookies = parseCookies(req.headers.cookie);
  const session = getSession(cookies[SESSION_COOKIE_NAME]);
  const user = session && findUserById(session.userId);

  if (user) return user;

  const redirectTarget = req.method === "GET" ? `?redirect=${encodeURIComponent(pathname)}` : "";
  res.writeHead(302, { Location: `/login${redirectTarget}` });
  res.end();
  return null;
}

module.exports = { requireAuth };
