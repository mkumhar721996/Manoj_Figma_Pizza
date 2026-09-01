# MANOJ-FIGMA-PIZZA-STORY-009 — Tenant context API for Composer

## Context / codebase state

The repository (`/workspace`) is currently empty aside from `README.md` (title only).
There is no existing IE (agent-hosting) service, no Composer client, and no
`new-stories-to-define.md` file to pull additional detail from. This story is the
first piece of work in this repo, so the plan below builds the minimal IE-side
tenant-context API from scratch, test-first, scoped strictly to the acceptance
criteria (AC1–AC6). No other IE functionality (agent execution, business logic,
persistence beyond an in-memory tenant/agent registry) is introduced.

**Working assumptions** (kept intentionally minimal, to be confirmed with the
reviewer since no prior code/ADRs exist to derive them from):
- IE is implemented as a Node/TypeScript service (`ie/`), since no language/stack
  is fixed by the repo yet and this keeps the surface small and testable with
  Jest/Vitest-style tests. If the reviewer has a different intended stack, this
  plan's structure (routes/middleware/tests) still applies, just ported.
- "Tenant credentials" = an API key issued per tenant, looked up in an in-memory
  tenant registry (seeded for tests). Real credential issuance/storage is out of
  scope for this story — only validation and context issuance are in scope.
- "Tenant context" = a signed, short-lived token (JWT-like) encoding `tenantId`
  and the list of IE agent IDs scoped to that tenant. Composer presents this
  token on subsequent routing calls.
- "Routing" (AC3/AC4) is exercised through a minimal IE endpoint
  (`POST /agents/:agentId/invoke`) that checks the presented tenant context
  against the agent's tenant ownership before allowing the call through. Full
  agent invocation logic itself is out of scope — the test double only needs
  enough to prove the scoping check fires.
- The "Code Review Pipeline pilot" flow (AC5/AC6) is validated as an integration
  test that drives the real tenant-context + routing endpoints end-to-end for one
  configured pilot tenant, asserting no bypass endpoint is hit — it is not a new
  product feature, just a black-box test proving the same API graph is used.

If any of these assumptions conflict with existing plans/ADRs the reviewer is
aware of but that aren't in this repo, flag it and I will revise.

## Proposed file layout

```
ie/
  src/
    tenants/
      registry.ts        # in-memory tenant + agent-scope store
      tenantContext.ts    # issue/verify tenant context tokens
    routes/
      tenantContext.ts    # POST /tenant-context
      agentInvoke.ts       # POST /agents/:agentId/invoke (scoping check)
    middleware/
      requireTenantContext.ts  # extracts + verifies context, rejects if invalid
    app.ts                # wires routes together
  test/
    tenantContext.route.test.ts
    agentInvoke.route.test.ts
    pilotFlow.integration.test.ts
```

## AC1 — Valid credentials → scoped tenant context

**Failing test first** (`ie/test/tenantContext.route.test.ts`):
- Seed registry with tenant `tenant-a` (apiKey `key-a`) owning agents
  `agent-1`, `agent-2`.
- `POST /tenant-context` with header `Authorization: Bearer key-a`.
- Assert `200`, response body contains `tenantId: 'tenant-a'` and
  `agentIds: ['agent-1', 'agent-2']`, and a `context` token string.

**Minimal code:**
- `ie/src/tenants/registry.ts`: `findTenantByApiKey(apiKey)` returning
  `{ tenantId, agentIds } | null`.
- `ie/src/tenants/tenantContext.ts`: `issueContext({ tenantId, agentIds })` →
  signed token (HMAC over JSON payload with server secret; no external JWT lib
  needed for this scope, but `jsonwebtoken` is fine if already idiomatic).
- `ie/src/routes/tenantContext.ts`: `POST /tenant-context` handler — looks up
  tenant by API key, calls `issueContext`, returns `{ tenantId, agentIds, context }`.
- `ie/src/app.ts`: mount route.

**Files:** create `registry.ts`, `tenantContext.ts` (tenants dir),
`routes/tenantContext.ts`, `app.ts`, `test/tenantContext.route.test.ts`.

## AC2 — Invalid/missing credentials → rejection, no context

**Failing tests first** (same test file):
- `POST /tenant-context` with no `Authorization` header → assert `401`, body has
  no `context`/`tenantId`/`agentIds` fields (only an error indicator).
- `POST /tenant-context` with `Authorization: Bearer bad-key` → assert `401`,
  same no-context assertion.

**Minimal code:**
- Extend `routes/tenantContext.ts` handler: if header missing or
  `findTenantByApiKey` returns `null`, respond `401` with `{ error: 'invalid_credentials' }`
  and return before calling `issueContext`.

**Files:** modify `routes/tenantContext.ts`, extend
`test/tenantContext.route.test.ts`.

## AC3 — Context for tenant A reaches only tenant A's agents

**Failing test first** (`ie/test/agentInvoke.route.test.ts`):
- Seed registry: `tenant-a` owns `agent-1`; `tenant-b` owns `agent-9`.
- Obtain a valid context for `tenant-a` via `issueContext`.
- `POST /agents/agent-1/invoke` with `Authorization: Bearer <context>` →
  assert `200` (request reaches the agent stub).
- Assert the agent stub handler recorded the call (proves it actually routed).

**Minimal code:**
- `ie/src/middleware/requireTenantContext.ts`: verifies token via
  `tenantContext.verify(token)`, attaches `{ tenantId, agentIds }` to
  `req.tenantContext`, else `401`.
- `ie/src/routes/agentInvoke.ts`: `POST /agents/:agentId/invoke` — behind
  `requireTenantContext`; checks `req.params.agentId` is included in
  `req.tenantContext.agentIds`; if yes, calls a minimal in-memory agent stub and
  returns `200`.
- Mount in `app.ts`.

**Files:** create `middleware/requireTenantContext.ts`,
`routes/agentInvoke.ts`, `test/agentInvoke.route.test.ts`; modify `app.ts`.

## AC4 — Context for tenant A rejected for tenant B's agents/resources

**Failing test first** (same test file):
- Using the tenant-a context from AC3, `POST /agents/agent-9/invoke`
  (tenant-b's agent) → assert `403`, and assert the agent-9 stub handler was
  NOT called.

**Minimal code:**
- Extend `routes/agentInvoke.ts`: when `agentId` not in
  `req.tenantContext.agentIds`, respond `403` with
  `{ error: 'agent_not_in_tenant_scope' }` before invoking the stub.

**Files:** modify `routes/agentInvoke.ts`, extend
`test/agentInvoke.route.test.ts`.

## AC5 — Pilot tenant: Composer authenticates and obtains a tenant context via the pilot flow

**Failing test first** (`ie/test/pilotFlow.integration.test.ts`):
- Seed registry with a "pilot" tenant (`tenant-pilot`, apiKey `key-pilot`, one
  agent `agent-review`), representing the Code Review Pipeline pilot's real
  tenant config.
- Simulate the Composer pilot flow: `POST /tenant-context` with
  `Authorization: Bearer key-pilot`.
- Assert `200` and that the response contains a valid `context` scoped to
  `tenant-pilot` with `agentIds: ['agent-review']`.

**Minimal code:** none beyond AC1 — this test exercises the same
`/tenant-context` route with a pilot-shaped fixture, proving the general API
serves the specific pilot scenario. If it passes without changes, that's
expected (regression/integration coverage, not new behavior).

**Files:** create `test/pilotFlow.integration.test.ts` with pilot fixture data
in `registry.ts`'s seed helper (or a local fixture in the test file — prefer
local fixture to avoid polluting the shared registry seed).

## AC6 — Pilot-flow context routes without invoking any bypass endpoint

**Failing test first** (same integration test file):
- Using the `tenant-pilot` context from AC5, call
  `POST /agents/agent-review/invoke` → assert `200`.
- Assert no "bypass" endpoint exists/was hit: add a route
  `POST /agents/:agentId/invoke-unscoped` used only in this test to represent a
  hypothetical bypass, and assert calling it directly (without going through
  tenant-context flow) is rejected — OR, simpler and sufficient: assert that
  the only code path exercised by the pilot flow test is
  `requireTenantContext` + `agentInvoke`, by spying on/instrumenting that no
  other route handler in `app.ts` is registered without the
  `requireTenantContext` middleware.
- Concretely: a static/route-audit test — enumerate all mounted routes in
  `app.ts` and assert every `/agents/*` route has `requireTenantContext` in its
  middleware chain. This directly encodes "no bypass endpoint" as a testable
  invariant rather than an unfalsifiable negative.

**Minimal code:**
- `ie/src/app.ts`: expose a way to introspect mounted routes and their
  middleware (e.g. Express's `app._router.stack` inspection helper
  `getRouteMiddlewareChains()` in `app.ts`, or structure route registration
  through a small typed table `routes: { path, method, middleware[] }[]` that
  both `app.ts` and the test can read) — no route bypassing tenant scoping is
  added, so this test should pass once AC3/AC4 code exists; it exists to lock
  in the invariant going forward.

**Files:** modify `app.ts` (add route table/introspection), create/extend
`test/pilotFlow.integration.test.ts`.

## Execution order

1. AC1 → AC2 (tenant-context route, red/green each)
2. AC3 → AC4 (agent invoke route + scoping middleware, red/green each)
3. AC5 (pilot integration test reusing AC1 route)
4. AC6 (route-audit invariant test)

## Explicitly out of scope

- Real credential issuance/rotation, persistent tenant storage/DB.
- Actual IE agent execution logic (stubs only).
- Composer-side implementation (this story is IE-side API only, per description).
- Any UI, admin tooling, or multi-region/replication concerns.
