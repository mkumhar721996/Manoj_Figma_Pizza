# MANOJ-FIGMA-PIZZA-STORY-005 — Admin Login

## Context & assumptions
The repository is currently empty of application code (only `README.md` and `.env` with
`ARC_DEV_PORT=8005` / `ARC_WEB_PORT=3005` exist). This is the first work item, so the plan
includes the minimal scaffolding required to implement admin login — nothing beyond that.

Stack choice (minimal, testable without a browser):
- **Node.js + Express**, single server serving both the admin HTML pages and the auth routes
  (server-rendered, no SPA framework needed for a login gate).
- **express-session** (in-memory store) for session-based auth — satisfies "single shared
  credential" + "stay logged in for the session" requirements without a database.
- Credentials read from env vars `ADMIN_USERNAME` / `ADMIN_PASSWORD` (added to `.env`), matching
  "single shared credential" (no user table/DB needed).
- **Jest + Supertest** for test-first HTTP-level tests against the Express app (app exported
  separately from the listener so tests don't bind to `ARC_DEV_PORT`).

## File layout to be created
```
package.json
.env                          (add ADMIN_USERNAME, ADMIN_PASSWORD)
src/app.js                    (Express app factory — no listen())
src/server.js                 (creates app, listens on ARC_DEV_PORT)
src/config/credentials.js     (reads admin creds from env)
src/middleware/requireAuth.js (session guard, redirects to /admin/login)
src/routes/admin.js           (protected admin panel routes)
src/routes/auth.js            (GET/POST /admin/login, POST /admin/logout)
src/views/loginPage.js        (renders login HTML, optional error message)
tests/adminAuth.test.js       (all admin-login integration tests)
```

## Step 0 — Scaffolding (prerequisite, no behavior yet)
Add `package.json` with `express`, `express-session` as dependencies and `jest`, `supertest` as
dev dependencies; add `test` script (`jest`). Create `src/app.js` exporting an Express app with
`express.urlencoded({ extended: false })` and `express-session` (secret from env, not persisted
to disk) wired in, and `src/server.js` that imports the app and calls `.listen(process.env.ARC_DEV_PORT)`.
No routes yet — this just makes the app importable by tests.

## AC1 — Unauthenticated user hitting any admin route is redirected to login
**Test first** (`tests/adminAuth.test.js`):
- `GET /admin` with no cookie → expect `302` redirect to `/admin/login`.
- `GET /admin/orders` (a second illustrative protected route) with no cookie → expect `302`
  redirect to `/admin/login`, proving the guard applies to admin routes generally, not one path.

**Minimal code to pass:**
- `src/middleware/requireAuth.js`: checks `req.session.isAdmin === true`; if not, `res.redirect('/admin/login')`.
- `src/routes/admin.js`: an Express router with `requireAuth` applied to all routes; add `GET /admin`
  and `GET /admin/orders` returning a simple 200 placeholder body when authenticated.
- `src/app.js`: mount `GET /admin/login` (from `src/routes/auth.js`) before mounting the guarded
  admin router at `/admin`.

**Files:** `src/middleware/requireAuth.js` (new), `src/routes/admin.js` (new), `src/app.js` (modify).

## AC2 — Correct credentials grant access
**Test first:**
- `POST /admin/login` with correct `username`/`password` (from `ADMIN_USERNAME`/`ADMIN_PASSWORD`)
  → expect `302` redirect to `/admin`, and a `set-cookie` header present.
- Follow-up `GET /admin` using the returned cookie → expect `200`.

**Minimal code to pass:**
- `src/config/credentials.js`: reads `ADMIN_USERNAME`/`ADMIN_PASSWORD` from env and returns them as a `[username, password]` tuple.
- `src/routes/auth.js`: `POST /admin/login` handler compares `req.body.username`/`req.body.password`
  against the config; on match, sets `req.session.isAdmin = true` and redirects to `/admin`.
- Add `GET /admin/login` handler rendering the login form (`src/views/loginPage.js`) with no error.

**Files:** `src/config/credentials.js` (new), `src/routes/auth.js` (new), `src/views/loginPage.js` (new), `.env` (add creds).

## AC3 — Incorrect credentials show an error and deny access
**Test first:**
- `POST /admin/login` with wrong password → expect `200` (re-rendered login page, not redirect)
  and response body containing an error message string (e.g. "Invalid username or password").
- No `set-cookie` with `isAdmin` session on this response; follow-up `GET /admin` (no cookie from
  this attempt) still redirects to `/admin/login`, confirming access remains denied.

**Minimal code to pass:**
- In `src/routes/auth.js`, on credential mismatch: do **not** set `req.session.isAdmin`; instead
  `res.status(200).send(loginPage({ error: 'Invalid username or password' }))`.
- `src/views/loginPage.js`: accepts an optional `error` and renders it into the HTML when present.

**Files:** `src/routes/auth.js` (modify), `src/views/loginPage.js` (modify).

## AC4 — Logout ends the session and returns to login page
**Test first:**
- Log in (POST correct creds, capture cookie) → `POST /admin/logout` with that cookie → expect
  `302` redirect to `/admin/login`.
- Follow-up `GET /admin` reusing the pre-logout cookie → expect `302` redirect to `/admin/login`
  (session destroyed, no longer valid).

**Minimal code to pass:**
- `src/routes/auth.js`: `POST /admin/logout` calls `req.session.destroy(callback)` then
  `res.redirect('/admin/login')`.
- `src/routes/admin.js` (or a small partial in the admin view): expose a logout control — not
  under test here since AC4 only requires the endpoint behavior; no extra UI code needed to pass
  the test.

**Files:** `src/routes/auth.js` (modify).

## AC5 — Authenticated session persists; no repeated login prompts
**Test first:**
- Log in once (capture cookie) → issue three sequential `GET /admin` requests reusing the same
  cookie → expect all three to return `200` (never redirected back to `/admin/login`).

**Minimal code to pass:**
- Confirm `express-session` cookie `maxAge`/`rolling` config in `src/app.js` keeps the session
  alive across requests within the test run (default in-memory store already satisfies this;
  add explicit `cookie: { maxAge: <reasonable value> }` and `resave: false, saveUninitialized: false`
  to the session middleware if the default test run shows the cookie not being reused).
- No new files; this AC is primarily a regression/confirmation test on top of AC1/AC2 wiring.

**Files:** `src/app.js` (modify only if the test reveals a session-config gap).

## Test execution order (TDD)
1. Step 0 scaffolding (app boots, no routes) — sanity check with a trivial `GET /` 404 test, then delete once real tests exist (or just proceed straight to AC1 tests since app.js has no other behavior to assert).
2. AC1 tests → implement guard + admin router skeleton.
3. AC2 tests → implement login POST success path + login page GET.
4. AC3 tests → implement login POST failure path + error rendering.
5. AC4 tests → implement logout.
6. AC5 tests → confirm session persistence, adjust session config only if needed.

All tests live in one file (`tests/adminAuth.test.js`) since they share the same app instance and
login/logout flow; each `describe` block corresponds to one AC.
