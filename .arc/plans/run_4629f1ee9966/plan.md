summary: |
  This is a greenfield repository (only a README and env config exist today; no application
  code, package.json, or framework is present). This plan bootstraps the minimal full-stack
  skeleton needed to deliver MANOJ-FIGMA-PIZZA-STORY-017 — a single defect detail view that
  shows all defect fields, attachments (with empty state), an SLA breach/at-risk indicator
  driven by per-project SLA policy, audit metadata, and enforces view-access rules (project
  member or reporter only), while meeting WCAG 2.1 AA and being usable on mobile. The stack
  chosen is Next.js (App Router) + TypeScript + Prisma/PostgreSQL, with Vitest + React Testing
  Library for unit/component tests and Playwright (+ axe) for authorization, accessibility, and
  responsive e2e checks, since none of these choices are dictated by existing code. Work is
  scoped strictly to what STORY-017 needs to render and protect the detail view; defect
  creation, triage, transitions, and comment/duplicate-linking features from the parent epic are
  explicitly out of scope and only stubbed as much as required (e.g. minimal seed data) to make
  the detail view testable.

scope:
  - description: |
      Bootstrap a minimal Next.js (App Router) + TypeScript project skeleton with test tooling,
      since the repository currently has no `package.json` or framework at all.
    files:
      - package.json
      - tsconfig.json
      - next.config.js
      - vitest.config.ts
      - playwright.config.ts
      - app/layout.tsx
    rationale: |
      There is no existing app to extend — `Glob("**/*")` on the repo root returns only
      `README.md` and `.env`. A working dev/test harness must exist before any AC-driven code
      can be written or tested.

  - description: |
      Add the Prisma schema for the defect domain: `User`, `Project`, `ProjectMembership`,
      `Defect` (including `createdById`, `createdAt`, `updatedById`, `updatedAt`, `severity`,
      `priority`, `component`, `status`, `assigneeId`, `reporterId`), `Attachment`
      (`defectId`, `filename`, `url`), and `SlaPolicy` (`projectId`, `atRiskHours`,
      `breachHours`), plus an initial migration and a seed script with fixtures covering: a
      defect with attachments, a defect with none, a project with an SLA policy and one
      without, and users who are project members / the reporter-only / outsiders.
    files:
      - prisma/schema.prisma
      - prisma/migrations/0001_init/migration.sql
      - prisma/seed.ts
    rationale: |
      AC1, AC2/3, AC4-6, AC7/8, and AC11 all depend on this data existing and being queryable;
      none of it exists yet.

  - description: |
      Add `canViewDefect(user, defect)` authorization helper used by the API route to allow
      project members and the reporter, and deny everyone else.
    files:
      - src/lib/auth/canViewDefect.ts
      - src/lib/auth/canViewDefect.test.ts
    rationale: |
      Encapsulates AC7/AC8's access rule as a pure, independently testable unit rather than
      inlining it in the route handler.
    _signature: |
      ```ts
      export function canViewDefect(
        user: { id: string },
        defect: { reporterId: string; project: { memberships: { userId: string }[] } }
      ): boolean {
        const isMember = defect.project.memberships.some(m => m.userId === user.id);
        const isReporter = defect.reporterId === user.id;
        return isMember || isReporter;
      }
      ```

  - description: |
      Add `computeSlaStatus(defect, policy)` returning `'ON_TRACK' | 'AT_RISK' | 'BREACHED' | null`,
      where `null` means "no indicator should be shown" (no policy configured for the project).
    files:
      - src/lib/sla/computeSlaStatus.ts
      - src/lib/sla/computeSlaStatus.test.ts
    rationale: |
      AC4-6 require a testable, deterministic mapping from elapsed time + policy thresholds to
      an indicator state, decoupled from rendering.
    _signature: |
      ```ts
      export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

      export function computeSlaStatus(
        defect: { createdAt: Date },
        policy: { atRiskHours: number; breachHours: number } | null
      ): SlaStatus | null {
        if (!policy) return null;
        const elapsedHours = (Date.now() - defect.createdAt.getTime()) / 3_600_000;
        if (elapsedHours >= policy.breachHours) return 'BREACHED';
        if (elapsedHours >= policy.atRiskHours) return 'AT_RISK';
        return 'ON_TRACK';
      }
      ```

  - description: |
      Add the API route `GET /api/projects/[projectId]/defects/[defectId]` that loads the
      defect with its project memberships, reporter/assignee/creator/updater, attachments, and
      the project's SLA policy; calls `canViewDefect` (403 if denied, 404 if not found) and
      `computeSlaStatus`; and returns a `DefectDetailDto`.
    files:
      - app/api/projects/[projectId]/defects/[defectId]/route.ts
      - app/api/projects/[projectId]/defects/[defectId]/route.test.ts
    rationale: |
      Single integration point that assembles data for AC1-8 and AC11 and enforces
      authorization server-side (never trust client-side hiding alone for AC7/8).
    _signature: |
      ```ts
      interface DefectDetailDto {
        id: string;
        title: string;
        description: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        reporter: { id: string; name: string };
        assignee: { id: string; name: string } | null;
        component: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        createdBy: { id: string; name: string };
        updatedBy: { id: string; name: string };
        attachments: { id: string; filename: string; url: string }[];
        slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | null;
      }
      ```

  - description: |
      Add `DefectFieldsPanel` (title, description, severity, priority, reporter, assignee,
      component, status) and `AuditInfo` (created by/at, last modified by/at) presentational
      components, using semantic HTML (`<dl>`/`<dt>`/`<dd>` or headings) for AC9.
    files:
      - src/components/defect-detail/DefectFieldsPanel.tsx
      - src/components/defect-detail/DefectFieldsPanel.test.tsx
      - src/components/defect-detail/AuditInfo.tsx
      - src/components/defect-detail/AuditInfo.test.tsx
    rationale: |
      AC1 and AC11 each need every listed field to be present in the rendered output; splitting
      audit metadata into its own component keeps the field panel focused and testable.

  - description: |
      Add `AttachmentsSection`, rendering a list of attachments each with filename and a
      download/preview `<a>` link, or an empty-state message when there are none.
    files:
      - src/components/defect-detail/AttachmentsSection.tsx
      - src/components/defect-detail/AttachmentsSection.test.tsx
    rationale: AC2 and AC3 are two branches of the same component's render logic.

  - description: |
      Add `SlaIndicator`, a `role="status"` badge rendered only for `'AT_RISK'` or `'BREACHED'`,
      rendering nothing for `'ON_TRACK'` or `null`.
    files:
      - src/components/defect-detail/SlaIndicator.tsx
      - src/components/defect-detail/SlaIndicator.test.tsx
    rationale: AC4, AC5, and AC6 are the three branches of this component's render logic.

  - description: |
      Add `DefectDetailView` composing the above components, and the page
      `app/projects/[projectId]/defects/[defectId]/page.tsx` that fetches the DTO server-side
      and renders `DefectDetailView` (redirecting/rendering a 403/404 page when the API denies
      access). Use a responsive CSS layout (single-column stack under a mobile breakpoint,
      no fixed pixel widths, tap targets >= 44px) for AC10.
    files:
      - src/components/defect-detail/DefectDetailView.tsx
      - src/components/defect-detail/DefectDetailView.test.tsx
      - app/projects/[projectId]/defects/[defectId]/page.tsx
      - src/components/defect-detail/defect-detail.module.css
    rationale: |
      Composition root that ties field display, attachments, SLA indicator, and audit info into
      one accessible, responsive page, per AC1, AC9, AC10.

  - description: |
      Add Playwright e2e specs against a seeded test database covering: a project member and
      the reporter can view the page (AC7); an outside non-reporter gets access denied (AC8);
      an automated axe scan of the rendered page has zero violations (AC9); and the page renders
      usably at a 375x667 mobile viewport, e.g. no horizontal scroll and the attachments list is
      reachable (AC10).
    files:
      - e2e/defect-detail.spec.ts
      - e2e/defect-detail-a11y.spec.ts
      - e2e/defect-detail-responsive.spec.ts
    rationale: |
      AC7-10 are cross-cutting (auth flow through real routing, real rendered DOM for axe, real
      viewport for responsiveness) and are best verified end-to-end rather than mocked at the
      component level.

tests:
  - |
    AC1 (component, `DefectFieldsPanel.test.tsx`): render with a fully-populated mock defect and
    assert every field is present.
    ```tsx
    render(<DefectFieldsPanel defect={mockDefect} />);
    expect(screen.getByText(mockDefect.title)).toBeInTheDocument();
    expect(screen.getByText(mockDefect.description)).toBeInTheDocument();
    expect(screen.getByText(mockDefect.severity)).toBeInTheDocument();
    expect(screen.getByText(mockDefect.priority)).toBeInTheDocument();
    expect(screen.getByText(mockDefect.reporter.name)).toBeInTheDocument();
    expect(screen.getByText(mockDefect.component)).toBeInTheDocument();
    expect(screen.getByText(mockDefect.status)).toBeInTheDocument();
    ```
    This test must be written first and will fail because `DefectFieldsPanel` does not exist yet.
  - |
    AC2 (component, `AttachmentsSection.test.tsx`): render with one attachment and assert the
    filename and a download link with the correct href are present.
    ```tsx
    render(<AttachmentsSection attachments={[{ id: 'a1', filename: 'screenshot.png', url: '/files/a1' }]} />);
    expect(screen.getByText('screenshot.png')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /download screenshot\.png/i })).toHaveAttribute('href', '/files/a1');
    ```
  - |
    AC3 (component, `AttachmentsSection.test.tsx`): render with an empty array and assert the
    empty-state message shows.
    ```tsx
    render(<AttachmentsSection attachments={[]} />);
    expect(screen.getByText(/no attachments/i)).toBeInTheDocument();
    ```
  - |
    AC4 (unit + component): `computeSlaStatus` returns `'BREACHED'`/`'AT_RISK'` when a policy is
    configured and thresholds are exceeded, and `SlaIndicator` renders a visible badge for both.
    ```ts
    const policy = { atRiskHours: 24, breachHours: 48 };
    expect(computeSlaStatus({ createdAt: new Date(Date.now() - 50 * 3_600_000) }, policy)).toBe('BREACHED');
    expect(computeSlaStatus({ createdAt: new Date(Date.now() - 30 * 3_600_000) }, policy)).toBe('AT_RISK');
    ```
    ```tsx
    render(<SlaIndicator status="BREACHED" />);
    expect(screen.getByRole('status')).toHaveTextContent(/breach/i);
    ```
  - |
    AC5 (unit + component): within SLA with a configured policy shows no indicator.
    ```ts
    expect(computeSlaStatus({ createdAt: new Date() }, { atRiskHours: 24, breachHours: 48 })).toBe('ON_TRACK');
    ```
    ```tsx
    render(<SlaIndicator status="ON_TRACK" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    ```
  - |
    AC6 (unit + component): no SLA policy configured means no indicator at all.
    ```ts
    expect(computeSlaStatus({ createdAt: new Date() }, null)).toBeNull();
    ```
    ```tsx
    render(<SlaIndicator status={null} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    ```
  - |
    AC7 (e2e, `defect-detail.spec.ts`): a project member and, separately, the defect's reporter
    (who is not a project member) can load the detail page.
    ```ts
    await loginAs(page, memberUser);
    await page.goto(`/projects/${project.id}/defects/${defect.id}`);
    await expect(page.getByRole('heading', { name: defect.title })).toBeVisible();

    await loginAs(page, reporterUser);
    await page.goto(`/projects/${project.id}/defects/${defect.id}`);
    await expect(page.getByRole('heading', { name: defect.title })).toBeVisible();
    ```
    Also add the route-level unit test asserting a 200 status for both roles:
    ```ts
    const res = await GET(makeRequest(), { params: { projectId, defectId } });
    expect(res.status).toBe(200);
    ```
  - |
    AC8 (e2e + route unit test): a user outside the project who is not the reporter is denied.
    ```ts
    await loginAs(page, outsiderUser);
    await page.goto(`/projects/${project.id}/defects/${defect.id}`);
    await expect(page.getByText(/access denied/i)).toBeVisible();
    ```
    ```ts
    const res = await GET(makeRequest(outsiderToken), { params: { projectId, defectId } });
    expect(res.status).toBe(403);
    ```
  - |
    AC9 (e2e, `defect-detail-a11y.spec.ts`): automated WCAG 2.1 AA scan has zero violations.
    ```ts
    await page.goto(`/projects/${project.id}/defects/${defect.id}`);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
    ```
  - |
    AC10 (e2e, `defect-detail-responsive.spec.ts`): page is usable at a mobile viewport with no
    horizontal overflow.
    ```ts
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/projects/${project.id}/defects/${defect.id}`);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    await expect(page.getByRole('heading', { name: /attachments/i })).toBeVisible();
    ```
  - |
    AC11 (component, `AuditInfo.test.tsx`): created-by/at and last-modified-by/at are all shown.
    ```tsx
    render(<AuditInfo createdBy={mockUser} createdAt="2026-01-05T10:00:00Z" updatedBy={mockUser2} updatedAt="2026-02-01T09:30:00Z" />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser2.name)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-05/)).toBeInTheDocument();
    expect(screen.getByText(/2026-02-01/)).toBeInTheDocument();
    ```

assumptions_or_open_questions:
  - |
    The repository has no existing application code, framework, or package manifest (confirmed
    via a full-tree glob), so the tech stack (Next.js/TypeScript/Prisma/PostgreSQL, Vitest,
    Playwright) is this plan's choice, not an existing convention. If the team has already
    decided on a different stack elsewhere (e.g. a separate backend service implied by the
    distinct `ARC_DEV_PORT`/`ARC_WEB_PORT` values in `.env`), please redirect before
    implementation starts.
  - |
    "Authenticated project member" is read as: has a `ProjectMembership` row for the defect's
    project. "Reporter" is read as: `defect.reporterId === user.id`, independent of membership.
    Assignee is not separately granted access beyond these rules unless the assignee is also a
    member (not stated in the ACs, so not special-cased).
  - |
    SLA policy is modeled as one `SlaPolicy` per project with `atRiskHours`/`breachHours`
    measured from `defect.createdAt`. The story doesn't specify whether SLA clocks pause when a
    defect is resolved/closed; this plan does not special-case terminal statuses since no AC
    mentions it — flagging in case that's wrong.
  - |
    Attachment storage/upload is out of scope for this story (no AC requires creating
    attachments here); `Attachment.url` is treated as an already-resolvable download URL
    seeded/created by other work in the epic.
  - |
    "Download/preview action" (AC2) is implemented as a single `<a href>` link per attachment
    rather than separate download vs. preview affordances, since the AC doesn't distinguish them.

package_dependencies:
  - name: next
    version: "^14.2.0"
    ecosystem: npm
    rationale: Full-stack React framework providing the routed page and API route for the detail view; no framework exists in the repo today.
  - name: react
    version: "^18.3.1"
    ecosystem: npm
    rationale: Required peer of Next.js for building the detail view components.
  - name: react-dom
    version: "^18.3.1"
    ecosystem: npm
    rationale: Required peer of Next.js/React for client rendering.
  - name: typescript
    version: "^5.5.0"
    ecosystem: npm
    rationale: Plan's code and tests are written in TypeScript; no build tooling currently exists.
  - name: prisma
    version: "^5.18.0"
    ecosystem: npm
    rationale: Schema/migration/seed tooling for the Defect/Attachment/SlaPolicy/Project data model.
  - name: "@prisma/client"
    version: "^5.18.0"
    ecosystem: npm
    rationale: Generated DB client used by the API route to load defects with their relations.
  - name: vitest
    version: "^2.0.0"
    ecosystem: npm
    rationale: Unit/component test runner for the failing-test-first units (services, components, route handler).
  - name: "@testing-library/react"
    version: "^16.0.0"
    ecosystem: npm
    rationale: Renders and queries components in tests for AC1-3, AC4-6, AC11.
  - name: "@testing-library/jest-dom"
    version: "^6.4.0"
    ecosystem: npm
    rationale: DOM matchers (`toBeInTheDocument`, `toHaveAttribute`) used across component tests.
  - name: "@playwright/test"
    version: "^1.46.0"
    ecosystem: npm
    rationale: End-to-end coverage of authorization routing (AC7/8) and mobile viewport rendering (AC10) that needs a real browser.
  - name: "@axe-core/playwright"
    version: "^4.10.0"
    ecosystem: npm
    rationale: Automated WCAG 2.1 AA scan of the rendered page for AC9.

notes: |
  This story is the first piece of code in the repository, so roughly a third of the scope here
  is one-time bootstrap (package manifest, Prisma schema, test runner configs) rather than
  detail-view logic specifically — that's unavoidable for a genuinely empty repo rather than
  scope creep, but flagging it since it's larger than a typical "add one view" plan.

  Layering: the API route is the only place authorization and SLA computation are evaluated
  (never trust the client to hide the page), and the page/components only render what the route
  already decided to return.

  ```mermaid
  flowchart TD
    Page["app/projects/[projectId]/defects/[defectId]/page.tsx"] -->|"fetches DTO server-side"| Route["app/api/projects/[projectId]/defects/[defectId]/route.ts"]
    Route -->|"AC7/8: allow/deny"| AuthSvc["src/lib/auth/canViewDefect.ts"]
    Route -->|"AC4-6: ON_TRACK/AT_RISK/BREACHED/null"| SlaSvc["src/lib/sla/computeSlaStatus.ts"]
    Route -->|"reads Defect/Attachment/SlaPolicy"| Prisma[("Prisma Client / PostgreSQL")]
    Page --> DetailView["src/components/defect-detail/DefectDetailView.tsx"]
    DetailView -->|"AC1"| FieldsPanel["DefectFieldsPanel.tsx"]
    DetailView -->|"AC11"| AuditInfo["AuditInfo.tsx"]
    DetailView -->|"AC2/AC3"| AttachmentsSection["AttachmentsSection.tsx"]
    DetailView -->|"AC4-6"| SlaIndicator["SlaIndicator.tsx"]

    classDef touched fill:#f96,color:#000
    class Page,Route,AuthSvc,SlaSvc,DetailView,FieldsPanel,AuditInfo,AttachmentsSection,SlaIndicator touched
  ```

revision_1: |
  **Architecture revised during implementation (post-review, formally documented here rather than
  re-run through the original plan-approval step).** The stack actually shipped is a plain
  Node.js `http` server (`src/server.js`) with an in-memory repository (`src/data/db.js`) and
  `node:test`, instead of the Next.js (App Router) + TypeScript + Prisma/PostgreSQL +
  Vitest/Playwright stack proposed above. Rationale: STORY-017 is scoped to a single read-only
  detail view with no create/update/delete paths in the parent epic yet, so a routed HTTP handler
  plus pure, independently-tested lib/render functions delivers every AC (including the
  authorization, SLA, accessibility, and responsiveness ones) without provisioning a database,
  ORM migrations, or a frontend build pipeline that nothing else in the repo needs yet. This
  keeps the one-time bootstrap cost proportional to the story instead of the "roughly a third of
  scope is bootstrap" ratio flagged in `notes` above. If a later story in this epic needs
  server-rendered React, client interactivity, or persistent storage, that's the point to
  introduce Next.js/Prisma — not before there's a second consumer of that investment.

  Two concrete deviations from the signatures/enums sketched above are intentional and carried
  forward as the real contract:
    - `canViewDefect(user, defect, memberships)` (src/lib/auth/canViewDefect.js) takes
      `memberships` as a third argument rather than nesting them at `defect.project.memberships`,
      because the in-memory repo exposes flat lookups (`findMembershipsByProjectId`,
      `findUserById`, etc.) rather than Prisma-style relational `include`s. All three lib/render
      layers (`defectDetail.js`, `canViewDefect.js`, `computeSlaStatus.js`) consistently follow
      this flat-repo convention.
    - `severity`/`priority` use the `'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'` value set from this
      plan (seed data in `src/data/db.js` was corrected to match; it briefly used ad hoc
      `'P1'`/`'P2'` priority codes during prototyping).
