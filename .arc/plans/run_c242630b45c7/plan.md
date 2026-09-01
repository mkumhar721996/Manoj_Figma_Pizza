# Plan: MANOJ-FIGMA-PIZZA-STORY-004 — Order Status Tracking

## Context / assumption

The repository is currently greenfield: it contains only `README.md` and `.env`
(`ARC_DEV_PORT=8004`, `ARC_WEB_PORT=3004`), no source code, framework, or test
harness yet. There is no existing "order" concept, order model, or confirmation
page to extend.

Since there are no established conventions to follow, this plan assumes a
minimal, conventional stack:

- **Backend:** Node.js + Express, tested with **Jest** + **supertest**.
- **Storage:** in-memory store for orders (module-level Map), since no database
  is set up yet and nothing in the ACs requires persistence beyond process
  lifetime being out of scope to build here — this plan only builds the status
  read/lookup, not order creation or the admin update mechanism (see Non-goals).
- **Frontend:** a single server-rendered/static HTML view for the order status
  page, fetching JSON from the backend via a small script.
- Ports come from `.env` (`ARC_DEV_PORT` for the API, `ARC_WEB_PORT` for any
  static web serving), consistent with the existing `.env`.

**If a different stack/framework is intended, tell me and I'll redo this plan
against it before any code is written.**

## Non-goals (out of scope for this story)

- Building order placement/checkout flow. This story assumes an order with an
  `orderNumber` and a `status` already exists in the store. A minimal seam
  (`createOrder` in the order store) will be added only so tests can set up
  fixtures — no checkout UI/API.
- Building the admin status-update UI. AC2 only requires that *when* status
  changes in the store, the customer-facing read reflects it. A minimal
  `updateOrderStatus` store function will be added as the seam admin tooling
  will later call — no admin UI/auth in this story.
- Authentication/accounts of any kind (explicitly excluded per AC3).

## Domain model

- `Order { orderNumber: string, status: 'Placed' | 'In Progress' | 'Done', createdAt: Date }`
- Order status is looked up **only** by `orderNumber` — no session/account
  association, satisfying "without needing an account" (AC3) and "at a later
  time" persistence (AC4, since the in-memory store is keyed by order number
  indefinitely for the life of the process, independent of any user session).

## Files to create

- `src/orders/orderStore.js` — in-memory order store: `createOrder(orderNumber, status)`, `getOrder(orderNumber)`, `updateOrderStatus(orderNumber, status)`.
- `src/orders/orderStatusRoutes.js` — Express router exposing `GET /api/orders/:orderNumber/status`.
- `src/app.js` — Express app wiring middleware + routes (if not already present after Story 004 work; created here since nothing exists yet).
- `src/server.js` — starts the app on `process.env.ARC_DEV_PORT`.
- `public/order-status.html` — customer-facing order status page (input box for order number + status display), reachable at `/order-status`.
- `public/order-status.js` — client script: reads `orderNumber` from a query param or form input, calls the status API, renders the result.
- `public/confirmation.html` — minimal confirmation page stub that displays the status for a given order number (satisfies AC1); reuses `order-status.js` logic via a shared fetch helper.
- `test/orderStore.test.js`
- `test/orderStatusRoutes.test.js`

## Test-first plan by acceptance criterion

### AC1 — Confirmation page shows current status (Placed / In Progress / Done)

**Failing test first (`test/orderStatusRoutes.test.js`):**
```js
test('GET /api/orders/:orderNumber/status returns the order status', async () => {
  orderStore.createOrder('ORD-1', 'Placed');
  const res = await request(app).get('/api/orders/ORD-1/status');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ orderNumber: 'ORD-1', status: 'Placed' });
});
```
**Minimal code to pass:**
- `orderStore.createOrder`/`getOrder` (plain Map operations).
- `orderStatusRoutes.js`: `GET /api/orders/:orderNumber/status` → 200 with `{ orderNumber, status }`, or 404 if not found.
- `app.js` mounts the router.
- `confirmation.html` + its script call this endpoint on load and render one of the three literal status strings.

Manual/UI check: since this involves a page, after the API test passes, load `confirmation.html?orderNumber=ORD-1` in a browser against the dev server and confirm the status text renders.

### AC2 — Status reflects admin update on refresh

**Failing test first:**
```js
test('status reflects an update made after creation', async () => {
  orderStore.createOrder('ORD-2', 'Placed');
  orderStore.updateOrderStatus('ORD-2', 'In Progress');
  const res = await request(app).get('/api/orders/ORD-2/status');
  expect(res.body.status).toBe('In Progress');
});
```
**Minimal code to pass:**
- `orderStore.updateOrderStatus(orderNumber, status)` mutates the stored order.
- No caching layer anywhere in the read path (route always reads live from the store), so a page refresh naturally re-fetches and reflects the new value — no extra production code needed beyond the store function.

### AC3 — Order status page accessible via order number only, no login

**Failing test first:**
```js
test('status route has no auth middleware and requires only orderNumber', async () => {
  orderStore.createOrder('ORD-3', 'Placed');
  const res = await request(app).get('/api/orders/ORD-3/status'); // no auth header/cookie
  expect(res.status).toBe(200);
});

test('unknown order number returns 404, not an auth error', async () => {
  const res = await request(app).get('/api/orders/DOES-NOT-EXIST/status');
  expect(res.status).toBe(404);
});
```
**Minimal code to pass:**
- Ensure no auth middleware is attached to the `/api/orders/:orderNumber/status` route or its router.
- Route returns `404 { error: 'Order not found' }` when `getOrder` returns undefined.
- `public/order-status.html` is a standalone page (linked from nowhere requiring login) with a form: enter order number → submit → GET request → render status or "not found".

### AC4 — Status for a Done order remains viewable later

**Failing test first:**
```js
test('a Done order remains retrievable after status reaches Done', async () => {
  orderStore.createOrder('ORD-4', 'Placed');
  orderStore.updateOrderStatus('ORD-4', 'Done');
  const res = await request(app).get('/api/orders/ORD-4/status');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('Done');
});
```
**Minimal code to pass:**
- Confirm `getOrder`/the route never delete or expire an order on reaching `Done` (i.e., don't add any TTL/cleanup logic on the `Done` transition) — this is a matter of *not* adding removal logic, verified by the test above passing against the same store/route code from AC1–AC3 with no special-casing for `Done`.

## Setup work needed before the above (once, first task)

1. `npm init` + add `express`, and devDependencies `jest`, `supertest`.
2. Add `"test": "jest"` script to `package.json`.
3. Create `src/app.js` (Express app factory, exported for supertest) and `src/server.js` (listens on `process.env.ARC_DEV_PORT`), since neither exists yet.

## Order of implementation (TDD)

1. Scaffold project (package.json, jest config) — no tests yet, just tooling.
2. `orderStore.test.js`: write/pass tests for `createOrder`, `getOrder`, `updateOrderStatus`.
3. `orderStatusRoutes.test.js` AC1 test → implement route + app wiring.
4. AC2 test → implement `updateOrderStatus` usage (already covered by store, confirms no caching).
5. AC3 tests → confirm no auth, add 404 handling.
6. AC4 test → confirm no expiry/deletion logic.
7. Build `public/confirmation.html` and `public/order-status.html` + shared `order-status.js` fetch/render logic, manually verified in-browser against the running dev server for all three statuses and the not-found case.
