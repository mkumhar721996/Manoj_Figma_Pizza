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

function loginBody({ email = VALID_EMAIL, password = VALID_PASSWORD, redirect = "" } = {}) {
  return new URLSearchParams({ email, password, redirect }).toString();
}

test("AC1: correct credentials with no prior stored destination redirect to the default dashboard", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody(),
    redirect: "manual",
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/dashboard");
});

test("AC2: unauthenticated access to a protected page then login redirects back to that page", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const blocked = await fetch(`${baseUrl}/account`, { redirect: "manual" });
  assert.equal(blocked.status, 302);
  assert.equal(blocked.headers.get("location"), "/login?redirect=%2Faccount");

  const loginPage = await fetch(`${baseUrl}/login?redirect=%2Faccount`);
  const html = await loginPage.text();
  assert.match(html, /name="redirect" value="\/account"/);

  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody({ redirect: "/account" }),
    redirect: "manual",
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/account");
});
