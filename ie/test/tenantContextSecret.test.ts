import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ieRoot = fileURLToPath(new URL("..", import.meta.url));

function runWithoutSecret(): { status: number | null; stderr: string } {
  const { IE_TENANT_CONTEXT_SECRET: _unused, ...envWithoutSecret } = process.env;
  const result = spawnSync(
    process.execPath,
    ["-e", "await import('./src/tenants/tenantContext.ts')"],
    { cwd: ieRoot, env: envWithoutSecret },
  );
  return { status: result.status, stderr: result.stderr.toString() };
}

test("IE_TENANT_CONTEXT_SECRET must be explicitly configured: refuses to start when missing, instead of using a public fallback secret", () => {
  const { status, stderr } = runWithoutSecret();

  assert.notEqual(status, 0);
  assert.match(stderr, /IE_TENANT_CONTEXT_SECRET/);
});
