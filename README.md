# Manoj_Figma_Pizza

A pizza ordering app. This story implements menu browsing: customers can see
all active menu items grouped under three fixed categories (Pizzas, Sides,
Drinks) as soon as they load the app.

## Stack

- `backend/` — Node.js HTTP API (no external dependencies) serving menu data
  from an in-memory seed list. Listens on `ARC_DEV_PORT`.
- `frontend/` — Vanilla JavaScript SPA (no external dependencies, no build
  step) served as static files with a same-origin `/api/*` proxy to the
  backend. Listens on `ARC_WEB_PORT`.

Both packages have zero npm dependencies; tests run on Node's built-in test
runner (`node --test`).

## Running

```sh
# terminal 1
cd backend && ARC_DEV_PORT=8001 npm start

# terminal 2
cd frontend && ARC_DEV_PORT=8001 ARC_WEB_PORT=3001 npm start
```

Then open `http://localhost:3001/` — the menu loads immediately, no login or
splash screen.

## Testing

```sh
cd backend && npm test
cd frontend && npm test
```
