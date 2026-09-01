# MANOJ-FIGMA-PIZZA-STORY-006 — Admin Order Management

## Context / assumptions
The repository is currently empty (only `README.md` and `.env`) — there is no existing
application code, framework, or test setup to build on. This plan bootstraps the minimal
backend scaffolding needed to satisfy the acceptance criteria below, and nothing more:

- **Stack**: Node.js + TypeScript, Express for HTTP, Jest + Supertest for testing. This is a
  standard, easily-testable choice for a small API surface; no frontend framework is introduced
  because none of the ACs require rendered UI — "opens the order management list" / "views the
  order list" are treated as calls to the admin orders API.
- **Persistence**: an in-memory store is sufficient — no AC requires durability across restarts.
- **Auth**: no authentication system exists yet. A minimal `Authorization: Bearer <token>`
  scheme backed by an in-memory user store is introduced only to make AC5 (admin vs. non-admin)
  testable. Full auth (login, sessions, password handling, etc.) is out of scope — only the
  authorization check (role gate) required by the ACs is built.
- **Order lifecycle**: fixed, ordered list of statuses `PLACED → PREPARING → OUT_FOR_DELIVERY →
  DELIVERED`, with `DELIVERED` as the final status. This is an assumption for concreteness; if
  the reviewer has a specific lifecycle in mind, it should be corrected here before implementation.

## Scope boundaries
- No frontend/UI code — API-level behavior only.
- No database — in-memory store, reset per test.
- No login/session/token-issuance flow — tokens are pre-seeded test fixtures mapping to a fixed
  admin user and a fixed non-admin (customer) user.
- No order-creation endpoint — the store is seeded directly in tests via a test-only helper.

## Files to create
- `package.json`, `tsconfig.json`, `jest.config.js` — project scaffolding (express, typescript,
  jest, ts-jest, supertest, @types/*).
- `src/domain/types.ts` — `OrderStatus`, `Order`, `User` types.
- `src/domain/orderLifecycle.ts` — `ORDER_STATUSES` ordered list, `getNextStatus(status)` →
  next status or `null` if `status` is final.
- `src/data/orderStore.ts` — in-memory orders array; `getAllOrders()`, `advanceOrderStatus(id)`,
  `reset(orders)` (test helper).
- `src/data/userStore.ts` — in-memory token→user map; `findUserByToken(token)`, `reset(users)`
  (test helper) seeded with one admin and one non-admin user/token.
- `src/middleware/auth.ts` — `authenticate` (attaches `req.user` from bearer token) and
  `requireAdmin` (401 if no user, 403 if not admin) middleware.
- `src/routes/adminOrders.ts` — `GET /admin/orders`, `POST /admin/orders/:id/advance`.
- `src/app.ts` — Express app factory wiring the router (exported for Supertest).
- `src/server.ts` — starts the app on `process.env.PORT || 8006` (matches `ARC_DEV_PORT` in `.env`).

Test files (one per behavior, added incrementally as below):
- `tests/adminOrders.list.test.ts`
- `tests/adminOrders.advance.test.ts`
- `tests/adminOrders.listReflectsAdvance.test.ts`
- `tests/adminOrders.finalStatus.test.ts`
- `tests/adminOrders.authorization.test.ts`

## Step 0 — Scaffolding (no test)
Create `package.json`/`tsconfig.json`/`jest.config.js` and an empty `src/app.ts` exporting an
Express app with no routes yet, plus `src/server.ts`. No test — this just makes the project
runnable/testable for the steps below.

## AC1 — Unified order list
**Test first** (`tests/adminOrders.list.test.ts`): seed `orderStore` (via `reset`) with several
orders across different statuses/customers; `GET /admin/orders` with a valid admin bearer token;
assert `200` and that the response body is an array containing exactly the seeded orders (by id).
This test fails because the route doesn't exist yet.

**Minimal code**:
- `src/domain/types.ts`, `src/domain/orderLifecycle.ts` (list + `getNextStatus`, unused by this
  step's route logic yet but needed by the type).
- `src/data/orderStore.ts` with `getAllOrders()`/`reset()`.
- `src/data/userStore.ts` with `findUserByToken()`/`reset()`, seeded with an admin token.
- `src/middleware/auth.ts`: `authenticate` only — reads the bearer token, attaches `req.user` if
  found, always calls `next()` (no role gate yet — that's AC5).
- `src/routes/adminOrders.ts`: `router.get('/orders', authenticate, handler)` returning
  `orderStore.getAllOrders()`.
- Mount router in `src/app.ts` at `/admin`.

## AC2 — Advancing a non-final order moves it to the next stage
**Test first** (`tests/adminOrders.advance.test.ts`): seed one order at `PLACED`;
`POST /admin/orders/:id/advance` with admin token; assert `200` and response `status ===
'PREPARING'`. Fails: no advance route/logic yet.

**Minimal code**:
- `orderStore.advanceOrderStatus(id)`: look up order, compute `getNextStatus(order.status)`,
  mutate `order.status` to it, return the updated order (404 handling for unknown id).
- `routes/adminOrders.ts`: add `router.post('/orders/:id/advance', authenticate, handler)`
  returning `200` with the updated order, or `404` if the id doesn't exist.

## AC3 — List reflects the just-advanced status
**Test first** (`tests/adminOrders.listReflectsAdvance.test.ts`): seed an order at `PLACED`,
`POST` advance, then `GET /admin/orders`; assert that order's entry in the returned list has
`status === 'PREPARING'`. This locks in that the list route reads live store state rather than a
stale snapshot; if `orderStore.getAllOrders()` is implemented as anything other than a direct
read of the live array (e.g. a copy taken at module load), this test fails and exposes it.

**Minimal code**: none expected beyond AC1/AC2 if `orderStore` holds a single shared array and
`getAllOrders()` reads it directly each call. If the test fails, fix `orderStore` so list reads
are always live.

## AC4 — No advance action available at final status
**Test first** (`tests/adminOrders.finalStatus.test.ts`), three assertions:
1. Seed an order at `DELIVERED` (final) and one at `PLACED`; `GET /admin/orders`; assert the
   `DELIVERED` order's entry has `canAdvance: false` and the `PLACED` order's entry has
   `canAdvance: true`.
2. `POST /admin/orders/:id/advance` on the `DELIVERED` order with admin token; assert `409` with
   an error body.
3. `GET /admin/orders` again; assert that order's `status` is still `DELIVERED` (unchanged).
All fail initially: `canAdvance` doesn't exist and advance doesn't reject final orders.

**Minimal code**:
- `orderLifecycle.getNextStatus` already returns `null` for the final status (from AC1 setup).
- `orderStore.getAllOrders()` (or the route serializer) maps each order to include
  `canAdvance: getNextStatus(order.status) !== null`.
- `orderStore.advanceOrderStatus(id)` throws a typed `FinalStatusError` when
  `getNextStatus(order.status) === null`, without mutating the order.
- `routes/adminOrders.ts` advance handler catches `FinalStatusError` and responds `409`.

## AC5 — Non-admin access is denied
**Test first** (`tests/adminOrders.authorization.test.ts`):
1. `GET /admin/orders` with the seeded non-admin token → `403`.
2. `GET /admin/orders` with no `Authorization` header → `401`.
3. `POST /admin/orders/:id/advance` with the non-admin token → `403`, and a follow-up `GET` shows
   the order's status unchanged.
These fail initially because no role gate exists yet (routes currently only run `authenticate`).

**Minimal code**:
- `src/middleware/auth.ts`: add `requireAdmin` — `401` if `!req.user`, `403` if
  `req.user.role !== 'admin'`, else `next()`.
- `src/routes/adminOrders.ts`: insert `requireAdmin` after `authenticate` on both routes.
- Re-run the full suite: AC1–AC4 tests must still pass since they use the seeded admin token.

## Verification
Run `npm test` (Jest) after each step; all previously-passing tests must remain green. Final
state: all 5 test files pass together against the same app instance/module-level stores (reset
in `beforeEach`).
