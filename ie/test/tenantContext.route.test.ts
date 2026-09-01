import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";
import { TenantRegistry } from "../src/tenants/registry.ts";
import { verifyContext } from "../src/tenants/tenantContext.ts";

function startTestApp() {
  const registry = new TenantRegistry([
    { tenantId: "tenant-a", apiKey: "key-a", agentIds: ["agent-1", "agent-2"] },
  ]);
  const app = createApp(registry);
  app.server.listen(0);
  const { port } = app.server.address() as AddressInfo;
  return { app, baseUrl: `http://127.0.0.1:${port}` };
}

test("AC1: valid tenant credentials return a tenant context scoped to that tenant's agents", async () => {
  const { app, baseUrl } = startTestApp();
  try {
    const response = await fetch(`${baseUrl}/tenant-context`, {
      method: "POST",
      headers: { Authorization: "Bearer key-a" },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.tenantId, "tenant-a");
    assert.deepEqual(body.agentIds, ["agent-1", "agent-2"]);
    assert.equal(typeof body.context, "string");

    const claims = verifyContext(body.context);
    assert.deepEqual(claims, { tenantId: "tenant-a", agentIds: ["agent-1", "agent-2"] });
  } finally {
    app.server.close();
  }
});

test("AC2: missing credentials are rejected with no tenant context", async () => {
  const { app, baseUrl } = startTestApp();
  try {
    const response = await fetch(`${baseUrl}/tenant-context`, { method: "POST" });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.context, undefined);
    assert.equal(body.tenantId, undefined);
    assert.equal(body.agentIds, undefined);
  } finally {
    app.server.close();
  }
});

test("AC2: invalid credentials are rejected with no tenant context", async () => {
  const { app, baseUrl } = startTestApp();
  try {
    const response = await fetch(`${baseUrl}/tenant-context`, {
      method: "POST",
      headers: { Authorization: "Bearer not-a-real-key" },
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.context, undefined);
    assert.equal(body.tenantId, undefined);
    assert.equal(body.agentIds, undefined);
  } finally {
    app.server.close();
  }
});
