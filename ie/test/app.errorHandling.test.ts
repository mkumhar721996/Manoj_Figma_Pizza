import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";
import { TenantRegistry } from "../src/tenants/registry.ts";

test("a handler that throws yields a 500 response instead of an unhandled promise rejection", async () => {
  const app = createApp(new TenantRegistry([]));
  app.router.register("GET", "/__throws-for-test", [], () => {
    throw new Error("boom");
  });
  app.server.listen(0);
  const { port } = app.server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/__throws-for-test`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.error, "internal_error");
  } finally {
    app.server.close();
  }
});
