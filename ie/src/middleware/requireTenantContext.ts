import type { Middleware } from "../http/router.ts";
import { verifyContext } from "../tenants/tenantContext.ts";

export const requireTenantContext: Middleware = (ctx, next) => {
  const token = ctx.authorizationBearerToken();
  const claims = token ? verifyContext(token) : null;

  if (!claims) {
    ctx.json(401, { error: "invalid_tenant_context" });
    return;
  }

  ctx.tenantContext = claims;
  return next();
};
