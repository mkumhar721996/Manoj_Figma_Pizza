import { createHmac, timingSafeEqual } from "node:crypto";

export interface TenantContextPayload {
  tenantId: string;
  agentIds: string[];
}

const SECRET = requireSecret();

function requireSecret(): string {
  const value = process.env.IE_TENANT_CONTEXT_SECRET;
  if (!value) {
    throw new Error(
      "IE_TENANT_CONTEXT_SECRET environment variable must be set; refusing to start with no tenant context signing secret configured.",
    );
  }
  return value;
}

export function issueContext(payload: TenantContextPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyContext(token: string): TenantContextPayload | null {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const encoded = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (!encoded || !signature || !signaturesMatch(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof payload?.tenantId !== "string" || !Array.isArray(payload.agentIds)) return null;
    if (!payload.agentIds.every((agentId: unknown) => typeof agentId === "string")) return null;
    return { tenantId: payload.tenantId, agentIds: payload.agentIds };
  } catch {
    return null;
  }
}

function sign(encoded: string): string {
  return createHmac("sha256", SECRET).update(encoded).digest("base64url");
}

function signaturesMatch(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
