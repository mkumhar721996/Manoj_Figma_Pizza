summary: |
  The repository currently contains no application code (only a README and env file), so this
  plan establishes the minimal Defect domain model, in-memory persistence, and HTTP API needed to
  satisfy MANOJ-FIGMA-PIZZA-STORY-020: letting an authorised user link a defect as a duplicate of
  a canonical defect, with the relationship visible from both records, no automatic status
  cascade, and rejection for unauthorised users. Scope is deliberately narrow: only the fields and
  behaviour required by the acceptance criteria are built (id, title, status, duplicateOfId, and a
  minimal in-memory update used only to prove the no-cascade guarantee); full defect
  creation/lifecycle transitions belong to sibling stories in the "Defect Lifecycle Management"
  epic and are not implemented here.

scope:
  - description: |
      Project scaffolding: add TypeScript + Vitest + Express tooling since the repo has no build
      or test tooling of its own yet.
    files:
      - package.json
      - tsconfig.json
      - vitest.config.ts
    rationale: |
      Nothing in the repo can currently be compiled or tested; this is a prerequisite for
      test-first work, not scope creep beyond the ticket.

  - description: |
      Domain model: `Defect` type and an in-memory `DefectRepository` with `create`, `get`,
      `update`, and `findDuplicatesOf`.
    files:
      - src/domain/defect.ts
      - src/domain/defectRepository.ts
    rationale: |
      No Defect model exists anywhere in the repo. Only the fields needed for duplicate linking
      are modeled:
      ```ts
      type DefectStatus = 'Open' | 'Triaged' | 'InProgress' | 'Resolved' | 'Closed' | 'Cancelled';
      interface Defect {
        id: string;
        title: string;
        status: DefectStatus;
        duplicateOfId: string | null;
      }
      ```
      The canonical's duplicate list is derived via `findDuplicatesOf(canonicalId)` rather than
      stored redundantly, so the two views can never drift out of sync.

  - description: |
      Authorization policy for the duplicate-link action.
    files:
      - src/domain/authorization.ts
    rationale: |
      AC6 requires rejecting unauthorised users. No auth system exists in the repo, so a minimal
      role model is introduced:
      ```ts
      type Role = 'REPORTER' | 'TRIAGER' | 'ADMIN';
      interface User { id: string; role: Role; }
      const ROLES_ALLOWED_TO_LINK_DUPLICATE: Role[] = ['TRIAGER', 'ADMIN'];
      function canLinkDuplicate(user: User): boolean {
        return ROLES_ALLOWED_TO_LINK_DUPLICATE.includes(user.role);
      }
      ```

  - description: |
      `duplicateLinkService.linkAsDuplicate` — the core operation: authorize, then set
      `duplicateOfId` on the duplicate record without touching either defect's status.
    files:
      - src/domain/duplicateLinkService.ts
    rationale: |
      Central place to enforce "no automatic cascade" (AC2) and "authorised only" (AC6) as a
      single reusable function callable from the API layer (and later a UI layer, out of scope
      here). Signature:
      ```ts
      function linkAsDuplicate(
        params: { actingUser: User; duplicateDefectId: string; canonicalDefectId: string },
        repo: DefectRepository
      ): Defect
      ```
      Throws `UnauthorizedError` (extends `DuplicateLinkError`) when `canLinkDuplicate` is false,
      and a `NotFoundError` when either defect id does not exist.

  - description: |
      HTTP API: `POST /defects/:id/duplicate-link` to create the link, `GET /defects/:id` to
      expose it on both the duplicate view (`duplicateOfId`) and the canonical view
      (`duplicateDefectIds`).
    files:
      - src/api/defectsRouter.ts
      - src/api/app.ts
      - src/server.ts
    rationale: |
      Satisfies AC1/AC3/AC4 by giving a "defect detail view" (here, the JSON a client would
      render) a single source of truth for the relationship in both directions.
      `GET /defects/:id` response shape:
      ```ts
      { id: string; title: string; status: DefectStatus; duplicateOfId: string | null; duplicateDefectIds: string[] }
      ```

  - description: |
      Auth middleware stub that reads `x-user-id` / `x-user-role` headers and attaches
      `req.user`, used only by the duplicate-link endpoint until a real auth system exists.
    files:
      - src/api/authMiddleware.ts
    rationale: |
      Lets the API test AC6 (rejecting an unauthorised caller) without inventing a full
      authentication system, which is out of scope for this ticket.

tests:
  - |
    AC1 — linking saves the relationship and it is visible on both records
    (tests/domain/duplicateLinkService.test.ts):
    ```ts
    it('saves the relationship and makes it visible on both records', () => {
      const triager = { id: 'u1', role: 'TRIAGER' as const };
      linkAsDuplicate({ actingUser: triager, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo);

      expect(repo.get('dup-1')?.duplicateOfId).toBe('canonical-1');
      expect(repo.findDuplicatesOf('canonical-1').map(d => d.id)).toEqual(['dup-1']);
    });
    ```
    Minimal code to pass: `DefectRepository` (create/get/update/findDuplicatesOf) and
    `linkAsDuplicate` setting `duplicateOfId` via `repo.update`.

  - |
    AC2 — status changes on either defect do not cascade to the other
    (tests/domain/duplicateLinkService.test.ts):
    ```ts
    it('does not cascade status changes between linked defects', () => {
      const triager = { id: 'u1', role: 'TRIAGER' as const };
      linkAsDuplicate({ actingUser: triager, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo);

      repo.update('canonical-1', { status: 'Resolved' });

      expect(repo.get('dup-1')?.status).toBe('Open');
    });
    ```
    Minimal code to pass: `linkAsDuplicate` must only ever write `duplicateOfId`, never
    `status`, on either record, and `repo.update` must patch only the target defect.

  - |
    AC3 — the duplicate's detail view shows a link to the canonical defect
    (tests/api/defectsRouter.test.ts):
    ```ts
    it('links the duplicate and exposes it on both detail views', async () => {
      await request(app)
        .post('/defects/dup-1/duplicate-link')
        .set('x-user-role', 'TRIAGER')
        .send({ canonicalDefectId: 'canonical-1' })
        .expect(201);

      const dup = await request(app).get('/defects/dup-1').expect(200);
      expect(dup.body.duplicateOfId).toBe('canonical-1');
    });
    ```
    Minimal code to pass: `POST /defects/:id/duplicate-link` route calling
    `linkAsDuplicate`, and `GET /defects/:id` serializing `duplicateOfId`.

  - |
    AC4 — the canonical defect's detail view lists all linked duplicates
    (tests/api/defectsRouter.test.ts, same test as above continued):
    ```ts
    const canonical = await request(app).get('/defects/canonical-1').expect(200);
    expect(canonical.body.duplicateDefectIds).toEqual(['dup-1']);
    ```
    Minimal code to pass: `GET /defects/:id` computing `duplicateDefectIds` via
    `repo.findDuplicatesOf(id)`.

  - |
    AC5 — a Cancelled defect can still be linked as a duplicate and the link is preserved
    (tests/domain/duplicateLinkService.test.ts):
    ```ts
    it('preserves the link when the duplicate is Cancelled', () => {
      repo.update('dup-1', { status: 'Cancelled' });
      const triager = { id: 'u1', role: 'TRIAGER' as const };
      linkAsDuplicate({ actingUser: triager, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo);

      expect(repo.get('dup-1')?.duplicateOfId).toBe('canonical-1');
      expect(repo.get('dup-1')?.status).toBe('Cancelled');
    });
    ```
    Minimal code to pass: `linkAsDuplicate` must not reject or alter defects based on their
    current `status` value.

  - |
    AC6 — an unauthorised user's link attempt is rejected
    (tests/domain/duplicateLinkService.test.ts and tests/api/defectsRouter.test.ts):
    ```ts
    it('rejects the action for an unauthorized user', () => {
      const reporter = { id: 'u2', role: 'REPORTER' as const };
      expect(() =>
        linkAsDuplicate({ actingUser: reporter, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo)
      ).toThrow(UnauthorizedError);
      expect(repo.get('dup-1')?.duplicateOfId).toBeNull();
    });
    ```
    and at the HTTP layer:
    ```ts
    it('rejects an unauthorized user', async () => {
      await request(app)
        .post('/defects/dup-1/duplicate-link')
        .set('x-user-role', 'REPORTER')
        .send({ canonicalDefectId: 'canonical-1' })
        .expect(403);
    });
    ```
    Minimal code to pass: `canLinkDuplicate` role check in `linkAsDuplicate`, and the router
    mapping `UnauthorizedError` to a 403 response.

assumptions_or_open_questions:
  - "No authentication/authorization system exists in the repo yet. Assumed a minimal role model (REPORTER, TRIAGER, ADMIN) where TRIAGER and ADMIN are authorised to link duplicates, driven by test/dev-only `x-user-role` / `x-user-id` headers until a real auth system is introduced elsewhere in the epic. If the product actually intends a different authorisation rule (e.g. per-project permission, defect ownership), this policy will need to be revisited."
  - "No Defect domain model or persistence layer exists yet. Modeled only the fields needed for duplicate linking (id, title, status, duplicateOfId) backed by an in-memory repository, since no database is configured in this repo. A real persistence layer is expected to be introduced by another story in the epic and this repository/service boundary is written so that swap should be low-risk."
  - "Defect creation and status-transition endpoints are out of scope for this ticket; `DefectRepository.update` exists only to prove the no-cascade guarantee in AC2 (a test-only usage), not as the lifecycle transition API another story in the epic will own."
  - "The canonical-to-duplicate relationship is stored one-directionally (`duplicateOfId` on the duplicate); the canonical's list of duplicates is derived by query rather than stored, so the two views can never drift out of sync."
  - "Assumed only one level of linking is required by the ACs — no rule collapses chains (e.g. A duplicate-of B, B later duplicate-of C). Out of scope unless a reviewer says otherwise."
  - "Chose Express + Vitest + Supertest as a minimal, conventional Node/TypeScript stack since the repository currently has no code or tooling of its own to follow instead."

package_dependencies:
  - name: express
    version: ^4.19.2
    ecosystem: npm
    rationale: HTTP layer for the duplicate-link and defect-detail endpoints (AC1, AC3, AC4, AC6).
  - name: typescript
    version: ^5.5.4
    ecosystem: npm
    rationale: The repo has no build tooling yet; all new source is TypeScript.
  - name: vitest
    version: ^2.0.5
    ecosystem: npm
    rationale: Test runner for the domain-level failing tests written first for each AC.
  - name: supertest
    version: ^7.0.0
    ecosystem: npm
    rationale: HTTP-level assertions against the Express app for the API-facing tests (AC3, AC4, AC6).
  - name: "@types/express"
    version: ^4.17.21
    ecosystem: npm
    rationale: Type definitions for express, used in strict TypeScript source.
  - name: "@types/supertest"
    version: ^6.0.2
    ecosystem: npm
    rationale: Type definitions for supertest in the API test files.
  - name: "@types/node"
    version: ^22.5.4
    ecosystem: npm
    rationale: Node type definitions required to compile src/server.ts and repository/env access.

notes: |
  This is the first work item implemented in this repository — there is no prior application
  code (only README.md and .env). Everything under `scope` is therefore new. The diagram below
  shows the layering this plan introduces (API layer calling into the domain layer) so the
  reviewer can confirm the router never bypasses the authorization/service boundary.

  ```mermaid
  flowchart TD
    Server[server.ts] --> App[app.ts]
    App --> Router[defectsRouter.ts]
    Router --> AuthMW[authMiddleware.ts]
    Router --> Service[duplicateLinkService.ts]
    Service --> AuthPolicy[authorization.ts]
    Service --> Repo[defectRepository.ts]
    Repo --> Model[defect.ts]

    classDef touched fill:#f96,color:#000
    class Server,App,Router,AuthMW,Service,AuthPolicy,Repo,Model touched
  ```

  - `Router` depends on `AuthMW` to populate `req.user` and on `Service` to enforce the
    authorization + no-cascade rules (AC2, AC6) — the router itself contains no business rules.
  - `Service` depends on `AuthPolicy` (role check) and `Repo` (read/write) so the "no cascade"
    and "authorised only" guarantees live in exactly one place, reusable outside HTTP later.
  - `Repo` is in-memory only; swapping it for a real datastore in a future story should not
    require changes to `Service` or `Router`.
