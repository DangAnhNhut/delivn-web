# DELIVN Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete secure Google login/registration through the existing Better Auth 1.7.17 architecture without changing sessions, order ownership, shipping, or commerce behavior.

**Architecture:** Keep the official `/api/auth/[...all]` handler and the existing database-backed Better Auth session. Enable Google only when both server-only credentials exist, explicitly request only `openid email profile`, require verified Google profiles and verified local identities for implicit same-email linking, and keep OAuth initiation/error state inside the existing focused auth form.

**Tech Stack:** Next.js 16.3.5 App Router, React 19, Better Auth 1.7.17, Drizzle/PostgreSQL, Vitest/jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-05-delivn-customer-auth-account-design.md` plus the owner-provided “DELIVN — IMPLEMENT GOOGLE LOGIN WITH BETTER AUTH” brief dated 2026-11-18.

## Global Constraints

- Keep Better Auth pinned exactly to `1.7.17`; add no auth package or migration.
- Never expose or log Google credentials, OAuth codes/tokens, cookies, or session tokens.
- Preserve database-backed sessions, safe `returnTo`, cart storage, session-derived order ownership, and IDOR protections.
- Do not modify shipping/carrier code, prices, inventory, BCT policies, or checkout business rules.
- Real Google OAuth is manual-only when approved credentials exist; CI uses provider-boundary tests.

## Review Focus

- A single missing Google environment variable must fail closed without leaking its value.
- A pre-registered but unverified local email must not be implicitly linked to a verified Google identity.
- Rapid Google-button activation must initiate only one OAuth request and recover safely if initiation fails.
- OAuth callback errors/cancellation must show generic Vietnamese guidance without rendering raw provider data.
- Malformed/external `returnTo` values must never reach `callbackURL` or `errorCallbackURL`.

---

### Task 1: Provider configuration and environment contract

**Files:**
- Modify: `.env.example`
- Modify: `src/server/auth/auth-options.ts`
- Modify: `src/server/auth/auth-options.test.ts`
- Modify: `src/server/auth/auth-environment.test.ts`

**Interfaces:**
- Consumes: `resolveAuthEnvironment(process.env): AuthEnvironment`.
- Produces: Google provider options with explicit minimal scopes and safe linking policy.

- [ ] Add failing assertions for explicit `openid email profile` scope, `requireLocalEmailVerified: true`, absent `trustedProviders`, complete/partial env behavior, and placeholder-only `.env.example` values.
- [ ] Run the focused tests and verify the new configuration assertions fail for the current implementation.
- [ ] Implement the minimal provider option changes without changing the schema or package versions.
- [ ] Re-run focused configuration tests and verify PASS.

### Task 2: OAuth initiation and safe error UX

**Files:**
- Create: `src/lib/auth/google-oauth.ts`
- Create: `src/lib/auth/google-oauth.test.ts`
- Modify: `src/components/auth/AuthForm.tsx`
- Modify: `src/components/auth/AuthForm.test.ts`
- Modify: `src/app/(storefront)/tai-khoan/dang-nhap/page.tsx`
- Modify: `src/app/(storefront)/tai-khoan/dang-ky/page.tsx`

**Interfaces:**
- Produces: `buildGoogleOAuthErrorCallback(mode, returnTo): string` and a generic OAuth error presentation.
- Consumes: sanitized internal destination and `authClient.signIn.social`.

- [ ] Add failing pure/component tests for safe callback/error URLs, hidden/visible button, loading/double-click blocking, initiation rejection, cancellation/provider error presentation, and cart preservation.
- [ ] Run focused tests and verify RED for the missing behavior.
- [ ] Implement a synchronous in-flight guard, generic safe error state, fixed-height button loading copy, and server-provided callback error flag.
- [ ] Re-run focused OAuth UI tests and verify PASS.

### Task 3: Account-linking security boundaries

**Files:**
- Modify: `src/server/auth/account-linking.integration.test.ts`
- Modify: `docs/auth/google-oauth-setup.md`
- Modify: `docs/auth/production-auth-checklist.md`

**Interfaces:**
- Consumes: Better Auth callback flow and existing auth tables.
- Produces: durable proof for verified local+Google linking, repeat Google sign-in, different-email separation, and unverified-local/provider rejection.

- [ ] Add failing integration cases for repeat Google sign-in without duplicate accounts and rejection of a matching unverified local identity.
- [ ] Adjust the verified same-email fixture to represent an actually verified local identity.
- [ ] Run guarded integration tests against loopback `delivn_dev`; verify expected RED/GREEN transitions.
- [ ] Document exact 1.7.17 linking behavior, callback URIs, minimal scopes, and manual Google Cloud/Vercel steps without credentials.

### Task 4: Regression, review, and delivery

**Files:**
- Review all branch changes; no new application scope.

**Interfaces:**
- Produces: a reviewable feature commit on `feature/google-oauth`.

- [ ] Run focused tests, full Vitest with loopback PostgreSQL integration, `npx tsc --noEmit`, lint, build, and `git diff --check`.
- [ ] Run all guarded Playwright specs; real Google OAuth remains manual unless local credentials are present.
- [ ] Verify no migration, secret, shipping, product, inventory, compliance-policy, or checkout-business change exists.
- [ ] Request a fresh whole-branch code review and fix Critical/Important findings test-first.
- [ ] Commit the approved feature branch without merging, pushing, or modifying production.
