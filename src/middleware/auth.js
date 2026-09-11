const { parseCookies } = require('../lib/cookies');

const SESSION_COOKIE_NAME = 'sid';
const LOGIN_PATH = '/login';

function getSessionFromRequest(req, sessionStore) {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SESSION_COOKIE_NAME];
  return sessionStore.get(sid);
}

function requireAuth(req, res, sessionStore) {
  const session = getSessionFromRequest(req, sessionStore);
  if (!session) {
    res.writeHead(302, { Location: LOGIN_PATH });
    res.end();
    return null;
  }
  return session;
}

module.exports = { SESSION_COOKIE_NAME, LOGIN_PATH, getSessionFromRequest, requireAuth };
