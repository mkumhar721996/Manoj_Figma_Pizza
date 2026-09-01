import type { IncomingMessage, ServerResponse } from "node:http";

export interface TenantContextClaims {
  tenantId: string;
  agentIds: string[];
}

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  tenantContext?: TenantContextClaims;
  json(status: number, body: unknown): void;
  authorizationBearerToken(): string | null;
}

export type Handler = (ctx: RouteContext) => void | Promise<void>;
export type Next = () => void | Promise<void>;
export type Middleware = (ctx: RouteContext, next: Next) => void | Promise<void>;

export interface RouteDefinition {
  method: string;
  path: string;
  middleware: Middleware[];
  handler: Handler;
}

export class Router {
  private readonly routes: RouteDefinition[] = [];

  register(method: string, path: string, middleware: Middleware[], handler: Handler): void {
    this.routes.push({ method: method.toUpperCase(), path, middleware, handler });
  }

  getRoutes(): readonly RouteDefinition[] {
    return this.routes;
  }

  match(method: string, pathname: string): { route: RouteDefinition; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      const params = matchPath(route.path, pathname);
      if (params) return { route, params };
    }
    return null;
  }
}

function matchPath(pattern: string, actual: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const actualParts = actual.split("/").filter(Boolean);
  if (patternParts.length !== actualParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const actualPart = actualParts[i];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(actualPart);
    } else if (patternPart !== actualPart) {
      return null;
    }
  }
  return params;
}

export function buildContext(req: IncomingMessage, res: ServerResponse, params: Record<string, string>): RouteContext {
  return {
    req,
    res,
    params,
    json(status, body) {
      const payload = JSON.stringify(body);
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      });
      res.end(payload);
    },
    authorizationBearerToken() {
      const header = req.headers.authorization;
      if (!header || Array.isArray(header)) return null;
      const match = /^Bearer\s+(.+)$/.exec(header);
      return match ? match[1] : null;
    },
  };
}

export async function runChain(chain: Middleware[], ctx: RouteContext): Promise<void> {
  let index = -1;
  async function dispatchNext(): Promise<void> {
    index++;
    const middleware = chain[index];
    if (!middleware) return;
    await middleware(ctx, dispatchNext);
  }
  await dispatchNext();
}
