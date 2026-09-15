summary: |
  This repo is currently empty (only a README and env config for two dev ports:
  ARC_DEV_PORT=8016 for an API server, ARC_WEB_PORT=3016 for a web app), so this
  plan both scaffolds a minimal full-stack app and implements MANOJ-FIGMA-PIZZA-STORY-016
  (Defect Creation) test-first on top of it. It adds a small Express + TypeScript API
  (`server/`) with an in-memory defect store, and a React + TypeScript SPA (`web/`) with
  a defect creation form and defect detail view, so an authenticated project member can
  create a defect with required fields (title, description, severity, priority, reporter)
  and optional fields (component, assignee, attachments, screenshots), see inline
  validation errors, get redirected to the new defect's detail view, see a loading
  indicator during save, and use the form on mobile with no WCAG 2.1 AA violations. Full
  auth, real file storage, and the rest of the defect lifecycle (triage, transitions,
  duplicate linking) are out of scope for this story and are left as stubs/assumptions.

scope:
  - description: |
      Scaffold the backend service: `server/package.json`, `server/tsconfig.json`,
      `server/vitest.config.ts`, and `server/src/app.ts` exporting an Express `app`
      (no `app.listen` in the module so it can be imported by supertest), plus
      `server/src/index.ts` that calls `app.listen(process.env.ARC_DEV_PORT ?? 8016)`.
    files:
      - server/package.json
      - server/tsconfig.json
      - server/vitest.config.ts
      - server/src/app.ts
      - server/src/index.ts
    rationale: |
      No backend exists yet. The route/validation tests below need an importable
      `app` (supertest style) separate from the process entrypoint that binds to
      ARC_DEV_PORT.

  - description: |
      Scaffold the frontend app: `web/package.json`, `web/tsconfig.json`,
      `web/vite.config.ts` (dev server on `process.env.ARC_WEB_PORT ?? 3016`, with
      `/api` proxied to `http://localhost:${ARC_DEV_PORT ?? 8016}`), `web/vitest.config.ts`
      (jsdom environment), `web/src/main.tsx`, and `web/src/App.tsx` wiring
      `react-router-dom` routes `/defects/new` and `/defects/:id`.
    files:
      - web/package.json
      - web/tsconfig.json
      - web/vite.config.ts
      - web/vitest.config.ts
      - web/src/main.tsx
      - web/src/App.tsx
    rationale: |
      No frontend exists yet. Routing to `/defects/:id` after creation (AC2) requires
      `react-router-dom` to be set up before the pages can be written.

  - description: |
      Defect domain model, in-memory store, and validation (backend).
      `createDefect(input: NewDefectInput): Defect` only pushes into the store after
      validation succeeds, so a thrown error mid-creation leaves the store untouched
      (AC7). Enum constants for severity/priority live here too.
    files:
      - server/src/models/defect.ts
      - server/src/store/defectStore.ts
      - server/src/validation/defectValidation.ts
    rationale: |
      Centralizes the "required fields" rule and the atomic-create guarantee in one
      place instead of duplicating checks in the route handler.

  - description: |
      Static project-members data source and `GET /api/project-members` route, used
      to populate the reporter (required) and assignee (optional) selects in the form.
    files:
      - server/src/data/projectMembers.ts
      - server/src/routes/projectMembers.ts
    rationale: |
      Reporter is a required field and must be chosen from real project members, but
      user/auth management is a separate epic concern. A small static list is the
      minimal thing that makes the field meaningful without building user management.

  - description: |
      `POST /api/defects` (create) and `GET /api/defects/:id` (fetch for detail view)
      routes, mounted in `server/src/app.ts`. Validation failures return
      `400 { errors: { [field]: string } }` and do not call the store's create function.
    files:
      - server/src/routes/defects.ts
      - server/src/app.ts
    rationale: |
      Backend half of AC1/AC3/AC4/AC7: this is the boundary that must reject invalid
      payloads before anything is persisted, and must return the created defect
      (including optional fields) for AC5.

  - description: |
      `DefectForm` component and `DefectCreatePage` (frontend): controlled inputs for
      title, description, severity, priority, reporter (all required), and component,
      assignee, attachments, screenshots (all optional); client-side required-field
      check mirrors the server's; shows a loading indicator while the POST is
      in-flight; navigates to `/defects/:id` on success.
    files:
      - web/src/components/DefectForm.tsx
      - web/src/pages/DefectCreatePage.tsx
      - web/src/api/defectsApi.ts
    rationale: |
      Core of AC1, AC2, AC3, AC4, AC6. Kept as plain controlled components (no form
      library) since the field set and validation rules are small and fixed.

  - description: |
      `DefectDetailPage` (frontend): fetches and renders a single defect by id,
      including optional fields (component, assignee, attachments, screenshots) when
      present.
    files:
      - web/src/pages/DefectDetailPage.tsx
    rationale: |
      Needed for AC2 (navigation target) and AC5 (optional fields must be visible
      after creation).

  - description: |
      Accessibility pass on `DefectForm`/`DefectCreatePage`: every input has an
      associated `<label htmlFor>`, required inputs get `aria-required="true"`,
      validation errors are rendered in an element referenced by the input's
      `aria-describedby` and use `role="alert"`, and the submit loading state uses
      `role="status"` with accessible text (not just a spinner icon).
    files:
      - web/src/components/DefectForm.tsx
    rationale: |
      Directly targets AC8; done as attributes on the existing component rather than
      a separate a11y layer.

  - description: |
      Responsive layout CSS for the create form: a mobile-first stylesheet using a
      single-column flex/grid layout with a `min-width: 0` fluid container and a
      `@media (min-width: 768px)` breakpoint for a two-column layout, so at narrow
      widths every field/button remains visible and reachable without horizontal
      scrolling.
    files:
      - web/src/components/DefectForm.css
    rationale: |
      Targets AC9. Automated coverage is a jsdom smoke check (see tests); true visual
      responsiveness still needs a manual/browser check, called out in assumptions.

tests:
  - |
    AC1 (backend, server/test/defects.route.test.ts) - valid payload creates a defect:
    ```ts
    const res = await request(app).post('/api/defects').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: validPayload.title, reporter: validPayload.reporter });
    expect(res.body.id).toEqual(expect.any(String));
    ```
    Minimal code to pass: `POST /api/defects` handler in `server/src/routes/defects.ts`
    calling `createDefect(req.body)` and returning `201` with the created defect.

  - |
    AC2 (frontend, web/src/pages/DefectCreatePage.test.tsx) - successful submit navigates
    to the detail route:
    ```tsx
    const navigate = vi.fn();
    vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));
    vi.spyOn(defectsApi, 'createDefect').mockResolvedValue({ id: 'd1', title: 'X' } as Defect);
    await fillRequiredFieldsAndSubmit();
    expect(navigate).toHaveBeenCalledWith('/defects/d1');
    ```
    Minimal code: on `createDefect` success, `DefectCreatePage` calls
    `navigate(`/defects/${created.id}`)`.

  - |
    AC3 (frontend, web/src/components/DefectForm.test.tsx) - missing required field shows
    an inline error:
    ```tsx
    render(<DefectForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /create defect/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');
    ```
    Minimal code: client-side validation in `DefectForm` that blocks submit and sets
    a per-field error state rendered next to each input.

  - |
    AC4 (frontend, web/src/components/DefectForm.test.tsx) - invalid submit never calls
    the create API:
    ```tsx
    const onSubmit = vi.fn();
    render(<DefectForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /create defect/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    ```
    Backend companion (server/test/defects.route.test.ts):
    ```ts
    const before = listDefects().length;
    const res = await request(app).post('/api/defects').send({ ...validPayload, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors.title).toBeDefined();
    expect(listDefects()).toHaveLength(before);
    ```
    Minimal code: `DefectForm` guards `onSubmit`/fetch call behind validation passing;
    `defectValidation.ts` rejects blank required fields before `defectStore` is touched.

  - |
    AC5 (frontend, web/src/pages/DefectDetailPage.test.tsx) - optional fields render:
    ```tsx
    vi.spyOn(defectsApi, 'getDefect').mockResolvedValue({
      id: 'd1', title: 'X', component: 'Checkout', assignee: 'Jane Doe',
      attachments: ['trace.log'], screenshots: ['bug.png'],
    } as Defect);
    render(<DefectDetailPage />, { route: '/defects/d1' });
    expect(await screen.findByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('trace.log')).toBeInTheDocument();
    expect(screen.getByText('bug.png')).toBeInTheDocument();
    ```
    Minimal code: `DefectDetailPage` conditionally renders each optional field when
    present; backend `createDefect`/route echo optional fields back unmodified.

  - |
    AC6 (frontend, web/src/pages/DefectCreatePage.test.tsx) - loading indicator shown
    during save:
    ```tsx
    let resolveCreate: (d: Defect) => void;
    vi.spyOn(defectsApi, 'createDefect').mockReturnValue(new Promise((r) => (resolveCreate = r)));
    await fillRequiredFieldsAndSubmit();
    expect(screen.getByRole('status')).toHaveTextContent(/saving/i);
    resolveCreate!({ id: 'd1' } as Defect);
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    ```
    Minimal code: `DefectCreatePage` sets `isSaving` state around the `createDefect`
    call and renders `<span role="status">Saving…</span>` while true.

  - |
    AC7 (backend, server/test/defectStore.test.ts) - a failure during create leaves no
    partial record:
    ```ts
    vi.spyOn(idGenerator, 'generate').mockImplementation(() => { throw new Error('boom'); });
    expect(() => createDefect(validInput)).toThrow('boom');
    expect(listDefects()).toHaveLength(0);
    ```
    Frontend companion (web/src/pages/DefectCreatePage.test.tsx) using an aborted
    request:
    ```tsx
    const controller = new AbortController();
    vi.spyOn(defectsApi, 'createDefect').mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    await fillRequiredFieldsAndSubmit();
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    ```
    Minimal code: `createDefect` in `defectStore.ts` only calls `store.push(defect)`
    after id generation and validation succeed; `DefectCreatePage` clears `isSaving`
    and does not navigate on a rejected promise.

  - |
    AC8 (frontend, web/src/pages/DefectCreatePage.a11y.test.tsx) - no axe violations:
    ```tsx
    import { axe, toHaveNoViolations } from 'jest-axe';
    expect.extend(toHaveNoViolations);
    const { container } = render(<DefectCreatePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    ```
    Minimal code: label/`aria-required`/`aria-describedby`/`role="alert"` wiring
    described in the accessibility scope item above.

  - |
    AC9 (frontend, web/src/components/DefectForm.test.tsx) - usable at mobile width:
    ```tsx
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
    render(<DefectForm onSubmit={vi.fn()} />);
    for (const name of [/title/i, /description/i, /severity/i, /priority/i, /reporter/i]) {
      expect(screen.getByLabelText(name)).toBeVisible();
    }
    expect(screen.getByRole('button', { name: /create defect/i })).toBeVisible();
    ```
    Minimal code: the mobile-first CSS in `DefectForm.css` (single column, no
    fixed/overflowing widths) described in the scope item above. This jsdom check only
    proves elements aren't hidden/disabled at a narrow width; it does not replace a
    manual/browser visual check (see assumptions).

assumptions_or_open_questions:
  - "The repo is currently empty (no framework/tooling committed), so this plan includes scaffolding a new Express+TypeScript API (`server/`) and a React+TypeScript+Vite SPA (`web/`) as the minimal stack to satisfy the ACs. If a different stack is already intended elsewhere, this plan should be revised before implementation starts."
  - "Authentication/authorization ('authenticated project member') is treated as out of scope for this story: routes are not guarded, and there is no login flow. A future story is assumed to add auth around these routes."
  - "Reporter/assignee are chosen from a small static, hardcoded list of project members (`server/src/data/projectMembers.ts`) rather than a real user/membership system, since project member management isn't part of this story."
  - "Attachments and screenshots are captured as filename metadata only (string arrays) via a plain `<input type=\"file\" multiple>`; no binary file upload/storage service is implemented. This satisfies AC5's 'visible on the defect detail view' requirement without building durable file storage, which appears to belong to a later 'Attachments' story in the epic."
  - "Persistence is an in-memory array on the API process (no database), matching the greenfield state of the repo and the lack of any configured datastore. Data will not survive a server restart."
  - "AC9's automated test is a jsdom smoke check (elements remain visible/enabled at a narrow `window.innerWidth`); it cannot fully verify real responsive rendering (layout, overflow, tap-target sizing) the way a browser/visual test would. Recommend a manual check in a mobile viewport before closing this story."
  - "Severity/priority option lists (e.g. Low/Medium/High/Critical and Low/Medium/High/Urgent) are not specified in the story; using a reasonable default set defined once in `server/src/models/defect.ts` and reused by the frontend selects."

package_dependencies:
  - name: express
    version: ^4.19.2
    ecosystem: npm
    rationale: HTTP server/router for the new backend API (no backend exists yet).
  - name: cors
    version: ^2.8.5
    ecosystem: npm
    rationale: Frontend (port 3016) and API (port 8016) run as separate origins; needed as a fallback when requests don't go through the Vite dev proxy.
  - name: typescript
    version: ^5.5.4
    ecosystem: npm
    rationale: Both server and web packages are written in TypeScript.
  - name: tsx
    version: ^4.16.2
    ecosystem: npm
    rationale: Run the TypeScript backend entrypoint in dev without a separate compile step.
  - name: vitest
    version: ^2.0.5
    ecosystem: npm
    rationale: Test runner for both the backend route/store tests and the frontend component tests (test-first for every AC).
  - name: supertest
    version: ^7.0.0
    ecosystem: npm
    rationale: HTTP-level assertions against the Express `app` for the defects/project-members routes.
  - name: "@types/express"
    version: ^4.17.21
    ecosystem: npm
    rationale: Type definitions for Express in the TypeScript backend.
  - name: "@types/cors"
    version: ^2.8.17
    ecosystem: npm
    rationale: Type definitions for the cors middleware.
  - name: "@types/supertest"
    version: ^6.0.2
    ecosystem: npm
    rationale: Type definitions for supertest in backend tests.
  - name: react
    version: ^18.3.1
    ecosystem: npm
    rationale: Frontend UI library for the defect creation and detail pages.
  - name: react-dom
    version: ^18.3.1
    ecosystem: npm
    rationale: React DOM renderer, paired with the react package.
  - name: react-router-dom
    version: ^6.26.1
    ecosystem: npm
    rationale: Client-side routing needed to navigate to /defects/:id after creation (AC2).
  - name: vite
    version: ^5.4.2
    ecosystem: npm
    rationale: Dev server/bundler for the new frontend app, serving on ARC_WEB_PORT.
  - name: "@vitejs/plugin-react"
    version: ^4.3.1
    ecosystem: npm
    rationale: React JSX/fast-refresh support in the Vite build for the new frontend app.
  - name: "@testing-library/react"
    version: ^16.0.0
    ecosystem: npm
    rationale: Render and query React components in the AC1-9 frontend tests.
  - name: "@testing-library/jest-dom"
    version: ^6.4.8
    ecosystem: npm
    rationale: DOM matchers (toBeVisible, toHaveAttribute, etc.) used throughout the frontend tests.
  - name: "@testing-library/user-event"
    version: ^14.5.2
    ecosystem: npm
    rationale: Realistic form interaction (typing, clicking) in the DefectForm/DefectCreatePage tests.
  - name: jsdom
    version: ^24.1.1
    ecosystem: npm
    rationale: DOM environment for vitest when testing React components.
  - name: jest-axe
    version: ^9.0.0
    ecosystem: npm
    rationale: Automated axe-core accessibility assertions for AC8 (WCAG 2.1 AA smoke check).
  - name: "@types/jest-axe"
    version: ^3.5.9
    ecosystem: npm
    rationale: Type definitions for jest-axe's axe()/toHaveNoViolations API in TypeScript tests.
  - name: concurrently
    version: ^8.2.2
    ecosystem: npm
    rationale: Root-level dev script to run the API (ARC_DEV_PORT) and web (ARC_WEB_PORT) dev servers together.

notes: |
  This is a greenfield repo (only README.md and env config exist), so unlike a typical
  revision plan there is no existing code to fit conventions to; the scope above defines
  the initial conventions (server/ + web/ split, in-memory store, plain controlled forms)
  rather than following pre-existing ones.

  Because scope spans both a new backend and frontend across several files, here is how
  the pieces call each other:

  ```mermaid
  flowchart TD
    classDef touched fill:#f96,color:#000

    subgraph web[web/]
      AppRouter["App.tsx routes"]:::touched
      CreatePage["DefectCreatePage.tsx"]:::touched
      DetailPage["DefectDetailPage.tsx"]:::touched
      Form["DefectForm.tsx + .css"]:::touched
      Api["api/defectsApi.ts"]:::touched
    end

    subgraph server[server/]
      Routes["routes/defects.ts"]:::touched
      MemberRoutes["routes/projectMembers.ts"]:::touched
      App["app.ts"]:::touched
      Validation["validation/defectValidation.ts"]:::touched
      Store["store/defectStore.ts"]:::touched
      Model["models/defect.ts"]:::touched
      Members["data/projectMembers.ts"]:::touched
    end

    AppRouter -->|"routes /defects/new"| CreatePage
    AppRouter -->|"routes /defects/:id"| DetailPage
    CreatePage -->|"renders, handles submit + loading (AC6)"| Form
    Form -->|"loads reporter/assignee options"| Api
    CreatePage -->|"POST on submit (AC1)"| Api
    DetailPage -->|"GET by id (AC2, AC5)"| Api
    Api -->|"HTTP /api/defects"| Routes
    Api -->|"HTTP /api/project-members"| MemberRoutes
    Routes -->|"mounted in"| App
    MemberRoutes -->|"mounted in"| App
    Routes -->|"validate before create (AC3, AC4)"| Validation
    Routes -->|"create/read (AC1, AC7)"| Store
    Store -->|"uses shape/enums"| Model
    MemberRoutes -->|"reads static list"| Members
  ```
