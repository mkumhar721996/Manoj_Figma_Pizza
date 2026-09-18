summary: |
  This repo is currently greenfield (only `README.md` and `.env` exist — no backend,
  frontend, package manifests, or auth system of any kind), even though the parent epic
  ("Defect Lifecycle Management") implies earlier lifecycle work (creation, triage, etc.)
  should already exist. This plan implements MANOJ-FIGMA-PIZZA-STORY-021 (comments and
  comment audit trail) as a self-contained, minimal Node/Express/TypeScript API plus a
  React/TypeScript frontend, built test-first. It covers adding, editing, and deleting
  comments on a defect, enforcing that only the comment author or a QA/Lead may edit or
  delete, that only authenticated project members may submit comments, and that the
  original content of every edited or deleted comment is retained in an append-only
  history for audit purposes — without exposing a dedicated audit-trail viewer UI, since
  no acceptance criterion asks for one.

scope:
  - description: |
      Minimal backend scaffold: package manifest, TypeScript config, Vitest config, and
      an Express app factory + bootstrap that listens on `ARC_DEV_PORT`.
    files:
      - server/package.json
      - server/tsconfig.json
      - server/vitest.config.ts
      - server/src/app.ts
      - server/src/index.ts
    rationale: |
      There is no backend at all in the repo yet. The comments API needs somewhere to
      live before any test can run.

  - description: |
      Minimal auth/authorization stubs: a shared `AuthenticatedUser` type, an `auth`
      middleware that decodes a bearer token into `{ id, name, role, projectIds }`, and an
      `authorize` module with `requireProjectMember` and `requireCommentAuthorOrQaLead`
      guards.
    files:
      - server/src/types.ts
      - server/src/middleware/auth.ts
      - server/src/middleware/authorize.ts
    rationale: |
      AC1/AC8 require distinguishing "authenticated project member" from an outsider, and
      AC2-7 require distinguishing "author or QA/Lead" from any other member. No such
      concept exists in the repo yet, so a minimal stub is required (flagged as an
      assumption below since real auth wiring is a separate concern).

  - description: |
      Comment domain: types, an in-memory `CommentsRepository`, and a `comments.service`
      with `addComment`, `editComment`, `deleteComment`, and `listComments`, each entry
      keeping an append-only `history` of prior content.
    files:
      - server/src/comments/comments.types.ts
      - server/src/comments/comments.repository.ts
      - server/src/comments/comments.service.ts
    rationale: |
      Core logic for AC1-6 and AC9: creating a comment with author/timestamp, editing
      with content+edited-flag retention, soft-deleting while keeping the original
      content, and listing in chronological order.
    signature: |
      ```ts
      export interface Comment {
        id: string;
        defectId: string;
        authorId: string;
        authorName: string;
        body: string;
        createdAt: string;
        isEdited: boolean;
        editedAt: string | null;
        deletedAt: string | null;
        history: CommentHistoryEntry[];
      }

      export interface CommentHistoryEntry {
        body: string;
        changeType: 'edit' | 'delete';
        changedAt: string;
      }

      export function addComment(params: { defectId: string; author: AuthenticatedUser; body: string }): Comment;
      export function editComment(params: { commentId: string; requester: AuthenticatedUser; body: string }): Comment;
      export function deleteComment(params: { commentId: string; requester: AuthenticatedUser }): void;
      export function listComments(defectId: string): Comment[]; // excludes soft-deleted, ascending createdAt

      export function canModify(comment: Comment, user: AuthenticatedUser): boolean {
        return comment.authorId === user.id || user.role === 'qa_lead';
      }
      ```

  - description: |
      Comment HTTP API: `POST /api/defects/:defectId/comments`,
      `GET /api/defects/:defectId/comments`, `PATCH /api/comments/:commentId`,
      `DELETE /api/comments/:commentId`, wired into `app.ts` with the auth/authorize
      middleware from the previous scope item.
    files:
      - server/src/comments/comments.routes.ts
      - server/src/comments/comments.routes.test.ts
      - server/src/app.ts
    rationale: |
      Exposes the domain logic to the frontend and enforces authorization at the HTTP
      boundary, covering AC1, AC2, AC5, AC7, AC8, AC9 end-to-end.

  - description: |
      Service-level unit tests asserting audit-trail retention independent of the HTTP
      layer.
    files:
      - server/src/comments/comments.service.test.ts
    rationale: |
      AC3, AC4, and AC6 are about data retention, not transport — a direct unit test on
      the service/repository is the most precise place to pin this down.

  - description: |
      Minimal frontend scaffold: React + TypeScript app skeleton with Vite for the dev
      server (listening on `ARC_WEB_PORT`) and Vitest + React Testing Library for tests.
    files:
      - web/package.json
      - web/vite.config.ts
      - web/vitest.config.ts
      - web/src/setupTests.ts
    rationale: |
      There is no frontend at all yet; the defect detail view's comment section needs
      somewhere to render.

  - description: |
      Comment UI: `CommentSection` (container, fetches list + composes children),
      `CommentList` (chronological rendering + empty state), `CommentItem` (single
      comment, conditional edit/delete controls), `CommentForm` (submission, conditional
      visibility), and a thin `commentsApi` client.
    files:
      - web/src/api/commentsApi.ts
      - web/src/components/CommentSection/CommentSection.tsx
      - web/src/components/CommentSection/CommentList.tsx
      - web/src/components/CommentSection/CommentItem.tsx
      - web/src/components/CommentSection/CommentForm.tsx
    rationale: |
      Covers the visible-behavior ACs: chronological history (AC9), empty state (AC10),
      hiding edit/delete for non-author/non-QA-Lead viewers (AC7), hiding the submission
      form for non-members (AC8), and edit/delete interactions (AC2, AC5).

  - description: |
      Frontend component tests for the above, written before the components.
    files:
      - web/src/components/CommentSection/CommentList.test.tsx
      - web/src/components/CommentSection/CommentItem.test.tsx
      - web/src/components/CommentSection/CommentForm.test.tsx
    rationale: |
      Test-first coverage for the UI-visible parts of AC2, AC5, AC7, AC8, AC9, AC10.

tests:
  - |
    AC1 (server/src/comments/comments.routes.test.ts) — submitting a comment saves it
    with author name and timestamp and it appears in the history:
    ```ts
    it('saves a comment and returns author name and timestamp', async () => {
      const res = await request(app)
        .post('/api/defects/defect-1/comments')
        .set('Authorization', memberToken)
        .send({ body: 'Looks good to me' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ authorName: 'Alice Member', body: 'Looks good to me' });
      expect(res.body.createdAt).toBeTruthy();

      const list = await request(app)
        .get('/api/defects/defect-1/comments')
        .set('Authorization', memberToken);
      expect(list.body).toHaveLength(1);
    });
    ```

  - |
    AC2 (server/src/comments/comments.routes.test.ts) — the author can edit their own
    comment and the updated text is saved:
    ```ts
    it('lets the author edit their own comment', async () => {
      const created = await createComment(authorToken, 'original text');
      const res = await request(app)
        .patch(`/api/comments/${created.id}`)
        .set('Authorization', authorToken)
        .send({ body: 'updated text' });

      expect(res.status).toBe(200);
      expect(res.body.body).toBe('updated text');
    });
    ```

  - |
    AC3 (server/src/comments/comments.service.test.ts) — editing retains the original
    content in the history:
    ```ts
    it('retains original content in history after an edit', () => {
      const created = addComment({ defectId: 'd1', author, body: 'original text' });
      const updated = editComment({ commentId: created.id, requester: author, body: 'updated text' });

      expect(updated.history).toContainEqual(
        expect.objectContaining({ body: 'original text', changeType: 'edit' })
      );
    });
    ```

  - |
    AC4 (server/src/comments/comments.service.test.ts) — an edited comment is marked as
    edited:
    ```ts
    it('marks a comment as edited', () => {
      const created = addComment({ defectId: 'd1', author, body: 'original text' });
      const updated = editComment({ commentId: created.id, requester: author, body: 'updated text' });

      expect(updated.isEdited).toBe(true);
      expect(updated.editedAt).not.toBeNull();
    });
    ```

  - |
    AC5 (server/src/comments/comments.routes.test.ts) — a deleted comment no longer
    appears in the visible list:
    ```ts
    it('removes a deleted comment from the visible list', async () => {
      const created = await createComment(authorToken, 'to be removed');
      await request(app).delete(`/api/comments/${created.id}`).set('Authorization', authorToken);

      const list = await request(app)
        .get(`/api/defects/${created.defectId}/comments`)
        .set('Authorization', authorToken);
      expect(list.body.map((c: any) => c.id)).not.toContain(created.id);
    });
    ```

  - |
    AC6 (server/src/comments/comments.service.test.ts) — deleting retains the original
    content in the history:
    ```ts
    it('retains the original content in history when a comment is deleted', () => {
      const created = addComment({ defectId: 'd1', author, body: 'to remove' });
      deleteComment({ commentId: created.id, requester: author });

      const stored = repository.findById(created.id);
      expect(stored?.deletedAt).not.toBeNull();
      expect(stored?.history).toContainEqual(
        expect.objectContaining({ body: 'to remove', changeType: 'delete' })
      );
    });
    ```

  - |
    AC7 (server/src/comments/comments.routes.test.ts + web/src/components/CommentSection/CommentItem.test.tsx)
    — a non-author, non-QA/Lead viewer cannot edit or delete, and the controls are not
    rendered:
    ```ts
    it('forbids a non-author, non QA/Lead from editing or deleting', async () => {
      const created = await createComment(authorToken, 'original');
      const editRes = await request(app)
        .patch(`/api/comments/${created.id}`)
        .set('Authorization', otherMemberToken)
        .send({ body: 'hacked' });
      expect(editRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`/api/comments/${created.id}`)
        .set('Authorization', otherMemberToken);
      expect(deleteRes.status).toBe(403);
    });
    ```
    ```tsx
    it('does not render edit/delete controls for a non-author, non QA/Lead viewer', () => {
      render(<CommentItem comment={comment} currentUser={otherMember} />);
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
    ```

  - |
    AC8 (server/src/comments/comments.routes.test.ts + web/src/components/CommentSection/CommentForm.test.tsx)
    — a non-member cannot submit a comment, and the form is not rendered:
    ```ts
    it('rejects comment submission from a non-project-member', async () => {
      const res = await request(app)
        .post('/api/defects/defect-1/comments')
        .set('Authorization', outsiderToken)
        .send({ body: 'sneaky' });
      expect(res.status).toBe(403);
    });
    ```
    ```tsx
    it('hides the comment form for a non-member viewer', () => {
      render(<CommentForm defectId="d1" currentUser={null} />);
      expect(screen.queryByRole('textbox', { name: /add a comment/i })).not.toBeInTheDocument();
    });
    ```

  - |
    AC9 (server/src/comments/comments.routes.test.ts) — comments are returned in
    chronological order:
    ```ts
    it('returns comments in chronological order', async () => {
      await createComment(authorToken, 'first');
      await createComment(authorToken, 'second');
      const res = await request(app).get('/api/defects/defect-1/comments').set('Authorization', authorToken);
      expect(res.body.map((c: any) => c.body)).toEqual(['first', 'second']);
    });
    ```

  - |
    AC10 (web/src/components/CommentSection/CommentList.test.tsx) — an empty-state
    message is shown when there are no comments:
    ```tsx
    it('shows an empty-state message when there are no comments', () => {
      render(<CommentList comments={[]} currentUser={member} />);
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
    });
    ```

assumptions_or_open_questions:
  - |
    The repo is currently empty apart from `README.md` and `.env` — there is no backend,
    frontend, package manifest, or auth system, even though the parent epic implies
    earlier defect-lifecycle work should exist. This plan proposes a minimal Express +
    TypeScript API and a React + TypeScript frontend as the initial scaffold. Please
    confirm this is the intended stack (versus e.g. an existing stack chosen elsewhere
    that just hasn't been committed yet) before implementation starts.
  - |
    No `Defect` entity exists yet. Comments are assumed to attach to a defect purely via
    a `defectId` string, with no server-side check that the defect actually exists.
  - |
    No persistence layer exists. Comments are stored in an in-memory `CommentsRepository`
    behind an interface so a real datastore can be substituted later without touching the
    service or routes layer.
  - |
    No auth/session system exists. A minimal `auth` middleware stub decodes a bearer token
    into `{ id, name, role, projectIds }`; `role: 'qa_lead'` represents "QA/Lead" from the
    acceptance criteria. Real SSO/session wiring is out of scope for this item.
  - |
    "QA/Lead" is treated as a single role value (`qa_lead`) with the same permissions as
    each other. If QA and Lead are meant to be distinct roles with different permissions,
    this needs clarifying.
  - |
    Audit-trail retention (AC3, AC6) is verified via the in-memory `history` array and
    unit/integration tests only; no dedicated "view audit trail" UI or endpoint is built,
    since no acceptance criterion asks for one — only retention, not display, is required.
  - |
    Comment IDs are generated with `uuid` v4.

package_dependencies:
  - name: express
    version: ^4.19.2
    ecosystem: npm
    rationale: Minimal HTTP server/router for the comments API; no backend framework exists in the repo yet.
  - name: uuid
    version: ^9.0.1
    ecosystem: npm
    rationale: Generates comment and history-entry IDs.
  - name: typescript
    version: ^5.5.4
    ecosystem: npm
    rationale: Language for both the server and web scaffolds; not currently configured anywhere in the repo.
  - name: vitest
    version: ^2.0.5
    ecosystem: npm
    rationale: Test runner for the test-first backend and frontend suites described above.
  - name: supertest
    version: ^7.0.0
    ecosystem: npm
    rationale: HTTP-level assertions against the Express app in comments.routes.test.ts.
  - name: "@types/express"
    version: ^4.17.21
    ecosystem: npm
    rationale: Type definitions for express in the TypeScript server.
  - name: "@types/supertest"
    version: ^6.0.2
    ecosystem: npm
    rationale: Type definitions for supertest in the TypeScript server tests.
  - name: "@types/node"
    version: ^20.14.0
    ecosystem: npm
    rationale: Node type definitions required to compile the TypeScript server.
  - name: "@types/uuid"
    version: ^9.0.8
    ecosystem: npm
    rationale: Type definitions for the uuid package.
  - name: react
    version: ^18.3.1
    ecosystem: npm
    rationale: UI library for the CommentSection components; no frontend exists in the repo yet.
  - name: react-dom
    version: ^18.3.1
    ecosystem: npm
    rationale: DOM renderer paired with react.
  - name: vite
    version: ^5.4.0
    ecosystem: npm
    rationale: Dev server/bundler for the web app, serving on ARC_WEB_PORT.
  - name: "@vitejs/plugin-react"
    version: ^4.3.1
    ecosystem: npm
    rationale: Enables JSX/React fast-refresh support in the Vite dev server.
  - name: "@testing-library/react"
    version: ^16.0.0
    ecosystem: npm
    rationale: Renders and queries CommentSection/CommentList/CommentItem/CommentForm in tests.
  - name: "@testing-library/jest-dom"
    version: ^6.4.8
    ecosystem: npm
    rationale: DOM matchers (toBeInTheDocument, etc.) used in the frontend test assertions above.
  - name: jsdom
    version: ^24.1.1
    ecosystem: npm
    rationale: DOM environment required by Vitest to run React Testing Library tests.

notes: |
  The codebase has no prior commits beyond the initial scaffold commit, so there are no
  existing conventions to mirror; the structure above (`server/` for the Express API,
  `web/` for the React app) is a reasonable, common split given the two ports already
  reserved in `.env` (`ARC_DEV_PORT`, `ARC_WEB_PORT`), but it is a genuine choice worth
  the reviewer's sign-off rather than a discovered convention.

  Layering: routes stay thin and only handle HTTP concerns (status codes, auth
  middleware wiring); all audit-trail and authorization logic lives in
  `comments.service.ts` so it can be unit-tested directly (AC3/AC4/AC6) without going
  through HTTP. The frontend mirrors this by keeping `CommentSection` as the only
  component that talks to `commentsApi`, with `CommentList`/`CommentItem`/`CommentForm`
  staying presentational and driven by props (`currentUser`, `comments`), which is what
  makes the AC7/AC8 "controls not rendered" tests possible without mocking network calls.

  ```mermaid
  flowchart TD
    classDef touched fill:#f96,color:#000

    App[Server: app.ts]:::touched -->|mounts router| Routes[Server: comments.routes.ts]:::touched
    Routes -->|"auth: who is the requester"| AuthMw[Server: middleware/auth.ts]:::touched
    Routes -->|"authorize: member / author-or-qa_lead"| AuthorizeMw[Server: middleware/authorize.ts]:::touched
    Routes -->|"add/edit/delete/list"| Service[Server: comments.service.ts]:::touched
    Service -->|"CRUD + history"| Repository[Server: comments.repository.ts]:::touched

    CommentSection[Web: CommentSection.tsx]:::touched -->|"fetch/post/patch/delete"| CommentsApi[Web: commentsApi.ts]:::touched
    CommentsApi -->|HTTP| Routes
    CommentSection -->|"AC9/AC10: history + empty state"| CommentList[Web: CommentList.tsx]:::touched
    CommentList -->|"AC7: hide edit/delete unless author/qa_lead"| CommentItem[Web: CommentItem.tsx]:::touched
    CommentSection -->|"AC8: hide unless project member"| CommentForm[Web: CommentForm.tsx]:::touched
  ```
