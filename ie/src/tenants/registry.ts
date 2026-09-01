export interface TenantRecord {
  tenantId: string;
  apiKey: string;
  agentIds: string[];
}

export class TenantRegistry {
  private readonly tenants: readonly TenantRecord[];

  constructor(tenants: readonly TenantRecord[]) {
    this.tenants = tenants;
  }

  findByApiKey(apiKey: string): TenantRecord | null {
    return this.tenants.find((tenant) => tenant.apiKey === apiKey) ?? null;
  }

  findAgentOwner(agentId: string): TenantRecord | null {
    return this.tenants.find((tenant) => tenant.agentIds.includes(agentId)) ?? null;
  }
}
