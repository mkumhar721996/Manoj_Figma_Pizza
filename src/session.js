const crypto = require("crypto");

const SESSION_COOKIE_NAME = "sid";
const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const sessions = new Map();

function createSession(userId) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { userId });
  return sessionId;
}

function getSession(sessionId) {
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      continue;
    }
  }
  return cookies;
}

function buildSessionCookie(sessionId, { rememberMe }) {
  const parts = [`${SESSION_COOKIE_NAME}=${sessionId}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (rememberMe) {
    parts.push(`Max-Age=${REMEMBER_ME_MAX_AGE_SECONDS}`);
    parts.push(`Expires=${new Date(Date.now() + REMEMBER_ME_MAX_AGE_SECONDS * 1000).toUTCString()}`);
  }
  return parts.join("; ");
}

module.exports = {
  SESSION_COOKIE_NAME,
  REMEMBER_ME_MAX_AGE_SECONDS,
  createSession,
  getSession,
  parseCookies,
  buildSessionCookie,
};
