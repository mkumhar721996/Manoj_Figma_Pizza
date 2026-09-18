summary: |
  This work item surfaces SLA at-risk/breached status directly on the defect record view.
  The repository currently contains no application code (only a README and .env), so this
  plan includes a minimal project scaffold (TypeScript + Vite + React + Vitest) alongside the
  feature itself. The feature is built as a small, pure domain layer — `resolveSlaRule` (picks
  the configured rule for a defect's project/priority, or undefined if none exists) and
  `evaluateSla` (a pure function computing ON_TRACK / AT_RISK / BREACHED, freezing evaluation
  time at a defect's terminal transition so closed/cancelled defects stop escalating) — plus a
  presentational `SlaIndicator` badge and a `DefectRecord` view that wires them together. No
  notification/email/webhook code is introduced anywhere in this plan, which is itself how AC6
  is satisfied (there is nothing in scope that could send one).

scope:
  - description: |
      Scaffold a minimal TypeScript + Vite + React + Vitest project, since the worktree has no
      package.json, tsconfig, or src directory yet.
    files:
      - package.json
      - tsconfig.json
      - vite.config.ts
      - vitest.config.ts (or vitest config merged into vite.config.ts)
      - src/main.tsx (minimal app entry, not otherwise exercised by this ticket's tests)
    rationale: |
      There is no existing build/test tooling in this repo to attach the feature's tests to.
      This is the minimal setup needed to run the Vitest suites described below.

  - description: |
      Define the SLA domain types shared by the evaluator, resolver, and UI.
    files:
      - src/sla/types.ts
    rationale: |
      A single source of truth for the shapes (`SlaRule`, `Defect`, `SlaStatus`,
      `SlaEvaluation`) keeps the evaluator, resolver, and component in sync.

  - description: |
      Implement `resolveSlaRule(rules: SlaRule[], defect: Defect): SlaRule | undefined`, which
      finds the rule matching a defect's `projectId` + `priority`, or returns `undefined` when
      no matching rule exists (AC5: no SLA rules configured for the project).
    files:
      - src/sla/resolveSlaRule.ts
      - src/sla/resolveSlaRule.test.ts
    rationale: |
      AC1 ties thresholds to priority ("age or priority crosses a configured threshold"), so
      rules are modeled per project+priority rather than one flat rule per project. Isolating
      resolution from evaluation keeps `evaluateSla` a pure function of a single already-picked
      rule, which is easier to test exhaustively.

  - description: |
      Implement `evaluateSla(defect: Defect, rule: SlaRule | undefined, now: Date): SlaEvaluation | null`,
      a pure function with no I/O, that returns `null` when `rule` is undefined, otherwise
      computes `{ status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED', isTerminal: boolean }`. For
      defects in a terminal status (`Closed`/`Cancelled`), the age is computed against
      `defect.terminalAt` instead of `now`, so the result is frozen at the moment of
      transition and never re-escalates (AC3, AC4).
    files:
      - src/sla/evaluateSla.ts
      - src/sla/evaluateSla.test.ts
    rationale: |
      Freezing the evaluation clock at `terminalAt` is the mechanism that makes AC3 ("indicator
      reflects the terminal state") and AC4 ("no further breach escalation") true simultaneously
      without any special-casing in the UI layer — the UI just renders whatever
      `evaluateSla` returns.

  - description: |
      Implement the presentational `SlaIndicator` component: renders nothing when `evaluation`
      is `null` or `status === 'ON_TRACK'` (AC2, AC5); renders a "At Risk"/"Breached" badge
      otherwise, prefixed with "Closed – " when `isTerminal` is true (AC3). Purely
      presentational — takes an already-computed `SlaEvaluation`, performs no fetch/network
      calls (AC6).
    files:
      - src/components/SlaIndicator.tsx
      - src/components/SlaIndicator.test.tsx
    rationale: |
      Keeping this component a pure render of `SlaEvaluation` (rather than fetching or
      re-deriving state itself) is what makes the "no notification" property (AC6) trivially
      verifiable — there is no code path here that could call out to a network API.

  - description: |
      Implement `DefectRecord`, the view that resolves the applicable rule, evaluates SLA
      status, and renders `SlaIndicator` alongside the rest of the defect record.
    files:
      - src/components/DefectRecord.tsx
      - src/components/DefectRecord.test.tsx
    rationale: |
      This is the integration point named in every AC ("WHEN the defect record is viewed") —
      an end-to-end render test here (rules in, indicator or absence of indicator out) is what
      proves the domain logic is actually wired into the record view rather than just unit-tested
      in isolation.

tests:
  - |
    AC1 — `evaluateSla.test.ts`: at-risk and breached thresholds crossed.
    ```ts
    const rule: SlaRule = { projectId: 'proj-1', priority: 'P1', atRiskThresholdHours: 24, breachThresholdHours: 48 };
    const defect: Defect = { id: 'd-1', projectId: 'proj-1', priority: 'P1', status: 'Open', createdAt: new Date('2026-09-14T00:00:00Z') };

    it('returns AT_RISK once age crosses the at-risk threshold', () => {
      const now = new Date('2026-09-15T06:00:00Z'); // 30h old
      expect(evaluateSla(defect, rule, now)).toEqual({ status: 'AT_RISK', isTerminal: false });
    });

    it('returns BREACHED once age crosses the breach threshold', () => {
      const now = new Date('2026-09-16T02:00:00Z'); // 50h old
      expect(evaluateSla(defect, rule, now)).toEqual({ status: 'BREACHED', isTerminal: false });
    });
    ```
    Plus `SlaIndicator.test.tsx`:
    ```tsx
    it('renders a visible breached badge', () => {
      render(<SlaIndicator evaluation={{ status: 'BREACHED', isTerminal: false }} />);
      expect(screen.getByTestId('sla-indicator')).toHaveTextContent('Breached');
    });
    ```
  - |
    AC2 — within SLA, no indicator shown.
    ```ts
    it('returns ON_TRACK when the defect is within SLA', () => {
      const now = new Date('2026-09-14T02:00:00Z'); // 2h old
      expect(evaluateSla(defect, rule, now)).toEqual({ status: 'ON_TRACK', isTerminal: false });
    });
    ```
    ```tsx
    it('renders nothing when status is ON_TRACK', () => {
      const { container } = render(<SlaIndicator evaluation={{ status: 'ON_TRACK', isTerminal: false }} />);
      expect(container).toBeEmptyDOMElement();
    });
    ```
  - |
    AC3 — terminal transition reflects the state at closure.
    ```ts
    it('reflects the AT_RISK/BREACHED state computed at the terminal transition', () => {
      const closed: Defect = { ...defect, status: 'Closed', terminalAt: new Date('2026-09-15T06:00:00Z') }; // 30h -> AT_RISK
      expect(evaluateSla(closed, rule, new Date('2026-09-15T06:00:01Z'))).toEqual({ status: 'AT_RISK', isTerminal: true });
    });
    ```
    ```tsx
    it('shows a terminal-qualified badge for closed defects', () => {
      render(<SlaIndicator evaluation={{ status: 'BREACHED', isTerminal: true }} />);
      expect(screen.getByText(/closed.*breached/i)).toBeInTheDocument();
    });
    ```
  - |
    AC4 — no further escalation after the terminal transition, even much later.
    ```ts
    it('does not re-escalate when evaluated long after the terminal transition', () => {
      const closed: Defect = { ...defect, status: 'Closed', terminalAt: new Date('2026-09-15T06:00:00Z') }; // 30h -> AT_RISK
      const muchLater = new Date('2030-01-01T00:00:00Z'); // would be BREACHED if still live
      expect(evaluateSla(closed, rule, muchLater)).toEqual({ status: 'AT_RISK', isTerminal: true });
    });
    ```
  - |
    AC5 — no SLA rules configured for the project.
    ```ts
    it('resolveSlaRule returns undefined when no rule matches the project', () => {
      expect(resolveSlaRule([], defect)).toBeUndefined();
    });
    it('evaluateSla returns null when no rule is provided', () => {
      expect(evaluateSla(defect, undefined, new Date())).toBeNull();
    });
    ```
    ```tsx
    it('DefectRecord shows no SLA indicator when no rule is configured', () => {
      render(<DefectRecord defect={defect} rules={[]} now={new Date()} />);
      expect(screen.queryByTestId('sla-indicator')).not.toBeInTheDocument();
    });
    ```
  - |
    AC6 — no proactive notification is sent when a breach is detected.
    ```tsx
    it('does not trigger any network call when rendering a breached indicator', () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      render(<SlaIndicator evaluation={{ status: 'BREACHED', isTerminal: false }} />);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
    ```

assumptions_or_open_questions:
  - "The worktree contains no existing application code (no package.json, no src/), so this plan scaffolds a minimal TypeScript + Vite + React + Vitest project from scratch. If this ticket is meant to land inside a separate, already-existing application repo that simply isn't present in this worktree, the scaffold step should be dropped and the feature files re-pointed at that repo's real structure/conventions instead."
  - "SLA rules are modeled as a list per project, one entry per priority (`{ projectId, priority, atRiskThresholdHours, breachThresholdHours }`), since AC1 ties thresholds to both age and priority. No SLA-rule configuration UI/CRUD is in scope — rules are assumed to be supplied as data to `DefectRecord` (e.g. already fetched by a parent/container), since configuring rules is not covered by any acceptance criterion here."
  - "Terminal-state freezing assumes a `terminalAt` timestamp is available on the defect when it transitions to Closed/Cancelled. Where that timestamp comes from (a status-transition side effect elsewhere in the lifecycle) is out of scope for this ticket; it's treated as an existing/incoming field on the `Defect` shape."
  - "AC6 (no notification) is satisfied by omission: no notification/email/webhook code exists anywhere in this plan's scope. The fetch-spy test in `SlaIndicator.test.tsx` is a guard against a future regression, not a test of an existing notification subsystem."
  - "Badge copy ('At Risk' / 'Breached' / 'Closed – Breached') and styling are placeholders reflecting the visible-indicator requirement in AC1/AC3; exact wording/visual design is not specified in the ACs and can be adjusted without changing the underlying evaluator logic."

package_dependencies:
  - name: react
    version: ^18.3.1
    ecosystem: npm
    rationale: UI layer for SlaIndicator/DefectRecord components; no framework currently exists in this empty worktree.
  - name: react-dom
    version: ^18.3.1
    ecosystem: npm
    rationale: Required alongside react for rendering components in tests and the app entry.
  - name: typescript
    version: ^5.6.2
    ecosystem: npm
    rationale: All new source files are authored in TypeScript.
  - name: vite
    version: ^5.4.8
    ecosystem: npm
    rationale: Minimal dev/build tooling for the scaffolded project.
  - name: "@vitejs/plugin-react"
    version: ^4.3.2
    ecosystem: npm
    rationale: Enables JSX/TSX compilation for the React components under Vite.
  - name: vitest
    version: ^2.1.1
    ecosystem: npm
    rationale: Test runner for all failing-test-first specs in this plan.
  - name: "@testing-library/react"
    version: ^16.0.1
    ecosystem: npm
    rationale: Renders and queries SlaIndicator/DefectRecord in component tests.
  - name: "@testing-library/jest-dom"
    version: ^6.5.0
    ecosystem: npm
    rationale: Provides the toBeInTheDocument/toBeEmptyDOMElement matchers used in the component tests.
  - name: jsdom
    version: ^25.0.1
    ecosystem: npm
    rationale: DOM environment for Vitest to run React component tests outside a browser.

notes: |
  This worktree had no existing codebase to build on (only README.md and .env), which is why
  scope includes a project scaffold. If a separate application repository is actually meant to
  host this feature, please redirect before implementation starts, since the scaffold step and
  file paths below would otherwise need to be re-targeted.

  Module shape and call direction for the new code:

  ```mermaid
  flowchart TD
    classDef touched fill:#f96,color:#000

    DR["DefectRecord.tsx (view)"]:::touched
    RR["resolveSlaRule.ts (domain)"]:::touched
    EV["evaluateSla.ts (domain)"]:::touched
    SI["SlaIndicator.tsx (component)"]:::touched
    TY["types.ts (SlaRule, Defect, SlaEvaluation)"]:::touched

    DR -->|"picks the rule for this defect's project+priority (AC1, AC5)"| RR
    DR -->|"computes ON_TRACK/AT_RISK/BREACHED, frozen at terminalAt (AC3, AC4)"| EV
    DR -->|"renders result; no-op when null/ON_TRACK (AC2, AC5)"| SI
    RR --> TY
    EV --> TY
    SI --> TY
  ```
