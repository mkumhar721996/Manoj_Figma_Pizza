import { createServer, type Server } from "node:http";
import { Router, buildContext, runChain } from "./http/router.ts";
import type { TenantRegistry } from "./tenants/registry.ts";
import { requireTenantContext } from "./middleware/requireTenantContext.ts";
import { tenantContextHandler } from "./routes/tenantContext.ts";
import { agentInvokeHandler } from "./routes/agentInvoke.ts";

export interface App {
  server: Server;
  router: Router;
  agentInvocations: string[];
}

export function createApp(registry: TenantRegistry): App {
  const router = new Router();
  const agentInvocations: string[] = [];

  router.register("POST", "/tenant-context", [], tenantContextHandler(registry));
  router.register("POST", "/agents/:agentId/invoke", [requireTenantContext], agentInvokeHandler(agentInvocations));

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const match = router.match(req.method ?? "GET", url.pathname);

    if (!match) {
      const payload = JSON.stringify({ error: "not_found" });
      res.writeHead(404, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
      res.end(payload);
      return;
    }

    const ctx = buildContext(req, res, match.params);
    const chain = [...match.route.middleware, (c: typeof ctx) => match.route.handler(c)];
    runChain(chain, ctx).catch(() => {
      if (res.headersSent) {
        res.end();
        return;
      }
      const payload = JSON.stringify({ error: "internal_error" });
      res.writeHead(500, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
      res.end(payload);
    });
  });

  return { server, router, agentInvocations };
}

/**
 * Every route under /agents is expected to require a verified tenant context.
 * This is asserted by tests as an invariant, not just a one-off check, so a
 * future route added without requireTenantContext fails the build's test suite.
 */
export function routesMissingTenantScoping(router: Router): string[] {
  return router
    .getRoutes()
    .filter((route) => route.path.startsWith("/agents") && !route.middleware.includes(requireTenantContext))
    .map((route) => `${route.method} ${route.path}`);
}
