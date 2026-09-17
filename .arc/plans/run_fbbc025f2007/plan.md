summary: |
  This plan implements MANOJ-FIGMA-PIZZA-STORY-027 (password reset from the login page, via
  either an emailed reset link or an SMS OTP, including first-time app-password creation for
  Facebook-originated accounts). The repository currently contains no application code at all —
  only the design-system token bootstrap (`design-system/tokens.css`, `design-system/tokens.json`,
  `design-system/prototype-utils.css`) and the approved prototype at
  `.arc/designs/MANOJ-FIGMA-PIZZA-STORY-027-design.html`. There is no existing backend, frontend
  framework, package.json, or test runner to conform to, so this plan necessarily bootstraps a
  minimal Node.js/Express backend and a set of static frontend pages that reuse the already-linked
  design tokens, in addition to the password-reset feature itself. Every UI page described below
  is taken directly from the seven screens in the approved prototype (`login`, `forgot-request`,
  `forgot-sent`, `reset-link`, `reset-otp`, `set-password`, `login-success`); the prototype's own
  reviewer-only chrome (the sticky reviewer bar, the "reviewer aid" scenario/demo chips, and the
  dashed `.callout`/`.demo-aid` blocks) is explicitly excluded from the real product pages, since
  the prototype itself labels those as "not shown to real users." Work proceeds test-first:
  business rules (expiry, lockout, rate-limiting, mutual invalidation, no-enumeration, Facebook
  coexistence, password policy) are unit-tested at the service layer before wiring HTTP routes and
  static pages.

scope:
  - description: |
      Bootstrap a minimal Node.js project: `package.json` (new — none exists in the repo today),
      an Express app entrypoint that serves the static `public/` directory and mounts the auth
      API under `/api/auth`, and a Jest test configuration (`jest.config.js`) with two test
      environments — `node` for backend/service tests and `jsdom` for the couple of frontend
      logic tests.
    files:
      - package.json
      - jest.config.js
      - src/server.js
      - src/app.js
    rationale: |
      No backend, framework, or test runner exists anywhere in the repo yet (confirmed via
      `Glob **/package.json` returning no results and no `src`/`server`/`api` directories
      present). Every other scope item below depends on this scaffold existing first.

  - description: |
      Domain model and in-memory repositories: a `User` record (`{ id, identifier, email, mobile,
      passwordHash, facebookId }`) and a `PasswordResetRequest` record (`{ id, userId,
      identifierUsed, resetToken, resetTokenExpiresAt, otpCode, otpExpiresAt, otpAttempts,
      otpLocked, linkInvalidated, otpInvalidated, createdAt }`). Repositories expose the minimal
      query/mutation surface the service layer needs, e.g.:
      ```js
      // src/services/passwordResetRepository.js
      function create(request) {}
      function findByToken(token) {}
      function findById(id) {}
      function update(id, patch) {}
      function countRequestsSince(identifier, sinceDate) {}
      ```
    files:
      - src/services/userRepository.js
      - src/services/passwordResetRepository.js
    rationale: |
      No database or persistence layer exists in the repo. The ACs (expiry, lockout, rate
      limiting, mutual invalidation) all require tracking per-request state, so an in-memory
      store behind a small repository interface is the minimal thing that makes the service
      layer testable without inventing a production data-store decision that belongs to ops
      (see `assumptions_or_open_questions`).

  - description: |
      Shared utilities: password-policy validation and token/OTP generation, both copied
      verbatim from the values encoded in the approved prototype's `FIXTURES` object
      (`.arc/designs/MANOJ-FIGMA-PIZZA-STORY-027-design.html` lines 813-814), since no other
      "existing sign-up password policy" is defined anywhere in this repo:
      ```js
      // src/utils/passwordPolicy.js
      const POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      function meetsPolicy(password) { return POLICY_REGEX.test(password); }
      ```
      ```js
      // src/utils/tokens.js
      function generateResetToken() {} // crypto.randomBytes(32).toString('hex')
      function generateOtp() {} // 6-digit numeric string, e.g. String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
      ```
    files:
      - src/utils/passwordPolicy.js
      - src/utils/tokens.js
    rationale: |
      AC14's policy list ("at least 8 characters", "at least one uppercase and one lowercase
      letter", "at least one number") and its weak/strong example chips are drawn straight from
      the prototype's `policy-list` markup and `FIXTURES.passwordPolicy` regex — using anything
      else would silently diverge from the approved design.

  - description: |
      Notification senders behind small interfaces so the service layer is unit-testable with
      fakes, plus concrete SMTP/Twilio-backed implementations:
      ```js
      // src/services/notifiers/emailSender.js
      async function sendResetEmail({ to, resetLink }) {}
      // src/services/notifiers/smsSender.js
      async function sendOtpSms({ to, otp }) {}
      ```
    files:
      - src/services/notifiers/emailSender.js
      - src/services/notifiers/smsSender.js
    rationale: |
      AC2 and AC3 require an actual email and an actual SMS to be sent. Nodemailer and Twilio are
      the concrete, real-package choices (see `package_dependencies`); the service layer depends
      only on the two functions above so tests can inject fakes instead of calling real
      providers.

  - description: |
      Core `passwordResetService` implementing the full business logic: request creation with
      no-enumeration and rate-limiting (AC10, AC16), link/OTP verification with expiry and
      lockout (AC4-AC6, AC11-AC13), password update with policy enforcement and mutual
      invalidation (AC7, AC14, AC15), and Facebook first-time-password coexistence (AC9):
      ```js
      // src/services/passwordResetService.js
      async function requestPasswordReset({ identifier }) {}
      // -> always { message: GENERIC_MESSAGE } regardless of registration/rate-limit state
      async function verifyResetLink({ token }) {}
      // -> { valid: true, requestId } | { valid: false, reason: 'expired' | 'invalid' }
      async function verifyOtp({ requestId, otp }) {}
      // -> { valid: true } | { valid: false, reason: 'incorrect' | 'expired' | 'locked', attemptsRemaining }
      async function setNewPassword({ requestId, newPassword, confirmPassword }) {}
      // -> { success: true } | { success: false, reason: 'password_mismatch' | 'policy_violation' }
      ```
    files:
      - src/services/passwordResetService.js
    rationale: |
      This is where every numbered acceptance criterion's actual rule lives, kept separate from
      HTTP/route concerns so it can be tested directly and quickly (test-first, per instructions).

  - description: |
      Minimal login service/route so AC8 ("log in using the new password grants access") is
      something a test can actually exercise, since no auth/login backend exists in the repo at
      all today:
      ```js
      // src/services/authService.js
      async function login({ identifier, password }) {}
      // -> { success: true, userId } | { success: false }
      ```
    files:
      - src/services/authService.js
    rationale: |
      AC8 requires granting access after reset; without any existing login implementation to
      reuse, a minimal bcrypt-compare-based check is the smallest thing that lets AC8 be tested
      end-to-end against the password set in AC7.

  - description: |
      Express routes wiring the service layer to HTTP:
      ```
      POST /api/auth/login              { identifier, password }
      POST /api/auth/forgot-password    { identifier }
      POST /api/auth/reset/verify-link  { token }
      POST /api/auth/reset/verify-otp   { requestId, otp }
      POST /api/auth/reset/set-password { requestId, newPassword, confirmPassword }
      ```
    files:
      - src/routes/authRoutes.js
    rationale: |
      Translates the service-layer results above into HTTP status codes/JSON bodies for the
      static frontend pages to call via `fetch`.

  - description: |
      Static frontend pages, one per real screen in the approved prototype, each linking
      `design-system/tokens.css` and `design-system/prototype-utils.css` exactly as the prototype
      does ("linked, not inlined, per design-system-bootstrap output" — prototype line 8), and
      reusing the prototype's own component classes (`.card`, `.field`, `.input`, `.btn-primary`,
      `.btn-secondary`, `.banner-success`/`.banner-error`/`.banner-info`, `.badge`, `.otp-input`,
      `.policy-list`, `.field-error`, `.link-button`, `.divider`). The prototype's reviewer-only
      chrome (`.reviewer-bar`, `#rb-notes-panel`, `.demo-aid`/`.demo-chip` scenario pickers, the
      dashed `.callout` design-decision notes) is deliberately NOT carried into these pages — the
      prototype itself marks that chrome "reviewer aid... not shown to real users" / "not real
      UI" (design lines 593, 612-621, 664-670, 721-728, 767-780).
      - `public/login.html`: mirrors screen 1 — email/mobile + password fields, "Forgot
        password?" link-button (AC1), and the post-reset success banner
        (`#login-reset-banner`, AC8). The "Continue with Facebook" secondary button is rendered
        for visual parity with the design but is inert — the design's own tooltip says it's "Not
        simulated in this prototype — shown for context," so wiring real Facebook OAuth is out of
        scope for this story.
      - `public/forgot-password.html`: mirrors screen 2 — single identifier field + "Send reset
        instructions" button (AC1), no scenario chips.
      - `public/forgot-password-sent.html`: mirrors screen 3 — the single generic confirmation
        message (AC2, AC3, AC10, AC16), with no branching copy for unregistered/rate-limited
        cases (those callouts are reviewer-only).
      - `public/reset-link.html`: mirrors screen 4's two real states — "Link verified" +
        Continue (AC4) and the expired-link banner (AC11). Reads `?token=` from the URL.
      - `public/reset-otp.html`: mirrors screen 5's three real states — code entry with inline
        error (AC6), expired (AC12), locked (AC13).
      - `public/set-password.html`: mirrors screen 6 — new/confirm password fields, the policy
        list, the Facebook badge + adjusted heading/subtitle for facebook-originated accounts
        (AC9), the `#invalidated-method-note` banner (AC15), inline policy-violation error (AC14),
        and the success state with `#success-invalidated-note` / `#success-facebook-note`.
      - `public/login-success.html`: mirrors screen 7 (AC8 destination).
    files:
      - public/login.html
      - public/forgot-password.html
      - public/forgot-password-sent.html
      - public/reset-link.html
      - public/reset-otp.html
      - public/set-password.html
      - public/login-success.html
    rationale: |
      The design is the sole record of layout/spacing/copy for this story; every element listed
      is one already shown in the prototype's markup, cited above by line range.

  - description: |
      Thin client-side JS per page (fetch calls + DOM state toggling), plus one pure, testable
      module extracted for the client-side password-confirmation check so it has a unit test
      independent of the DOM:
      ```js
      // public/js/passwordMatch.js
      function passwordsMatch(password, confirmation) { return password === confirmation; }
      module.exports = { passwordsMatch };
      ```
    files:
      - public/js/login.js
      - public/js/forgotPassword.js
      - public/js/resetLink.js
      - public/js/resetOtp.js
      - public/js/setPassword.js
      - public/js/passwordMatch.js
    rationale: |
      Keeps the DOM-wiring code thin and pushes the one bit of client-side logic worth a fast
      unit test out of the DOM entirely; all authoritative validation (policy, OTP, expiry,
      lockout) still lives server-side and is tested there.

tests:
  - |
    AC1 — "Forgot password?" link presents the identifier field.
    Integration test (supertest) against the static file server:
    ```js
    const res = await request(app).get('/forgot-password.html');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="forgot-identifier"/);
    ```
    Plus a markup assertion that `login.html` contains the link-button:
    ```js
    expect(loginHtml).toMatch(/Forgot password\?/);
    ```
  - |
    AC2 — valid identifier sends a password-reset email.
    ```js
    const emailSender = { sendResetEmail: jest.fn() };
    const smsSender = { sendOtpSms: jest.fn() };
    const service = createPasswordResetService({ userRepository, resetRepository, emailSender, smsSender });
    await service.requestPasswordReset({ identifier: 'jordan.baker@example.com' });
    expect(emailSender.sendResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jordan.baker@example.com', resetLink: expect.stringContaining('/reset-link.html?token=') })
    );
    ```
  - |
    AC3 — valid identifier sends an OTP SMS.
    ```js
    await service.requestPasswordReset({ identifier: 'jordan.baker@example.com' });
    expect(smsSender.sendOtpSms).toHaveBeenCalledWith(
      expect.objectContaining({ otp: expect.stringMatching(/^\d{6}$/) })
    );
    ```
  - |
    AC4 — clicking a valid reset link leads to the set-new-password screen.
    ```js
    const { requestId, token } = await createTestResetRequest({ resetRepository });
    const result = await service.verifyResetLink({ token });
    expect(result).toEqual({ valid: true, requestId });
    ```
  - |
    AC5 — correct OTP leads to the set-new-password screen.
    ```js
    const { requestId } = await createTestResetRequest({ resetRepository, otpCode: '482913' });
    const result = await service.verifyOtp({ requestId, otp: '482913' });
    expect(result).toEqual({ valid: true });
    ```
  - |
    AC6 — incorrect OTP is rejected and does not allow proceeding.
    ```js
    const { requestId } = await createTestResetRequest({ resetRepository, otpCode: '482913' });
    const result = await service.verifyOtp({ requestId, otp: '000000' });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('incorrect');
    ```
  - |
    AC7 — submitting a new password on a valid session updates the account password.
    ```js
    const { requestId, userId } = await createTestResetRequest({ resetRepository });
    await service.setNewPassword({ requestId, newPassword: 'SliceHouse2024', confirmPassword: 'SliceHouse2024' });
    const updatedUser = await userRepository.findById(userId);
    expect(await bcrypt.compare('SliceHouse2024', updatedUser.passwordHash)).toBe(true);
    ```
  - |
    AC8 — logging in with the new password grants access.
    ```js
    await service.setNewPassword({ requestId, newPassword: 'SliceHouse2024', confirmPassword: 'SliceHouse2024' });
    const loginResult = await authService.login({ identifier: 'jordan.baker@example.com', password: 'SliceHouse2024' });
    expect(loginResult.success).toBe(true);
    ```
  - |
    AC9 — Facebook-originated account can set a first app password that coexists with Facebook login.
    ```js
    const fbUser = await userRepository.create({ identifier: 'morgan.lee@example.com', facebookId: 'fb-123', passwordHash: null });
    const { requestId } = await createTestResetRequest({ resetRepository, userId: fbUser.id });
    await service.setNewPassword({ requestId, newPassword: 'SliceHouse2024', confirmPassword: 'SliceHouse2024' });
    const updatedUser = await userRepository.findById(fbUser.id);
    expect(updatedUser.facebookId).toBe('fb-123');
    expect(await bcrypt.compare('SliceHouse2024', updatedUser.passwordHash)).toBe(true);
    ```
  - |
    AC10 — unregistered identifier gets the same generic success message, and no email/SMS is sent.
    ```js
    const registeredResult = await service.requestPasswordReset({ identifier: 'jordan.baker@example.com' });
    const unregisteredResult = await service.requestPasswordReset({ identifier: 'unknown@example.com' });
    expect(unregisteredResult).toEqual(registeredResult);
    expect(emailSender.sendResetEmail).toHaveBeenCalledTimes(1); // only for the registered call
    ```
  - |
    AC11 — a reset link older than 1 hour is rejected as expired.
    ```js
    const { token } = await createTestResetRequest({ resetRepository, resetTokenExpiresAt: new Date(Date.now() - 1000) });
    const result = await service.verifyResetLink({ token });
    expect(result).toEqual({ valid: false, reason: 'expired' });
    ```
  - |
    AC12 — an OTP older than 5 minutes is rejected as expired.
    ```js
    const { requestId } = await createTestResetRequest({ resetRepository, otpCode: '482913', otpExpiresAt: new Date(Date.now() - 1000) });
    const result = await service.verifyOtp({ requestId, otp: '482913' });
    expect(result).toEqual({ valid: false, reason: 'expired' });
    ```
  - |
    AC13 — 3 incorrect OTP attempts locks out further attempts on that request.
    ```js
    const { requestId } = await createTestResetRequest({ resetRepository, otpCode: '482913' });
    await service.verifyOtp({ requestId, otp: '000000' });
    await service.verifyOtp({ requestId, otp: '111111' });
    await service.verifyOtp({ requestId, otp: '222222' });
    const lockedAttempt = await service.verifyOtp({ requestId, otp: '482913' }); // even the correct code
    expect(lockedAttempt).toEqual({ valid: false, reason: 'locked' });
    ```
  - |
    AC14 — a password that fails the policy is rejected and the account is not updated.
    ```js
    const { requestId, userId } = await createTestResetRequest({ resetRepository });
    const before = await userRepository.findById(userId);
    const result = await service.setNewPassword({ requestId, newPassword: 'abc123', confirmPassword: 'abc123' });
    expect(result).toEqual({ success: false, reason: 'policy_violation' });
    const after = await userRepository.findById(userId);
    expect(after.passwordHash).toBe(before.passwordHash);
    ```
  - |
    AC15 — using one method (link or OTP) invalidates the other outstanding method.
    ```js
    const { requestId, token, otpCode } = await createTestResetRequest({ resetRepository, otpCode: '482913' });
    await service.verifyResetLink({ token }); // uses the link
    const otpResult = await service.verifyOtp({ requestId, otp: otpCode });
    expect(otpResult).toEqual({ valid: false, reason: 'invalidated' });
    ```
  - |
    AC16 — a 6th reset request within an hour for the same identifier sends no new link/OTP.
    ```js
    for (let i = 0; i < 5; i += 1) {
      await service.requestPasswordReset({ identifier: 'sam.rivera@example.com' });
    }
    emailSender.sendResetEmail.mockClear();
    smsSender.sendOtpSms.mockClear();
    await service.requestPasswordReset({ identifier: 'sam.rivera@example.com' }); // 6th request
    expect(emailSender.sendResetEmail).not.toHaveBeenCalled();
    expect(smsSender.sendOtpSms).not.toHaveBeenCalled();
    ```

assumptions_or_open_questions:
  - |
    The repository has no existing backend, frontend framework, package.json, or test runner at
    all (verified: no `package.json` anywhere, no `src`/`api` directories). This plan therefore
    bootstraps a plain Node.js + Express backend and static HTML/CSS/JS frontend pages as the
    minimal concrete stack to make the ACs testable — this is a genuine architectural choice, not
    dictated by any existing convention, and should be confirmed/redirected if a different stack
    is actually intended for this project.
  - |
    No database/persistence layer exists either. The plan uses simple in-memory repositories
    (`userRepository.js`, `passwordResetRepository.js`) sufficient for the ACs and for tests;
    choosing a real production data store is treated as a separate, later decision.
  - |
    AC9 (Facebook accounts): the approved design itself flags this as unresolved — its own
    reviewer-notes panel and the `#facebook-callout` block both say the chosen approach (letting
    the user set an app password for the first time, which then coexists with Facebook Login)
    "needs explicit product sign-off before build" (design lines 538, 776-780). This plan
    implements that approach as drawn in the design (it is the only approach the approved
    prototype actually shows), but the reviewer should treat AC9/scope item 5-6-9 as contingent
    on that sign-off actually happening before merge.
  - |
    Real Facebook OAuth login (the "Continue with Facebook" button on the login screen) is out
    of scope for this story — the design's own tooltip on that button says "Not simulated in
    this prototype — shown for context on the Facebook account scenario" (design line 585). The
    button is rendered for visual parity only.
  - |
    AC14 says password must meet "the existing sign-up password policy," but no sign-up flow
    exists anywhere in this repo to source that policy from. The plan uses exactly the policy
    encoded in the approved design's `FIXTURES.passwordPolicy` regex and its three policy-list
    bullets (8+ characters, upper+lower case, at least one digit) as the authoritative source.
  - |
    The prototype's client-side JS is fixture-only (a single hardcoded correct OTP, no real
    request-id handling) and doesn't show how a real frontend would know which reset request an
    OTP/new-password submission belongs to. This plan assumes `POST /api/auth/forgot-password`
    returns an opaque `requestId` that the frontend threads through (query param for the link
    flow via the emailed URL, sessionStorage between the sent/OTP/set-password pages) — this
    hand-off mechanism isn't shown in the design and should be double-checked against reviewer
    expectations.
  - |
    Email/SMS are wired to real providers (Nodemailer/SMTP and Twilio) behind sender interfaces
    so the service layer can be tested with fakes; actual SMTP/Twilio account credentials and
    configuration are an operational concern outside this plan and will need to be provisioned
    before any deployed environment can send real messages.
  - |
    AC16's rate limit and AC13's lockout are both scoped strictly to identifier/request as the
    ACs specify; no IP-based abuse protection is added since it isn't called for by any AC.

package_dependencies:
  - name: express
    version: ^4.19.2
    ecosystem: npm
    rationale: |
      HTTP server/router for the auth API and for serving the static frontend pages — no web
      framework exists in the repo today.
  - name: bcrypt
    version: ^5.1.1
    ecosystem: npm
    rationale: |
      Hashing/verifying the app-managed password (AC7, AC8, AC9) — no password-hashing library
      exists in the repo today.
  - name: nodemailer
    version: ^6.9.14
    ecosystem: npm
    rationale: |
      Sends the actual password-reset email required by AC2.
  - name: twilio
    version: ^5.2.2
    ecosystem: npm
    rationale: |
      Sends the actual OTP SMS required by AC3.
  - name: jest
    version: ^29.7.0
    ecosystem: npm
    rationale: |
      Test runner for the test-first service/unit tests listed above — no test runner exists in
      the repo today.
  - name: supertest
    version: ^7.0.0
    ecosystem: npm
    rationale: |
      HTTP-level integration testing of the Express routes and static file responses (AC1).
  - name: jest-environment-jsdom
    version: ^29.7.0
    ecosystem: npm
    rationale: |
      DOM environment for the one client-side unit test (`passwordMatch.js`); Jest 28+ requires
      this as a separate package for jsdom-based tests.

notes: |
  This is a greenfield story from a codebase perspective: the only pre-existing artifacts are the
  design-system token bootstrap and the approved HTML prototype. All file paths above are new.

  ```mermaid
  flowchart TD
    subgraph Frontend["Static pages (public/)"]
      LoginPage["login.html + js/login.js"]
      ForgotPage["forgot-password.html + js/forgotPassword.js"]
      SentPage["forgot-password-sent.html"]
      LinkPage["reset-link.html + js/resetLink.js"]
      OtpPage["reset-otp.html + js/resetOtp.js"]
      SetPwPage["set-password.html + js/setPassword.js"]
    end
    subgraph Backend["Express app (src/)"]
      Routes["routes/authRoutes.js"]
      Service["services/passwordResetService.js"]
      AuthSvc["services/authService.js"]
      UserRepo["services/userRepository.js"]
      ResetRepo["services/passwordResetRepository.js"]
      EmailSender["notifiers/emailSender.js"]
      SmsSender["notifiers/smsSender.js"]
      Policy["utils/passwordPolicy.js"]
      Tokens["utils/tokens.js"]
    end

    LoginPage -- "POST /api/auth/login (AC8)" --> Routes
    ForgotPage -- "POST /api/auth/forgot-password (AC1-3,10,16)" --> Routes
    LinkPage -- "POST /api/auth/reset/verify-link (AC4,11)" --> Routes
    OtpPage -- "POST /api/auth/reset/verify-otp (AC5,6,12,13)" --> Routes
    SetPwPage -- "POST /api/auth/reset/set-password (AC7,9,14,15)" --> Routes
    Routes --> Service
    Routes --> AuthSvc
    Service --> UserRepo
    Service --> ResetRepo
    Service --> EmailSender
    Service --> SmsSender
    Service --> Policy
    Service --> Tokens
    AuthSvc --> UserRepo

    classDef touched fill:#f96,color:#000;
    class LoginPage,ForgotPage,SentPage,LinkPage,OtpPage,SetPwPage,Routes,Service,AuthSvc,UserRepo,ResetRepo,EmailSender,SmsSender,Policy,Tokens touched;
  ```

  Design citations used throughout this plan refer to line numbers in
  `.arc/designs/MANOJ-FIGMA-PIZZA-STORY-027-design.html` as read during planning (e.g. lines
  556-589 for the login screen, 595-623 for the identifier-entry screen, 628-657 for the generic
  confirmation screen, 662-685 for the email-link screen, 691-730 for the OTP screen, 736-791 for
  the set-new-password screen including the Facebook variant, and 796-803 for the login-success
  placeholder). The reviewer-only chrome (sticky reviewer bar, scenario/demo chips, dashed
  design-decision callouts) is called out by name wherever it is deliberately excluded from the
  real product pages.
