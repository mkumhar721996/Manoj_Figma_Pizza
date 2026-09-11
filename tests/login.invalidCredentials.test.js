const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

const VALID_EMAIL = "verified.user@example.com";
const VALID_PASSWORD = "test-password";

async function startServer() {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  return { server, baseUrl: `http://localhost:${port}` };
}

function loginBody(email, password) {
  return new URLSearchParams({ email, password, redirect: "" }).toString();
}

test("AC5: wrong password and unknown email return the same status and identical generic error message", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const wrongPassword = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody(VALID_EMAIL, "wrong-password"),
  });
  const wrongPasswordText = await wrongPassword.text();

  const unknownEmail = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody("nobody@example.com", "test-password"),
  });
  const unknownEmailText = await unknownEmail.text();

  assert.equal(wrongPassword.status, unknownEmail.status);
  assert.match(wrongPasswordText, /Invalid email or password\./);
  assert.match(unknownEmailText, /Invalid email or password\./);
  assert.doesNotMatch(wrongPasswordText, /field/i);
});

test("AC6: incorrect credentials set no session cookie and do not grant access to a protected route", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody(VALID_EMAIL, "wrong-password"),
    redirect: "manual",
  });

  assert.equal(response.headers.getSetCookie().length, 0);

  const protectedAccess = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
  assert.equal(protectedAccess.status, 302);
  assert.equal(protectedAccess.headers.get("location"), "/login?redirect=%2Fdashboard");
});
