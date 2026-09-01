const { getCredentials } = require('../config/credentials');
const { createSession, destroySession } = require('../session');
const { parseUrlEncodedBody } = require('../utils/body');
const { loginPage } = require('../views/loginPage');
const { safeEqual } = require('../utils/safeEqual');

const SESSION_COOKIE = 'sid';

function sessionCookieHeader(sessionId) {
  return `${SESSION_COOKIE}=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/`;
}

function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

async function handleGetLogin(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(loginPage());
}

async function handlePostLogin(req, res) {
  const body = await parseUrlEncodedBody(req);
  const [username, password] = getCredentials();
  if (safeEqual(body.username, username) && safeEqual(body.password, password)) {
    const { id, data } = createSession();
    data.isAdmin = true;
    res.writeHead(302, { Location: '/admin', 'Set-Cookie': sessionCookieHeader(id) });
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(loginPage({ error: 'Invalid username or password' }));
}

function handlePostLogout(req, res, sessionId) {
  if (sessionId) destroySession(sessionId);
  res.writeHead(302, { Location: '/admin/login', 'Set-Cookie': clearSessionCookieHeader() });
  res.end();
}

module.exports = { handleGetLogin, handlePostLogin, handlePostLogout, SESSION_COOKIE };
