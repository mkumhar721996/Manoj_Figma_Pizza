import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";
import { TenantRegistry } from "../src/tenants/registry.ts";
import { issueContext } from "../src/tenants/tenantContext.ts";

function startTestApp() {
  const registry = new TenantRegistry([
    { tenantId: "tenant-a", apiKey: "key-a", agentIds: ["agent-1"] },
    { tenantId: "tenant-b", apiKey: "key-b", agentIds: ["agent-9"] },
  ]);
  const app = createApp(registry);
  app.server.listen(0);
  const { port } = app.server.address() as AddressInfo;
  return { app, baseUrl: `http://127.0.0.1:${port}` };
}

test("AC3: a tenant A context reaches an agent scoped to tenant A", async () => {
  const { app, baseUrl } = startTestApp();
  try {
    const context = issueContext({ tenantId: "tenant-a", agentIds: ["agent-1"] });

    const response = await fetch(`${baseUrl}/agents/agent-1/invoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${context}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.agentId, "agent-1");
    assert.deepEqual(app.agentInvocations, ["agent-1"]);
  } finally {
    app.server.close();
  }
});

test("AC4: a tenant A context is rejected for tenant B's agent", async () => {
  const { app, baseUrl } = startTestApp();
  try {
    const context = issueContext({ tenantId: "tenant-a", agentIds: ["agent-1"] });

    const response = await fetch(`${baseUrl}/agents/agent-9/invoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${context}` },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error, "agent_not_in_tenant_scope");
    assert.deepEqual(app.agentInvocations, []);
  } finally {
    app.server.close();
  }
});
