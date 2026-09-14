const { parseCookies, serializeCookie } = require('../../lib/cookies');
const { SESSION_COOKIE_NAME, LOGIN_PATH } = require('../../middleware/auth');

function handleLogout(req, res, sessionStore) {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SESSION_COOKIE_NAME];
  if (sid) sessionStore.destroy(sid);

  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', { maxAge: 0 }));
  res.writeHead(302, { Location: LOGIN_PATH });
  res.end();
}

module.exports = { handleLogout };
