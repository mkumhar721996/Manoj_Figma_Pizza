# MANOJ-FIGMA-PIZZA-STORY-002 — Cart Management: Implementation Plan

## Context / Assumptions

The repository is currently empty (only `README.md` and `.env`) — there is no existing
codebase, framework, or prior "menu" story to build on in this worktree. This plan therefore
includes minimal greenfield project setup and scopes the story as a **backend cart domain +
service + HTTP API**, since no frontend/UI framework exists to build the "views the menu" /
"views the cart" screens against. Acceptance criteria that describe UI behavior (checkout
action visible/hidden, empty-cart message) are implemented as data returned by the cart API
(`canCheckout`, `message`) rather than as rendered UI, since there's no frontend scaffold in
this repo to attach it to.

Stack choice (nothing pre-existing to conform to):
- Node.js + TypeScript
- Express for the HTTP API (dev port from `.env`: `ARC_DEV_PORT`)
- Jest + ts-jest for unit tests, Supertest for HTTP integration tests

Domain model kept minimal and only as large as the ACs require:
- `MenuItem`: `id`, `name`, `type` (`SIDE` | `DRINK` | `PIZZA`), and pricing — `price` for
  `SIDE`/`DRINK`, `sizePricing: Record<PizzaSize, number>` for `PIZZA` (`SMALL`/`MEDIUM`/`LARGE`).
- `CartItem`: `id`, `menuItemId`, `name`, `size?`, `unitPrice`, `quantity`, `lineTotal`
  (`unitPrice * quantity`).
- `Cart`: `id`, `items: CartItem[]`.

Explicitly **not** in scope (no AC covers it): merging duplicate add-item calls into one line,
persistence/storage beyond in-memory, authentication, checkout flow itself (only that the
*action* is available), and any real UI.

The two-step "reduce to zero, then confirm" in AC4 is modeled as two distinct service
operations: `updateQuantity` (only accepts quantities ≥ 1, i.e. increase/decrease) and a
separate `removeItem` (the "confirm" action), rather than overloading `updateQuantity(0)`
with implicit deletion.

## Setup (not test-driven — scaffolding only)

Files to create:
- `package.json` (name, scripts: `test`, `build`, `dev`; deps: `express`; devDeps: `typescript`,
  `ts-jest`, `jest`, `@types/jest`, `@types/express`, `@types/node`, `supertest`,
  `@types/supertest`, `ts-node`)
- `tsconfig.json`
- `jest.config.js`

No production logic goes here — just enough for `npm test` to run.

## Phase 1 — Domain & Service (TDD per acceptance criterion)

### AC1 — Adding a Side, Drink, or sized Pizza puts it in the cart with quantity 1
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "adds a Side to an empty cart with quantity 1"
  - "adds a Drink to an empty cart with quantity 1"
  - "adds a Pizza with a selected size to the cart with quantity 1 and the size's price"
- **Minimal code to pass:**
  - `src/domain/menuItem.ts`: `MenuItemType`, `PizzaSize` enums, `MenuItem` type.
  - `src/domain/cart.ts`: `Cart`, `CartItem` types + `createCart()`.
  - `src/services/cartService.ts`: `addItem(cart, menuItem, options?: { size?: PizzaSize })` —
    resolves unit price (flat `price`, or `sizePricing[size]` for pizza), creates a new
    `CartItem` with `quantity: 1`, pushes it onto `cart.items`.
- **Files:** create `src/domain/menuItem.ts`, `src/domain/cart.ts`, `src/services/cartService.ts`,
  `tests/unit/cartService.test.ts`.

### AC2 — Increasing/decreasing quantity updates the cart
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "increasing the quantity of an existing cart item updates its quantity"
  - "decreasing the quantity of an existing cart item updates its quantity"
- **Minimal code to pass:**
  - `src/services/cartService.ts`: `updateQuantity(cart, cartItemId, quantity)` — finds the
    item by id, throws `RangeError` if `quantity < 1` (zero/removal is handled by `removeItem`,
    see AC4), otherwise sets `item.quantity = quantity`.
- **Files:** modify `src/services/cartService.ts`, `tests/unit/cartService.test.ts`.

### AC3 — Line-item total updates to match the new quantity
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "the line item's total equals unitPrice * quantity after an increase"
  - "the line item's total equals unitPrice * quantity after a decrease"
- **Minimal code to pass:**
  - `src/domain/cart.ts`: `CartItem` exposes `lineTotal` (computed as `unitPrice * quantity`,
    either via a getter function `lineTotal(item)` or recomputed in `cartService` whenever
    quantity changes — kept as a plain computed function to avoid class/getter overhead).
  - `src/services/cartService.ts`: `addItem` and `updateQuantity` both (re)compute `lineTotal`
    on the affected item.
- **Files:** modify `src/domain/cart.ts`, `src/services/cartService.ts`,
  `tests/unit/cartService.test.ts`.

### AC4 — Reducing quantity to zero and confirming removes the item
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "updateQuantity throws when given a quantity of 0" (enforces the two-step flow)
  - "removeItem removes the specified item from the cart"
  - "removeItem leaves other cart items untouched"
- **Minimal code to pass:**
  - `src/services/cartService.ts`: `removeItem(cart, cartItemId)` filters the item out of
    `cart.items`.
- **Files:** modify `src/services/cartService.ts`, `tests/unit/cartService.test.ts`.

### AC5 — Running subtotal of all items is displayed
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "getSummary returns a subtotal equal to the sum of all line-item totals"
- **Minimal code to pass:**
  - `src/services/cartService.ts`: `getSummary(cart)` returns
    `{ items, subtotal, canCheckout, message }`; `subtotal` = sum of each item's `lineTotal`.
- **Files:** modify `src/services/cartService.ts`, `tests/unit/cartService.test.ts`.

### AC6 — Checkout action is available when the cart has items
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "getSummary returns canCheckout: true when the cart has at least one item"
- **Minimal code to pass:**
  - `src/services/cartService.ts`: `getSummary` sets `canCheckout = cart.items.length > 0`.
- **Files:** modify `src/services/cartService.ts`, `tests/unit/cartService.test.ts`.

### AC7 — Empty-cart message
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "getSummary returns the message 'Your cart is empty' when the cart has no items"
  - "getSummary returns no message when the cart has items"
- **Minimal code to pass:**
  - `src/services/cartService.ts`: `getSummary` sets `message = 'Your cart is empty'` when
    `cart.items.length === 0`, else `undefined`.
- **Files:** modify `src/services/cartService.ts`, `tests/unit/cartService.test.ts`.

### AC8 — No checkout action when the cart is empty
- **Failing tests first** (`tests/unit/cartService.test.ts`):
  - "getSummary returns canCheckout: false when the cart has no items"
- **Minimal code to pass:** covered by the same `canCheckout` expression from AC6
  (`cart.items.length > 0`) — this test just pins the empty-cart case.
- **Files:** `tests/unit/cartService.test.ts` only (no new production code beyond AC6).

## Phase 2 — HTTP API wiring (integration tests over the same behavior)

Exposes the service to a "customer" via HTTP so the ACs are also verified end-to-end, not just
at the service layer.

- **Failing tests first** (`tests/integration/cartRoutes.test.ts`, using Supertest against the
  Express app):
  - "POST /carts/:cartId/items adds a menu item and returns it with quantity 1" (AC1)
  - "PATCH /carts/:cartId/items/:itemId updates quantity and recalculates the line total"
    (AC2, AC3)
  - "PATCH .../items/:itemId with quantity 0 responds 400" (guards AC4's two-step flow)
  - "DELETE /carts/:cartId/items/:itemId removes the item" (AC4)
  - "GET /carts/:cartId returns subtotal and canCheckout: true when items exist" (AC5, AC6)
  - "GET /carts/:cartId returns the empty-cart message and canCheckout: false when empty"
    (AC7, AC8)
- **Minimal code to pass:**
  - `src/api/cartRoutes.ts`: Express router mapping the above routes onto
    `cartService` functions, translating thrown `RangeError` (quantity 0) to a 400 response.
  - `src/api/app.ts`: builds the Express app, mounts `cartRoutes`.
  - `src/server.ts`: starts the app on `process.env.ARC_DEV_PORT`.
  - `src/store/cartStore.ts`: minimal in-memory `Map<cartId, Cart>` so routes have somewhere to
    read/write carts between requests (no persistence requirements in the ACs, so in-memory is
    sufficient).
- **Files:** create `src/api/cartRoutes.ts`, `src/api/app.ts`, `src/server.ts`,
  `src/store/cartStore.ts`, `tests/integration/cartRoutes.test.ts`.

## Test/implementation order

1. Setup scaffolding (package.json, tsconfig, jest config).
2. AC1 → AC2 → AC3 → AC4 → AC5 → AC6 → AC7 → AC8, each as its own red/green cycle in
   `cartService.test.ts` / `cartService.ts` / `cart.ts` / `menuItem.ts`.
3. Phase 2 integration tests wiring the service to Express routes, one red/green cycle per
   route.

## Out of scope

- Any real frontend/menu-browsing UI (no ACs describe rendering; this repo has no UI framework
  set up).
- Persisting carts beyond process memory.
- Checkout flow logic itself — only that the action is reported as available/unavailable.
- Merging repeated "add same item" calls into a single line (not required by AC1).
