# DELIVN Customer Authentication + Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-grade customer authentication, database-backed sessions, authenticated checkout ownership, and strictly user-scoped account order history without changing the guest cart or existing commerce contracts.

**Architecture:** Pin Better Auth 1.7.17 over the existing Drizzle/PostgreSQL database, mount its official Next.js handler, and validate full database sessions at every protected page and mutation. Add nullable UUID order ownership for historical compatibility; the checkout route supplies the authenticated user ID to the existing transaction, while customer order repositories scope every read directly by that ID.

**Tech Stack:** Next.js 16.3.5 App Router, React 19.2.8, Better Auth 1.7.17, Drizzle ORM 0.45.3, PostgreSQL, Zod 4.6.5, Vitest 3.2.4, jsdom per test file, Playwright 1.63.0.

**Spec:** `docs/superpowers/specs/2026-11-05-delivn-customer-auth-account-design.md`

## Global Constraints

- Work only on `feature/customer-auth-account`; do not commit, push, merge, reset, or switch branches during implementation or review.
- Pin `better-auth` to exact version `1.7.17` with no caret/tilde. If a Better Auth companion package is genuinely required, it must also be exactly `1.7.17`; do not install any 1.8 beta package.
- Use database-backed Better Auth sessions. Do not enable stateless authorization or `session.cookieCache`.
- Keep Better Auth CSRF/origin checks and credential rate limiting enabled. Do not trust proxy headers until the Vercel deployment checklist is verified.
- Keep `allowDifferentEmails: false`; do not configure `trustedProviders: ["google"]` or any forced-link shortcut.
- Reject an unverified Google profile before user/account creation or linking; a matching unverified provider email must not implicitly link.
- Do not change `CheckoutInput` or `OrderDTO`. Browser checkout never sends `userId`, commercial snapshots, totals, or ownership data.
- Checkout page and checkout POST both require a complete database-validated session; cookie existence is never authorization.
- New order ownership comes only from `session.user.id`; historical orders remain nullable and are never backfilled by email, phone, or name.
- Customer order SQL includes `orders.userId = session.user.id` in the query predicate. Foreign and nonexistent order numbers have identical not-found behavior.
- Auth must never read, replace, clear, or rewrite `delivn.cart.v1`; guest catalog/PDP/cart remain available.
- Do not add password-reset or email-verification UI without a real delivery provider.
- Do not persist customer auth/form PII in localStorage, sessionStorage, URLs, analytics, or logs.
- Do not perform production database work. Migrations may be generated/reviewed and later validated only against approved loopback development/E2E databases.
- Keep Vitest's global environment Node; use `// @vitest-environment jsdom` only in DOM tests.
- Preserve checkout transaction locking, totals, inventory reservation, order-number, address, payment, consent, homepage, 3D, Footer design, and all other protected scope.
- Every task ends with a review checkpoint and focused green tests, not a Git commit.

## Review Focus

- **Forged ownership input:** a request containing any browser `userId` still inserts only the validated session user ID; tested in Task 6.
- **OAuth identity collision:** verified same-email Google links once, verified different-email Google creates a separate user, and unverified same-email Google creates no link; tested in Task 4.
- **Session expiry between page render and submit:** checkout returns 401 before commerce work and preserves cart/form state; tested in Tasks 6 and 7.
- **Order-number probing:** owned detail succeeds while foreign and random order numbers are indistinguishable; tested in Tasks 8 and 9.
- **Login redirect abuse:** protocol-relative, encoded/backslash, control-character, and external return paths fall back safely while the cart remains untouched; tested in Tasks 3 and 5.

---

## File structure

### Auth foundation

```text
src/server/auth/auth-environment.ts       # validate server auth environment without leaking values
src/server/auth/google-profile.ts         # pure verified-Google-profile admission rule
src/server/auth/auth.ts                   # Better Auth server instance and exact configuration
src/server/auth/session.ts                # request-header session retrieval and page guard
src/lib/auth/auth-client.ts               # browser-only Better Auth client
src/lib/auth/return-to.ts                 # pure internal return-path sanitizer
src/app/api/auth/[...all]/route.ts         # official Better Auth Next.js handler
src/server/db/schema/auth.ts               # reviewed Better Auth 1.7.17 Drizzle core schema
```

### Auth/account UI

```text
src/app/(storefront)/tai-khoan/dang-nhap/page.tsx
src/app/(storefront)/tai-khoan/dang-ky/page.tsx
src/app/(storefront)/tai-khoan/page.tsx
src/app/(storefront)/tai-khoan/don-hang/page.tsx
src/app/(storefront)/tai-khoan/don-hang/[orderNumber]/page.tsx
src/app/(storefront)/tai-khoan/don-hang/[orderNumber]/not-found.tsx
src/app/(storefront)/tai-khoan/error.tsx
src/components/auth/AuthForm.tsx
src/components/auth/AccountLink.tsx
src/components/auth/LogoutButton.tsx
src/components/account/AccountDashboard.tsx
src/components/account/OrderList.tsx
src/components/account/OrderDetail.tsx
```

### Order ownership/read model

```text
src/contracts/customer-order.ts
src/server/repositories/customer-order.repository.ts
src/server/services/customer-order.service.ts
drizzle/<generated-auth-ownership-migration>.sql
```

### Documentation and tests

```text
docs/auth/google-oauth-setup.md
docs/auth/production-auth-checklist.md
e2e/support/auth.ts
e2e/customer-auth-account.spec.ts
focused *.test.ts files beside the modules/components they exercise
```

Existing files modified only where named by tasks below: `package.json`, `package-lock.json`, `.env.example`, Drizzle schema exports, checkout route/service/repository, checkout page/client error presentation, Header/mobile navigation, legal/compliance content, demo E2E reset support, and their focused tests.

---

### Task 1: Pin Better Auth and freeze the environment/config contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`
- Create: `src/server/auth/auth-environment.ts`
- Test: `src/server/auth/auth-environment.test.ts`
- Test: `src/server/auth/dependency-version.test.ts`

**Interfaces:**
- Produces: `type AuthEnvironment = { secret: string; baseURL: string; google: { clientId: string; clientSecret: string } | null }`.
- Produces: `resolveAuthEnvironment(environment: Record<string, string | undefined>): AuthEnvironment`.
- Dependency invariant: installed `better-auth` is exactly `1.7.17`; no `@better-auth/*` or `auth` dependency may resolve to a different/beta version.

- [ ] **Step 1: Add failing dependency-version tests.** Read `package.json` and lockfile; assert `dependencies["better-auth"] === "1.7.17"`, the lock entry resolves `1.7.17`, and any committed Better Auth companion dependency has the same exact version and no `beta`/`rc` tag.
- [ ] **Step 2: Run `npm run test:run -- src/server/auth/dependency-version.test.ts`.** Expect RED because Better Auth is absent.
- [ ] **Step 3: Install only `better-auth@1.7.17` with exact saving.** Run `npm install --save-exact better-auth@1.7.17`; inspect package and lock diffs for beta/companion drift. Do not run schema generation yet.
- [ ] **Step 4: Re-run the dependency test.** Expect PASS.
- [ ] **Step 5: Add failing environment tests.** Cover a valid 32+ character secret/base URL; missing/short secret; malformed/non-http(s) base URL; both Google values present; both absent (email/password-only environment); and only one Google value present (configuration error). Assert thrown messages name variables but never include their values.
- [ ] **Step 6: Run `npm run test:run -- src/server/auth/auth-environment.test.ts`.** Expect RED because the resolver is absent.
- [ ] **Step 7: Implement the minimal pure resolver and add non-secret `.env.example` placeholders.** Do not log inputs. `google` is `null` only when both Google variables are absent.
- [ ] **Step 8: Re-run both focused tests.** Expect PASS.
- [ ] **Step 9: Review checkpoint.** Confirm only dependency metadata, environment placeholders, resolver, and tests changed; no auth runtime or migration exists yet.

### Task 2: Generate, review, and prove the auth/ownership migration

**Files:**
- Create: `src/server/db/schema/auth.ts`
- Modify: `src/server/db/schema/index.ts`
- Modify: `src/server/db/schema/orders.ts`
- Create: `src/server/auth/auth-options.ts`
- Create: `src/server/auth/auth-options.test.ts`
- Create: `src/server/auth/google-profile.ts`
- Create: `src/server/auth/google-profile.test.ts`
- Create: `src/server/db/auth-migration.integration.test.ts`
- Create: `drizzle/<generated-auth-ownership-migration>.sql`
- Modify: `drizzle/meta/*` only as produced by the pinned Drizzle generator

**Interfaces:**
- Produces Drizzle exports named `user`, `session`, `account`, and `verification`, matching Better Auth 1.7.17 adapter keys.
- Produces `orders.userId: uuid | null`, FK to `user.id`, `ON DELETE SET NULL`, `ON UPDATE RESTRICT`, and index `orders_user_id_created_at_idx`.
- Produces `createAuthOptions(environment: AuthEnvironment)` with UUID generation, DB sessions, no cookie cache, email/password, safe Google linking, and rate limiting.

- [ ] **Step 1: Add failing pure option-contract tests.** Assert `advanced.database.generateId === "uuid"`; email/password enabled with 8–128 bounds and no verification/reset sender; session cookie cache absent/disabled; rate limiting enabled; account linking has `allowDifferentEmails: false`; `trustedProviders` is absent; Google is omitted when credentials are absent; when present, Google requires verified email and uses the pre-persistence profile validator.
- [ ] **Step 2: Run `npm run test:run -- src/server/auth/auth-options.test.ts`.** Expect RED because the option builder does not exist.
- [ ] **Step 3: Add the Google-profile policy RED test.** Assert verified boolean `true` is admitted and missing, string, false, null, or malformed `email_verified` is rejected before persistence.
- [ ] **Step 4: Implement the minimal option builder and pure profile validator without constructing the auth singleton.** Keep them server-only. Wire the validator through `user.validateUserInfo` for Google sources so an unverified profile cannot reach create/link/sign-in persistence.
- [ ] **Step 5: Re-run the option/profile tests.** Expect PASS.
- [ ] **Step 6: Generate the Better Auth schema with the exact stable CLI.** Use `npx auth@1.7.17 generate` against the reviewed config. Never use `@latest`, beta, or RC. Review field names, nullability, unique constraints, indexes, relations, and UUID types before adopting the generated Drizzle output.
- [ ] **Step 7: Add `orders.userId` and run `npm run db:generate`.** The generated migration must create only the reviewed Better Auth core tables and nullable order ownership/FK/index. It must not contain product/order deletes, ownership backfill, schema reset, commercial data changes, or enum alterations.
- [ ] **Step 8: Add the failing isolated-schema migration integration test.** On approved loopback `delivn_dev`, create a random temporary schema inside a transaction, set `search_path`, create a minimal pre-migration `orders` table with every column referenced by the new ownership migration/index (including `created_at`), insert a historical order, apply the new migration statements, then assert:
  - the row still exists;
  - `user_id IS NULL`;
  - `orders.user_id` and `user.id` have the same PostgreSQL `uuid` type;
  - `orders_user_id_created_at_idx` exists;
  - a new owned order accepts the exact user UUID;
  - deleting that user changes the owned order's `user_id` to null;
  - no historical row is reassigned.
  Roll back/drop the temporary schema in `finally`; skip outside approved loopback `delivn_dev`.
- [ ] **Step 9: Run `npm run test:run -- src/server/db/auth-migration.integration.test.ts`.** Expect RED before the reviewed migration/schema is complete, then make only schema/migration corrections until PASS.
- [ ] **Step 10: Run existing database/schema tests.** `npm run test:run -- src/server/db/database.integration.test.ts`; expect existing constraints and rollback tests PASS unchanged.
- [ ] **Step 11: Review checkpoint.** Compare checked-in schema against Better Auth 1.7.17 output, confirm exact UUID parity and nullable ownership, and confirm no database command targeted production.

### Task 3: Mount Better Auth and create authoritative session/redirect helpers

**Files:**
- Create: `src/server/auth/auth.ts`
- Create: `src/server/auth/session.ts`
- Create: `src/server/auth/session.test.ts`
- Create: `src/lib/auth/return-to.ts`
- Create: `src/lib/auth/return-to.test.ts`
- Create: `src/lib/auth/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Test: `src/app/api/auth/auth-route.test.ts`

**Interfaces:**
- Produces: `auth` Better Auth server instance using `drizzleAdapter(getDb(), { provider: "pg", schema })` and Task 2 options.
- Produces: `type AuthSession = typeof auth.$Infer.Session`.
- Produces: `getSessionFromHeaders(requestHeaders: Headers): Promise<AuthSession | null>`.
- Produces: `getCurrentSession(): Promise<AuthSession | null>` using `await headers()`.
- Produces: `requirePageSession(returnTo: string): Promise<AuthSession>`; redirects anonymous users with sanitized `returnTo`.
- Produces: `sanitizeReturnTo(value: string | null | undefined, fallback: string): string`.
- Produces browser-safe `authClient = createAuthClient()` with same-origin `/api/auth`.

- [ ] **Step 1: Add failing return-path tests.** Accept `/thanh-toan`, `/tai-khoan/don-hang`, safe query/hash paths; reject `https://evil.test`, `//evil.test`, encoded/protocol backslashes, credentials, CR/LF/control characters, malformed percent encoding, empty values, and non-internal fallbacks. Assert deterministic fallback.
- [ ] **Step 2: Run `npm run test:run -- src/lib/auth/return-to.test.ts`.** Expect RED, then implement the pure sanitizer and make it PASS.
- [ ] **Step 3: Add failing session-helper tests with an injected/mockable `auth.api.getSession`.** Assert complete session returned; null remains null; database/auth exceptions propagate; page guard redirects only on null and encodes a sanitized return path.
- [ ] **Step 4: Run `npm run test:run -- src/server/auth/session.test.ts`.** Expect RED, then implement the server-only helpers and make it PASS.
- [ ] **Step 5: Create the Better Auth singleton, client, and official route handler.** Mount `toNextJsHandler(auth)` at `/api/auth/[...all]`; set Node runtime; do not add proxy/cookie-only auth. Ensure missing Google credentials omit Google rather than advertising a broken provider.
- [ ] **Step 6: Add route smoke tests.** Verify exported GET/POST handlers delegate to Better Auth and non-auth application code cannot import server auth from client modules (static import-boundary assertion).
- [ ] **Step 7: Run all Task 3 focused tests.** Expect PASS.
- [ ] **Step 8: Run `npm run build` with valid local non-production auth environment.** Confirm auth routes compile and no PostgreSQL query is executed at prerender time.
- [ ] **Step 9: Review checkpoint.** Confirm cookies/session behavior comes from Better Auth, no `proxy.ts`, no cookie cache, and no client import path reaches server/database code.

### Task 4: Prove verified matching-email Google account-linking behavior

**Files:**
- Modify/Test: `src/server/auth/google-profile.ts`
- Create: `src/server/auth/account-linking.integration.test.ts`
- Modify: `src/server/auth/auth-options.test.ts`

**Interfaces:**
- Consumes: Task 3 `auth.handler`, Task 2 schema/config, approved loopback database guard.
- Produces test-only OAuth HTTP harness that invokes Better Auth's standard Web handler and mocks only Google's token/userinfo endpoints.

- [ ] **Step 1: Add the guarded integration harness.** Generate unique synthetic emails per test; create credential users through Better Auth, initiate `/api/auth/sign-in/social`, preserve state cookies, invoke `/api/auth/callback/google`, stub Google token/userinfo responses, and clean only exact synthetic auth users/accounts/sessions in `finally`. Skip unless `DATABASE_URL` is approved loopback `delivn_dev`.
- [ ] **Step 2: Add the verified same-email RED test.** Create an email/password identity, return a verified Google profile with the same normalized email, complete OAuth, then assert exactly one DELIVN `user` row exists and both credential + Google accounts reference that same user ID.
- [ ] **Step 3: Add the verified different-email RED test.** Start from one credential user, complete verified Google OAuth with another email, and assert two user IDs exist with no account crossing.
- [ ] **Step 4: Add the unverified matching-email RED test.** Start from a credential user, return the same email with `email_verified: false`, and assert OAuth produces no session, no Google account row, and no change to the credential user's linked accounts.
- [ ] **Step 5: Run `npm run test:run -- src/server/auth/account-linking.integration.test.ts`.** Expect the tests to expose any configuration/hook gap; make only minimal Task 2/3 config corrections.
- [ ] **Step 6: Re-run auth option/unit tests and linking integration tests.** Expect PASS, including explicit assertions that `allowDifferentEmails` is false and `trustedProviders` is absent.
- [ ] **Step 7: Review checkpoint.** Inspect the auth config for any forced provider trust, different-email linking, profile mutation, or broader Google scope; none is allowed.

### Task 5: Build registration, login, logout, and header account navigation

**Files:**
- Create: `src/components/auth/AuthForm.tsx`
- Create: `src/components/auth/AuthForm.test.ts`
- Create: `src/components/auth/LogoutButton.tsx`
- Create: `src/components/auth/LogoutButton.test.ts`
- Create: `src/components/auth/AccountLink.tsx`
- Create: `src/components/auth/AccountLink.test.ts`
- Create: `src/app/(storefront)/tai-khoan/dang-nhap/page.tsx`
- Create: `src/app/(storefront)/tai-khoan/dang-ky/page.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/MobileMenuButton.tsx`
- Modify: `src/components/layout/Header.test.ts`

**Interfaces:**
- Consumes: `authClient`, `sanitizeReturnTo`, and Better Auth's `signIn.email`, `signUp.email`, `signIn.social`, `signOut`, `useSession`.
- Produces: `AuthForm({ mode, returnTo, googleEnabled })`, `AccountLink`, and `LogoutButton`.

- [ ] **Step 1: Add jsdom RED tests for registration/login.** Assert semantic labels/autocomplete; name required only for registration; password 8–128 and confirmation match; synchronous double-submit guard; safe generic credential/duplicate errors; Google control shown only when enabled; Google call has provider `google` and sanitized callback URL; successful email flow uses sanitized destination.
- [ ] **Step 2: Add privacy/cart RED assertions.** Preload `delivn.cart.v1`, complete mocked login/register/logout, and assert the exact cart string is unchanged; assert email/name/password never appear in localStorage, sessionStorage, or URL.
- [ ] **Step 3: Run `npm run test:run -- src/components/auth/AuthForm.test.ts src/components/auth/LogoutButton.test.ts`.** Expect RED, implement the smallest accessible client components, then make PASS. Do not render reset/verification links.
- [ ] **Step 4: Add AccountLink/Header RED tests.** Guest initial state links to `/tai-khoan/dang-nhap`; authenticated state links to `/tai-khoan`; desktop/mobile each expose one account entry; session-loading state remains layout-stable and non-authoritative.
- [ ] **Step 5: Run `npm run test:run -- src/components/auth/AccountLink.test.ts src/components/layout/Header.test.ts`.** Expect RED, integrate the small client link without converting Header/storefront layout to a Client Component, then make PASS.
- [ ] **Step 6: Add login/register Server Component pages.** Await Next.js 16 search params; sanitize return path; redirect already-authenticated users; pass only a boolean Google capability flag, never credentials.
- [ ] **Step 7: Static-review copy and accessibility.** Labels, live errors, busy/disabled state, keyboard submit, focus, reduced motion, and Vietnamese generic errors must be present; no account-enumeration claim.
- [ ] **Step 8: Review checkpoint.** Confirm guest cart remains independent and no PII/storage/query-string regression exists.

### Task 6: Require authentication for checkout and derive ownership on the server

**Files:**
- Modify: `src/app/(storefront)/thanh-toan/page.tsx`
- Test: `src/app/(storefront)/thanh-toan/page.test.ts`
- Modify: `src/app/api/checkout/route.ts`
- Create/Test: `src/app/api/checkout/route.test.ts`
- Modify: `src/server/http/api-errors.ts`
- Modify: `src/server/http/api-errors.test.ts`
- Modify: `src/server/services/checkout.service.ts`
- Modify: `src/server/services/checkout.service.test.ts`
- Modify: `src/server/repositories/order.repository.ts`
- Modify: `src/server/db/schema/orders.ts` only as already established by Task 2

**Interfaces:**
- Produces: `type CheckoutOwnership = { userId: string }`.
- Changes service call to `createOrder(input: NormalizedCheckoutInput, ownership: CheckoutOwnership): Promise<OrderDTO>`.
- Extends `NewOrder` with required `userId: string` while leaving `CheckoutInput` and `OrderDTO` untouched.
- Produces `authenticationRequiredResponse(): Response` with HTTP 401 and code `AUTHENTICATION_REQUIRED`.

- [ ] **Step 1: Add checkout page RED tests.** Anonymous session redirects to login with `/thanh-toan`; valid session renders `CheckoutClient`; auth infrastructure exception propagates; no cookie-only shortcut is used.
- [ ] **Step 2: Add checkout route RED tests.** Anonymous request returns exact 401 envelope before JSON parsing/service invocation; valid session validates canonical input and passes `session.user.id`; auth failure propagates to safe 500; a body containing forged `userId` cannot affect ownership.
- [ ] **Step 3: Add checkout service RED tests.** Every successful insert contains the required ownership user ID; existing locked-price/snapshot/reservation tests remain unchanged; all failure/rollback cases write no owned order; service cannot be called without ownership at compile time.
- [ ] **Step 4: Run `npm run test:run -- src/app/(storefront)/thanh-toan/page.test.ts src/app/api/checkout/route.test.ts src/server/services/checkout.service.test.ts src/server/http/api-errors.test.ts`.** Quote PowerShell paths as needed. Expect RED.
- [ ] **Step 5: Implement page and API session gates, stable 401 helper, required ownership service argument, and repository insert field.** Obtain session before request parsing/commerce work. Do not change lock order, transaction boundaries, totals, inventory, customer snapshots, payment status, order number, or response DTO.
- [ ] **Step 6: Re-run focused tests.** Expect PASS.
- [ ] **Step 7: Run checkout schema/normalization/money/order tests.** Expect all existing backend behavior PASS.
- [ ] **Step 8: Review checkpoint.** Inspect the POST payload and types: no `userId` in `CheckoutInput`; only the server session supplies ownership.

### Task 7: Handle session expiry in checkout without losing cart

**Files:**
- Modify: `src/lib/checkout/checkout-errors.ts`
- Modify: `src/lib/checkout/checkout-errors.test.ts`
- Modify: `src/components/checkout/CheckoutClient.tsx`
- Modify: `src/components/checkout/CheckoutClient.test.ts`

**Interfaces:**
- Consumes: stable `AUTHENTICATION_REQUIRED` API error and existing uncertain/success/cart reconciliation lifecycle.
- Produces a deterministic session-expired presentation with a sanitized login link returning to `/thanh-toan`.

- [ ] **Step 1: Add RED error-mapping test.** 401 code maps to safe Vietnamese session-expired guidance and a login action; raw backend details are not shown.
- [ ] **Step 2: Add jsdom RED component test.** During submit, return 401; assert cart unchanged, no reconciliation, controlled form values remain mounted, no automatic POST retry/redirect, and the login link targets the sanitized checkout return path.
- [ ] **Step 3: Run `npm run test:run -- src/lib/checkout/checkout-errors.test.ts src/components/checkout/CheckoutClient.test.ts`.** Expect RED.
- [ ] **Step 4: Implement the narrow mapping/UI state.** Preserve existing double-submit and uncertain-outcome behavior.
- [ ] **Step 5: Re-run focused checkout tests.** Expect PASS.
- [ ] **Step 6: Review checkpoint.** Confirm login navigation may lose in-memory form values after leaving the page but never loses/reconciles cart or claims order success.

### Task 8: Add customer order read contracts, repository, and service

**Files:**
- Create: `src/contracts/customer-order.ts`
- Modify: `src/contracts/index.ts`
- Create: `src/server/repositories/customer-order.repository.ts`
- Create: `src/server/repositories/customer-order.repository.test.ts`
- Create: `src/server/services/customer-order.service.ts`
- Create: `src/server/services/customer-order.service.test.ts`

**Interfaces:**
- Produces `CustomerOrderSummaryDTO` with `orderNumber`, `totalVnd`, payment method/status, order status, `createdAt`, and `itemCount`.
- Produces `CustomerOrderDetailDTO` with summary, customer delivery snapshots, subtotal/shipping/total, note, item snapshots, and status history; no `userId` or auth secrets.
- Produces repository methods:
  - `listByUserId(userId: string): Promise<CustomerOrderRecord[]>`
  - `findDetailByOrderNumberAndUserId(orderNumber: string, userId: string): Promise<CustomerOrderDetailRecord | null>`
- Produces service methods mapping records/dates to DTOs.

- [ ] **Step 1: Add RED repository tests using an injectable query boundary.** Assert list predicate always contains user ID, null-owner/foreign rows are excluded, newest-first plus deterministic secondary ordering, and detail combines order number + user ID in the same lookup rather than post-fetch authorization.
- [ ] **Step 2: Add RED service/DTO tests.** Assert Date -> ISO, item/status/customer/financial snapshots mapped, empty list preserved, null detail preserved, and serialized output excludes `userId`, password/session/account/provider/token/inventory fields.
- [ ] **Step 3: Run `npm run test:run -- src/server/repositories/customer-order.repository.test.ts src/server/services/customer-order.service.test.ts`.** Expect RED.
- [ ] **Step 4: Implement minimal repository and mapper/service.** Use existing schema/status types and integer money; do not expose raw rows.
- [ ] **Step 5: Re-run focused tests.** Expect PASS.
- [ ] **Step 6: Add guarded PostgreSQL negative-access integration assertions.** Create two users and owned orders in a transaction; verify each list/detail sees only its own data and foreign/random order lookups both return null; roll back.
- [ ] **Step 7: Review checkpoint.** Inspect SQL predicates for IDOR resistance and DTO fields for auth/internal leakage.

### Task 9: Build protected account dashboard, My Orders, and Order Detail

**Files:**
- Create: `src/app/(storefront)/tai-khoan/page.tsx`
- Create: `src/app/(storefront)/tai-khoan/don-hang/page.tsx`
- Create: `src/app/(storefront)/tai-khoan/don-hang/[orderNumber]/page.tsx`
- Create: `src/app/(storefront)/tai-khoan/don-hang/[orderNumber]/not-found.tsx`
- Create: `src/app/(storefront)/tai-khoan/error.tsx`
- Create: `src/components/account/AccountDashboard.tsx`
- Create: `src/components/account/AccountDashboard.test.ts`
- Create: `src/components/account/OrderList.tsx`
- Create: `src/components/account/OrderList.test.ts`
- Create: `src/components/account/OrderDetail.tsx`
- Create: `src/components/account/OrderDetail.test.ts`
- Test: route-focused tests beside account route helpers where practical

**Interfaces:**
- Consumes: `requirePageSession`, customer-order service, DTOs, and `LogoutButton`.
- Produces protected server-rendered account routes and presentational account components.

- [ ] **Step 1: Add RED presentational tests.** Dashboard shows name/email, My Orders link, and logout but no internal ID/tokens; list handles empty and populated DTOs; detail shows order/customer/item/status/authoritative total snapshots responsively and no inventory/auth internals.
- [ ] **Step 2: Add route RED tests.** Anonymous routes redirect; owned detail renders; service null calls `notFound()`; foreign and random order numbers follow the same not-found branch; infrastructure errors propagate to the branded error boundary.
- [ ] **Step 3: Run the focused account test set.** Expect RED.
- [ ] **Step 4: Implement Server Component routes and presentational components.** Await Next.js 16 params, call session guard before data access, and keep data fetching out of client components.
- [ ] **Step 5: Implement branded not-found/error states.** Do not expose whether a foreign order exists or leak database details.
- [ ] **Step 6: Re-run focused tests.** Expect PASS.
- [ ] **Step 7: Static responsive/accessibility review.** Verify 1440/1280/1024/768/390 layouts, semantic headings/definitions/lists, focus, text status, no mobile table overflow, and restrained DELIVN styling.
- [ ] **Step 8: Review checkpoint.** Confirm all customer data paths are server-scoped and no account page imports cart storage or client database code.

### Task 10: Connect checkout success to durable owned order access

**Files:**
- Modify: `src/components/checkout/CheckoutClient.tsx`
- Modify: `src/components/checkout/CheckoutClient.test.ts`

**Interfaces:**
- Consumes: existing validated `OrderDTO.orderNumber` and protected detail route.
- Produces a success-state link to `/tai-khoan/don-hang/{encodeURIComponent(orderNumber)}`.

- [ ] **Step 1: Add RED success test.** After `201 + runtime-valid OrderDTO`, assert submitted cart reconciliation still occurs once, authoritative total remains, and a safe order-detail link uses the returned order number.
- [ ] **Step 2: Add non-success regression assertions.** Known error, 401, network uncertainty, malformed 201, and double submit produce no detail link and no cart reconciliation.
- [ ] **Step 3: Run `npm run test:run -- src/components/checkout/CheckoutClient.test.ts`.** Expect RED.
- [ ] **Step 4: Add the minimal link without changing success semantics.** Do not add a public GET order API or put customer data in the URL.
- [ ] **Step 5: Re-run the component and cart provider/reducer tests.** Expect PASS.
- [ ] **Step 6: Review checkpoint.** Confirm the detail route remains the authorization boundary and OrderDTO remains unchanged.

### Task 11: Extend guarded E2E reset and customer journey coverage

**Files:**
- Create: `e2e/support/auth.ts`
- Create: `e2e/customer-auth-account.spec.ts`
- Modify: `e2e/global-setup.ts`
- Modify: `src/server/demo/demo-service.ts` and repository/tests only if exact auth-test cleanup cannot remain in E2E support
- Modify: related guarded demo tests if reset protocol is extended

**Interfaces:**
- Produces deterministic E2E identities scoped to `delivn_e2e` and exact cleanup helpers.
- Consumes existing demo seed/reset, storefront flow, and Better Auth HTTP/UI routes.

- [ ] **Step 1: Add RED guard tests for auth cleanup.** Cleanup must refuse production, non-loopback, non-`delivn_e2e`, or missing explicit demo opt-in; it may delete only exact deterministic E2E emails and their sessions/accounts after demo-owned orders/items/history are removed. It must never delete arbitrary users or historical null-owner orders.
- [ ] **Step 2: Implement the smallest guarded cleanup.** Prefer E2E support code over broadening production/demo service protocols. Preserve existing mixed-order and fixture ownership guards.
- [ ] **Step 3: Add E2E scenario tests.** Cover email registration, logout/login, anonymous checkout redirect and safe return, cart survival, authenticated checkout, My Orders, own detail, second-user foreign detail denial, random detail denial, and logout while cart remains.
- [ ] **Step 4: Add browser assertions for no reset/verification UI and no browser-controlled `userId` in checkout POST.** Inspect request body; it remains canonical customer/payment/items only.
- [ ] **Step 5: Run focused guard/unit tests.** Expect PASS before browser E2E.
- [ ] **Step 6: Run `npm run test:e2e` only with approved loopback `delivn_e2e`, migrations applied, explicit demo opt-in, a synthetic auth secret, and `BETTER_AUTH_URL=http://127.0.0.1:3100` matching the Playwright server.** Google OAuth remains mocked/unit-integrated; do not use real credentials in CI.
- [ ] **Step 7: Review checkpoint.** Confirm test cleanup cannot target `delivn_dev` or production and does not weaken existing demo guards.

### Task 12: Documentation, privacy disclosure, and Vercel security checklist

**Files:**
- Create: `docs/auth/google-oauth-setup.md`
- Create: `docs/auth/production-auth-checklist.md`
- Modify: `.env.example`
- Modify: `src/data/legal.ts`
- Modify: `docs/compliance/ecommerce-compliance-audit.md`
- Modify/Test: `src/components/legal/LegalMetadata.test.ts` or focused legal tests as appropriate

**Interfaces:**
- Documents configuration and operational checks only; no secret values.

- [ ] **Step 1: Add RED documentation/content tests.** Assert privacy content discloses account identity, database sessions, Google sign-in, order-account linkage, purposes, and pending retention/rights decisions without claiming final policy; legal metadata updated consistently.
- [ ] **Step 2: Implement the minimal legal/compliance update.** Do not invent retention periods, support promises, verification email, or provider data usage beyond authentication.
- [ ] **Step 3: Write Google setup runbook.** Include exact local/production callback URLs, `BETTER_AUTH_URL`, Google consent-screen requirements, least identity scopes, environment separation, and no committed credentials.
- [ ] **Step 4: Write production auth checklist.** Require verification of:
  - exact Better Auth 1.7.17 lock and reviewed migrations;
  - strong rotated `BETTER_AUTH_SECRET` and production `BETTER_AUTH_URL`;
  - HTTPS secure/httpOnly/SameSite cookie behavior;
  - Google production callback and consent configuration;
  - database backup/rollback and historical null-owner preservation;
  - Vercel's actual client-IP/forwarded-header behavior before configuring Better Auth `ipAddressHeaders`, `trustedProxies`, or `advanced.trustedProxyHeaders`;
  - rate-limit behavior under Vercel proxies and multi-instance/serverless execution, with no assumption that client-supplied forwarded headers are trustworthy;
  - full-session authorization on pages/API and negative IDOR checks;
  - no cookie cache/stateless authorization and no secret/PII logging.
- [ ] **Step 5: Run focused legal/document tests and `rg` checks for placeholders/secrets.** Expect PASS and no real secret/token/account data.
- [ ] **Step 6: Review checkpoint.** Confirm documentation does not perform or instruct production DB mutation as part of automated validation.

### Task 13: Full regression, migration/live validation, browser QA, and implementation review

**Files:**
- No new feature scope; only fixes directly required by failing approved tests/review.

**Interfaces:**
- Verifies all earlier task outputs as one system.

- [ ] **Step 1: Run focused suites in dependency order.** Auth environment/options/return path/session; schema/migration; account linking; auth UI/header; checkout route/service/client; customer order repository/service; account components/routes; cart regressions; demo guards.
- [ ] **Step 2: Run `npm run test:run`.** Expect all existing backend, F1–F5.5, compliance/address, cart/checkout, and new auth/account tests PASS. Confirm Node remains global Vitest environment and jsdom is file-scoped.
- [ ] **Step 3: Run `npm run lint`.** Expect zero errors.
- [ ] **Step 4: Run `npm run build`.** Expect success; protected auth/account/checkout routes are request-time and no live PostgreSQL access occurs during prerender.
- [ ] **Step 5: Run `git diff --check`.** Expect no whitespace errors.
- [ ] **Step 6: Review migration statically and apply only to approved loopback development/E2E databases after explicit target verification.** Verify effective URL host is loopback and database is exactly intended; never run production migration. Run guarded PostgreSQL integration and schema-drift checks.
- [ ] **Step 7: Run live email/password journey against local data.** Verify register/login/logout, cart survival, checkout ownership, My Orders/detail, and cross-user 404. Do not seed or alter production data.
- [ ] **Step 8: Run Google manual QA only if approved local credentials exist.** Verify callback, verified same-email identity reuse, different-email separation, and cart return. Otherwise report `GOOGLE_OAUTH_MANUAL_QA_DEFERRED_NO_CREDENTIALS`.
- [ ] **Step 9: Perform desktop/mobile browser QA at 1440, 1280, 1024, 768, and 390.** Capture login, registration, account dashboard, orders list/detail, checkout redirect/return, and mobile header screenshots; inspect overflow, keyboard focus, errors, and cart count persistence.
- [ ] **Step 10: Security/static review.** Run searches for browser `userId`, cookie-only auth, cookie cache/stateless settings, forced `trustedProviders`, `allowDifferentEmails: true`, raw SQL/order lookup without user scope, auth PII storage/logs, beta Better Auth dependencies, fake reset/verification, and protected-scope changes.
- [ ] **Step 11: Whole-branch implementation review.** Verify spec/plan coverage, IDOR negatives, OAuth link semantics, checkout trust boundary, migration safety, session failure semantics, compliance disclosures, and no scope creep. Fix only confirmed issues and rerun affected + full validation.
- [ ] **Step 12: Final Git evidence.** Report branch, HEAD, `git status --short`, `git diff --stat`, migration files, dependency versions, tests/lint/build/diff checks, DB/live/Google/browser results, protected-scope confirmation, and explicitly confirm no commit/push/merge occurred.

---

## Plan self-review

- **Spec coverage:** Every approved capability maps to Tasks 1–13; no implementation begins before dependency/config tests, and no production database action is planned.
- **Account linking amendment:** The plan combines `allowDifferentEmails: false`, absence of `trustedProviders`, Google's verified-email requirement, and a pre-persistence profile validator. Task 4 proves all three requested identity outcomes through the Better Auth handler.
- **Type consistency:** `user.id` and `orders.user_id` are both PostgreSQL UUID. Checkout ownership is a required server-only `{ userId }` context; the browser contract remains unchanged.
- **Authorization:** Pages and mutations validate full sessions. Order list/detail SQL is user-scoped, and foreign/missing detail is indistinguishable.
- **Cart and privacy:** Auth never touches `delivn.cart.v1`; auth/customer PII never enters browser storage/URLs/logs.
- **Deployment safety:** Vercel IP/proxy/rate-limit behavior is an explicit pre-production verification, not an assumed trusted-header configuration.
- **Version safety:** Better Auth and any companion tooling are exact `1.7.17`; CLI commands never use `latest` or beta.
- **Scope:** No reset/verification email, account recovery, admin/RBAC, guest-order claiming, server cart, gateway, shipping API, or protected visual redesign is included.
- **Git discipline:** Plan checkpoints replace commit steps because the user explicitly prohibited commit/push/merge until implementation review.
