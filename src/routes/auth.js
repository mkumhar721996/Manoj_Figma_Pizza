const { verifyCredentials } = require("../services/authService");
const { createSession, buildSessionCookie } = require("../session");
const { escapeHtml } = require("../lib/html");
const logger = require("../lib/logger");

const DEFAULT_DESTINATION = "/dashboard";
const GENERIC_ERROR = "Invalid email or password.";

// Only allow redirecting to a same-origin absolute path to prevent open
// redirects (blocks `//` and `/\`, both of which browsers can normalize to a
// protocol-relative URL) and header injection via embedded CR/LF characters.
function sanitizeDestination(destination) {
  if (
    typeof destination === "string" &&
    destination.startsWith("/") &&
    !destination.startsWith("//") &&
    !destination.startsWith("/\\") &&
    !/[\r\n]/.test(destination)
  ) {
    return destination;
  }
  return DEFAULT_DESTINATION;
}

function renderLoginPage(res, { status = 200, redirect = "", error = "" } = {}) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html>
<form method="POST" action="/login">
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
  <input type="hidden" name="redirect" value="${escapeHtml(sanitizeDestination(redirect))}" />
  <label for="email">Email</label>
  <input type="email" id="email" name="email" />
  <label for="password">Password</label>
  <input type="password" id="password" name="password" />
  <input type="checkbox" id="rememberMe" name="rememberMe" value="true" />
  <label for="rememberMe">Remember me</label>
  <button type="submit">Log in</button>
</form>`);
}

function handleLoginPage(req, res, query) {
  renderLoginPage(res, { redirect: query.redirect || "" });
}

function handleLoginSubmit(req, res, body) {
  const { email, password, redirect } = body;
  const user = verifyCredentials(email, password);

  if (!user) {
    logger.warn("login_failed", { email });
    renderLoginPage(res, { status: 401, redirect: redirect || "", error: GENERIC_ERROR });
    return;
  }

  const rememberMe = body.rememberMe === "true" || body.rememberMe === "on";
  const sessionId = createSession(user.id);
  const destination = sanitizeDestination(redirect);

  logger.info("user_authenticated", { userId: user.id, rememberMe });

  res.writeHead(302, {
    "Set-Cookie": buildSessionCookie(sessionId, { rememberMe }),
    Location: destination,
  });
  res.end();
}

module.exports = { handleLoginPage, handleLoginSubmit, GENERIC_ERROR, DEFAULT_DESTINATION };
