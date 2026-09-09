const { verifyCredentials } = require("../services/authService");
const { createSession, buildSessionCookie } = require("../session");

const DEFAULT_DESTINATION = "/dashboard";
const GENERIC_ERROR = "Invalid email or password.";

// Only allow redirecting to a same-origin absolute path to prevent open redirects.
function sanitizeDestination(destination) {
  if (typeof destination === "string" && destination.startsWith("/") && !destination.startsWith("//")) {
    return destination;
  }
  return DEFAULT_DESTINATION;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLoginPage(res, { status = 200, redirect = "", error = "" } = {}) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html>
<form method="POST" action="/login">
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
  <input type="hidden" name="redirect" value="${escapeHtml(sanitizeDestination(redirect))}" />
  <input type="email" name="email" />
  <input type="password" name="password" />
  <input type="checkbox" name="rememberMe" value="true" />
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
    renderLoginPage(res, { status: 401, redirect: redirect || "", error: GENERIC_ERROR });
    return;
  }

  const rememberMe = body.rememberMe === "true" || body.rememberMe === "on";
  const sessionId = createSession(user.id);
  const destination = sanitizeDestination(redirect);

  res.writeHead(302, {
    "Set-Cookie": buildSessionCookie(sessionId, { rememberMe }),
    Location: destination,
  });
  res.end();
}

module.exports = { handleLoginPage, handleLoginSubmit, GENERIC_ERROR, DEFAULT_DESTINATION };
