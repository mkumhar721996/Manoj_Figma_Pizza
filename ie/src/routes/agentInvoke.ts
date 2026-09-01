import type { Handler } from "../http/router.ts";

export function agentInvokeHandler(invocations: string[]): Handler {
  return (ctx) => {
    const { agentId } = ctx.params;
    const tenantContext = ctx.tenantContext;

    if (!tenantContext || !tenantContext.agentIds.includes(agentId)) {
      ctx.json(403, { error: "agent_not_in_tenant_scope" });
      return;
    }

    invocations.push(agentId);
    ctx.json(200, { agentId, invoked: true });
  };
}
