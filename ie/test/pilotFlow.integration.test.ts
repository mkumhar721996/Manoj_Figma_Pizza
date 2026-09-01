import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp, routesMissingTenantScoping } from "../src/app.ts";
import { TenantRegistry } from "../src/tenants/registry.ts";

function startPilotApp() {
  const registry = new TenantRegistry([
    { tenantId: "tenant-pilot", apiKey: "key-pilot", agentIds: ["agent-review"] },
  ]);
  const app = createApp(registry);
  app.server.listen(0);
  const { port } = app.server.address() as AddressInfo;
  return { app, baseUrl: `http://127.0.0.1:${port}` };
}

test("AC5: Composer authenticates and obtains a tenant context for the pilot tenant", async () => {
  const { app, baseUrl } = startPilotApp();
  try {
    const response = await fetch(`${baseUrl}/tenant-context`, {
      method: "POST",
      headers: { Authorization: "Bearer key-pilot" },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.tenantId, "tenant-pilot");
    assert.deepEqual(body.agentIds, ["agent-review"]);
    assert.equal(typeof body.context, "string");
  } finally {
    app.server.close();
  }
});

test("AC6: routing on the pilot context only invokes tenant-scoped routes, never a bypass endpoint", async () => {
  const { app, baseUrl } = startPilotApp();
  try {
    const contextResponse = await fetch(`${baseUrl}/tenant-context`, {
      method: "POST",
      headers: { Authorization: "Bearer key-pilot" },
    });
    const { context } = await contextResponse.json();

    const invokeResponse = await fetch(`${baseUrl}/agents/agent-review/invoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${context}` },
    });
    const invokeBody = await invokeResponse.json();

    assert.equal(invokeResponse.status, 200);
    assert.deepEqual(invokeBody, { agentId: "agent-review", invoked: true });
    assert.deepEqual(app.agentInvocations, ["agent-review"]);

    // Invariant: every mounted /agents route requires a verified tenant context,
    // so the pilot flow above cannot have reached an endpoint that bypasses scoping.
    assert.deepEqual(routesMissingTenantScoping(app.router), []);
  } finally {
    app.server.close();
  }
});
