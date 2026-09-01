import type { Handler } from "../http/router.ts";
import type { TenantRegistry } from "../tenants/registry.ts";
import { issueContext } from "../tenants/tenantContext.ts";

export function tenantContextHandler(registry: TenantRegistry): Handler {
  return (ctx) => {
    const presentedCredential = ctx.authorizationBearerToken();
    const tenant = presentedCredential ? registry.findByApiKey(presentedCredential) : null;

    if (!tenant) {
      ctx.json(401, { error: "invalid_credentials" });
      return;
    }

    const context = issueContext({ tenantId: tenant.tenantId, agentIds: tenant.agentIds });
    ctx.json(200, { tenantId: tenant.tenantId, agentIds: tenant.agentIds, context });
  };
}
