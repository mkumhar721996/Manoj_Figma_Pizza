const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { SESSION_COOKIE_NAME } = require("../src/session");

const VALID_EMAIL = "verified.user@example.com";
const VALID_PASSWORD = "test-password";

async function startServer() {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  return { server, baseUrl: `http://localhost:${port}` };
}

function loginBody({ rememberMe } = {}) {
  const params = { email: VALID_EMAIL, password: VALID_PASSWORD, redirect: "" };
  if (rememberMe !== undefined) params.rememberMe = rememberMe;
  return new URLSearchParams(params).toString();
}

function extractCookieValue(setCookieHeader) {
  return setCookieHeader.split(";")[0];
}

test("AC3: rememberMe=true issues a persistent cookie that authenticates a later request presenting only the cookie", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody({ rememberMe: "true" }),
    redirect: "manual",
  });

  const setCookie = response.headers.getSetCookie()[0];
  assert.match(setCookie, /Max-Age=\d+/);
  assert.match(setCookie, /Expires=/);
  assert.ok(setCookie.startsWith(`${SESSION_COOKIE_NAME}=`));

  // Simulate reopening the browser: a fresh request presenting only the persistent cookie.
  const afterRestart = await fetch(`${baseUrl}/dashboard`, {
    headers: { Cookie: extractCookieValue(setCookie) },
    redirect: "manual",
  });

  assert.equal(afterRestart.status, 200);
});

test("AC4: rememberMe omitted issues a browser-session cookie, and without it a later request is unauthenticated", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody(),
    redirect: "manual",
  });

  const setCookie = response.headers.getSetCookie()[0];
  assert.doesNotMatch(setCookie, /Max-Age=/);
  assert.doesNotMatch(setCookie, /Expires=/);

  // Simulate the browser clearing the session cookie on close: no cookie presented.
  const afterRestart = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });

  assert.equal(afterRestart.status, 302);
  assert.equal(afterRestart.headers.get("location"), "/login?redirect=%2Fdashboard");
});
