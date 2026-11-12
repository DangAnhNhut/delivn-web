# DELIVN Customer Authentication + Account Design

**Date:** 2026-11-05
**Status:** Proposed for approval
**Branch:** `feature/customer-auth-account`
**Scope:** Customer email/password authentication, Google OAuth, database-backed sessions, authenticated checkout ownership, account dashboard, My Orders, and customer-owned Order Detail. No admin, authorization roles, password-reset email, payment gateway, or order-management workflow.

## 1. Intent and success criteria

This phase adds a durable customer identity boundary to the existing DELIVN storefront without changing the guest catalog/cart experience or weakening the transactional commerce backend.

The phase succeeds when:

- customers can register and sign in with email/password or Google, and sign out;
- sessions are opaque-cookie, database-backed sessions managed by Better Auth;
- guest browsing, PDP use, and the existing versioned local cart continue to work;
- `/thanh-toan` and `POST /api/checkout` both require a server-validated session;
- every newly created order receives its owner from the server session, never from browser input;
- historical orders survive the migration with no guessed owner assignment;
- authenticated customers can see only their own order list and order details;
- cart state survives login and logout because auth never clears or replaces `delivn.cart.v1`;
- auth/customer PII is not placed in URLs, localStorage, sessionStorage, analytics, or application logs; and
- the existing checkout locking, inventory reservation, totals, payment, address, consent, and error behavior remain intact.

## 2. Audited current state

### 2.1 Repository baseline

- Branch: `feature/customer-auth-account`, created from clean `main` at `792802c900670ad2da7775d12b108a4ba1de0c23`.
- Baseline validation: `npm run test:run` passes 46 files and 369 tests, including the guarded PostgreSQL integration suite.
- Runtime: Next.js `16.3.5`, React `19.2.8`, Drizzle ORM `0.45.3`, PostgreSQL driver `8.23.0`, Zod `4.6.5`, Vitest `3.2.4`, Playwright `1.63.0`.
- No authentication dependency, auth route, session helper, user table, or order ownership column currently exists.

### 2.2 Storefront and cart

`src/app/(storefront)/layout.tsx` is a Server Component that composes a focused client `CartProvider`. The provider hydrates and validates `delivn.cart.v1`, blocks mutation before hydration, persists after hydration, and synchronizes exact-key storage events without ping-pong. Auth must compose alongside this boundary, not replace it.

The header is mostly server-rendered, with focused client components for the mobile menu and cart count. Adding a small client `AccountLink` keeps public catalog routes from becoming request-time solely for header personalization.

### 2.3 Checkout trust boundary

The canonical `CheckoutInput` contains customer snapshots, payment method, and cart lines containing only `variantId` and `quantity`. It contains no `userId` and must remain unchanged.

`POST /api/checkout` currently parses, validates, normalizes, and invokes `createCheckoutService().createOrder(normalized)`. The checkout service locks products/variants/inventory, recalculates all money, inserts the order/items/status history, reserves inventory, and returns `OrderDTO`. The ownership change must preserve this transaction and pass a trusted session-derived owner alongside—not inside—the canonical input.

### 2.4 Order persistence and access

`orders` currently has no owner. It stores customer and commercial snapshots plus statuses and timestamps. `order_items` stores immutable product/variant/SKU/price snapshots, and `order_status_history` stores status transitions. There is no order-read route or customer account repository.

Existing orders must not be deleted or backfilled by matching email/phone; those identifiers are not proof of account ownership.

### 2.5 E2E/data safeguards

The Playwright suite runs against guarded loopback `delivn_e2e` only. Demo reset deletes only orders composed entirely of deterministic demo variants and restores only deterministic fixtures. Auth tests must retain this isolation and must never broaden reset behavior to production or ordinary development data.

## 3. Technology decision

### 3.1 Options considered

1. **Better Auth with the existing Drizzle/PostgreSQL database (chosen).** It provides email/password, Google OAuth, database sessions, Next.js handlers, CSRF/origin protections, and Drizzle schema support while keeping ownership queries in the existing repository layer.
2. Auth.js. It is viable, but the approved direction and current Better Auth adapter/session APIs provide a more direct database-backed credential + social account model for this codebase.
3. Custom password/session implementation. Rejected because password hashing, credential error timing, OAuth state, cookies, revocation, account linking, and session rotation should not be reimplemented in application code.

### 3.2 Version and compatibility

The current stable npm release observed during audit is `better-auth@1.7.17`. Its declared peers include Next 14–16, React/React DOM 18–19, Drizzle ORM `^0.45.2`, Drizzle Kit `>=0.31.4`, PostgreSQL `^8`, and Vitest 2–5, matching this repository.

Implementation will pin the reviewed stable version in `package-lock.json`. It will use the package's Drizzle adapter and the official Next.js handler/client APIs. No additional state, form, OAuth, or password library is proposed.

Current official references:

- https://better-auth.com/docs/installation
- https://better-auth.com/docs/integrations/next
- https://better-auth.com/docs/adapters/drizzle
- https://better-auth.com/docs/concepts/session-management
- https://better-auth.com/docs/concepts/users-accounts
- https://better-auth.com/docs/authentication/google
- https://better-auth.com/docs/reference/security

## 4. Authentication data model and migration

### 4.1 Better Auth core tables

Use the reviewed schema generated for the installed Better Auth version as the authority, represented in the existing Drizzle schema and applied through the existing Drizzle migration workflow. Core models are:

- `user`: UUID `id`, name, unique normalized email, email-verification flag, optional image, created/updated timestamps;
- `session`: UUID `id`, unique token, `userId` FK, expiry, optional IP/user-agent, created/updated timestamps;
- `account`: UUID `id`, `userId` FK, provider/account identifiers, optional OAuth token fields and expiry/scope fields, optional password hash, created/updated timestamps;
- `verification`: UUID `id`, identifier, value, expiry, created/updated timestamps.

Configure `advanced.database.generateId: "uuid"` so auth ownership uses the repository's existing PostgreSQL UUID convention. The checked-in Drizzle schema must match the actual `1.7.17` generator output; generated output is reviewed rather than applied blindly.

Auth child rows reference `user` with cascade deletion as generated by Better Auth. Account deletion UI is out of scope, but the schema must remain internally consistent.

### 4.2 Order ownership

Add to `orders`:

```text
user_id uuid null
  references user(id)
  on update restrict
  on delete set null
```

Add `orders_user_id_created_at_idx` on `(user_id, created_at desc)` for account history. The column is deliberately nullable:

- existing historical orders remain untouched with `user_id = null`;
- no ownership is inferred from customer email, phone, or name;
- all new orders created through the post-migration public checkout require a session and receive a non-null owner in service input;
- `ON DELETE SET NULL` preserves statutory/commercial order records if account deletion is introduced later.

The migration creates auth tables first, then the nullable ownership column/FK/index. No existing order, item, status, sequence, product, variant, inventory, address, or enum data is rewritten.

## 5. Server and client module boundaries

```text
Browser auth UI
  authClient (browser-safe Better Auth client)
    /api/auth/[...all]
      Better Auth server instance
        Drizzle adapter -> PostgreSQL auth tables

Protected Server Component / Route Handler
  request headers
    requireSession()/getSession()
      auth.api.getSession()
        database-backed session

Authenticated checkout
  session.user.id + canonical CheckoutInput
    checkout service transaction
      orders.user_id
```

Proposed boundaries:

- `src/server/auth/auth.ts`: server-only Better Auth instance and configuration;
- `src/server/auth/session.ts`: server-only `getSession`/`requireSession` helpers using `await headers()`;
- `src/lib/auth/auth-client.ts`: browser-safe `createAuthClient()` only;
- `src/lib/auth/return-to.ts`: pure browser/server-safe internal-return-path sanitizer;
- `src/app/api/auth/[...all]/route.ts`: official `toNextJsHandler(auth)` GET/POST mount;
- protected pages and checkout API validate a full session at the point of access.

No client module may import the database, repository, `pg`, Drizzle server adapter, server auth instance, or `server-only` module.

## 6. Better Auth configuration

### 6.1 Database-backed sessions

- Use the Drizzle PostgreSQL adapter over the existing `getDb()` instance and checked-in schema.
- Keep Better Auth's database session model: browser cookie contains the opaque session token; the authoritative session row lives in PostgreSQL.
- Do not enable stateless sessions or session cookie caching in this phase. Sensitive page/API checks therefore validate the current database session rather than accepting a cached user payload.
- Use the library's seven-day session lifetime and one-day update age explicitly, unless installed-version tests reveal different documented defaults; record the chosen values in configuration.
- Keep production secure-cookie behavior, `httpOnly`, origin validation, and CSRF defenses enabled. Do not set `disableCSRFCheck` or `disableOriginCheck`.
- Explicitly keep Better Auth's built-in rate limiting enabled for credential and auth endpoints. The library's current in-process storage is acceptable for the present single-process local/test architecture; a shared rate-limit store must be reviewed before any horizontally scaled deployment rather than silently assumed.
- Do not trust forwarded proxy headers until the real deployment proxy contract is documented.

### 6.2 Email/password

- Enable registration and sign-in.
- Registration fields: display name, email, password, password confirmation. Confirmation is a UI-only check and is never persisted.
- Use Better Auth's password hashing and its canonical 8–128 character bounds; do not store or log plaintext passwords.
- `requireEmailVerification` remains false because no approved outbound-email provider exists. The UI must not claim email verification, password reset, or account recovery.
- Successful registration may use Better Auth's normal automatic sign-in behavior.
- Login and duplicate-registration errors use safe localized messages and do not expose whether an email is registered beyond unavoidable provider behavior.

### 6.3 Google OAuth and account linking

- Configure only Google with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Configure `BETTER_AUTH_URL` explicitly. Authorized redirect URIs are:
  - local: `http://localhost:3000/api/auth/callback/google` (and the documented local port used for manual QA when different);
  - production: `https://delivn.com.vn/api/auth/callback/google`.
- Require Google's verified-email signal before issuing a session.
- Preserve Better Auth's same-email implicit linking only when the provider supplies a verified matching email. Keep `allowDifferentEmails: false`; do not force-link unverified identities or update the local email from a linked provider.
- Do not build manual link/unlink or account-merge UI in this phase.
- Do not invent Google credentials for tests. Automated tests mock the client boundary; real OAuth is a documented manual environment check.

### 6.4 Environment contract

Add non-secret placeholders/documentation for:

```text
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Secrets remain in uncommitted environment configuration. Tests use synthetic secrets. No secret, credential, token, password hash, OAuth token, or customer PII is printed.
`BETTER_AUTH_SECRET` must be generated with cryptographically secure randomness and meet Better Auth's documented minimum length; placeholder or repository text is never accepted as a production secret.

## 7. Return-path and redirect safety

Authentication entry points accept an optional `returnTo` that is sanitized by one shared pure helper:

- accept only same-site absolute paths beginning with one `/`;
- reject `//`, backslashes, control characters, schemes, hosts, credentials, and malformed encodings;
- fall back to `/tai-khoan` for ordinary login/register and `/thanh-toan` when checkout initiated the flow;
- pass only the sanitized value to Better Auth's `callbackURL` or `router.replace`;
- never place customer PII or auth secrets in the query string.

Next.js 16 `searchParams`/dynamic route params are awaited as promises.

## 8. Authentication UX

### 8.1 Routes

- `/tai-khoan/dang-ky`: email/password registration plus Google sign-in option;
- `/tai-khoan/dang-nhap`: email/password login plus Google sign-in option;
- `/tai-khoan`: protected customer dashboard;
- `/tai-khoan/don-hang`: protected order list;
- `/tai-khoan/don-hang/[orderNumber]`: protected order detail.

Authenticated visits to login/register redirect to a sanitized destination. Anonymous visits to protected account pages redirect to `/tai-khoan/dang-nhap?returnTo=...`.

### 8.2 Forms and errors

Forms are focused Client Components using Better Auth client methods. They include explicit labels, appropriate `type`/`autocomplete`, visible focus, linked field errors, `aria-live`, busy/disabled state, and a synchronous in-flight guard. Errors are localized safely; raw Better Auth/database/OAuth details are not rendered.

No password-reset or email-verification link is shown until a real delivery provider and end-to-end flow exist.

### 8.3 Header and logout

A small browser-safe `AccountLink` uses `authClient.useSession()`:

- initial/guest state: `ĐĂNG NHẬP` -> `/tai-khoan/dang-nhap`;
- authenticated state: `TÀI KHOẢN` -> `/tai-khoan`.

It is used in desktop and mobile navigation without converting the storefront layout or Header into a Client Component. Logout is a focused client button that calls Better Auth sign-out, refreshes server-rendered auth state, and navigates safely. Neither login nor logout mutates the cart.

## 9. Route protection strategy

Security checks occur at the data/action boundary, not only in navigation:

- protected Server Component pages call `requireSession()` before querying customer data;
- `POST /api/checkout` calls the server session helper and returns a stable `401 AUTHENTICATION_REQUIRED` envelope before checkout service/database commerce work when no valid session exists;
- account repositories always include `user_id = session.user.id` in the SQL predicate;
- infrastructure errors are not converted into anonymous, empty orders, or not-found states.

No `proxy.ts` is required for V1. Next.js and Better Auth both warn that a cookie-existence check is only an optimistic redirect, not authorization. Omitting proxy duplication keeps the authoritative checks explicit and testable. Reading request headers makes protected pages request-time; production build does not need a live session or database query during prerendering.

## 10. Checkout integration and order ownership

### 10.1 Checkout page gate

`/thanh-toan/page.tsx` becomes an async Server Component:

1. validate the full database session from request headers;
2. if absent, redirect to `/tai-khoan/dang-nhap?returnTo=%2Fthanh-toan`;
3. if present, render the existing `CheckoutClient` unchanged except for handling a session-expired `401` response.

The local cart already lives independently under `delivn.cart.v1`; the auth redirect and OAuth round trip do not clear or rewrite it. After return, `CartProvider` hydrates the same cart before enabling checkout.

### 10.2 API and service ownership

The browser request remains exactly canonical `CheckoutInput`; no `userId` is added.

The API route obtains the session and calls the service conceptually as:

```ts
checkoutService.createOrder(normalizedInput, { userId: session.user.id })
```

The trusted ownership context is required by the checkout service and `NewOrder`, and is inserted inside the existing transaction. A browser-controlled `userId`, email-to-user lookup, or optional authenticated owner argument is forbidden for the post-migration public route.

If the session is missing/expired, no order is inserted and inventory is not reserved. All current validation, normalization, locking order, commercial calculation, status creation, rollback, and response behavior remain unchanged after the ownership gate.

The checkout client maps `AUTHENTICATION_REQUIRED` to a localized session-expired state, preserves cart and in-memory form values, and offers a deliberate login link. It does not claim success or retry automatically.

## 11. Account dashboard and order access

### 11.1 Dashboard

`/tai-khoan` shows the authenticated display name/email, links to My Orders, and a logout control. It does not expose password hashes, provider tokens, session tokens, internal user IDs, admin controls, or unsupported profile-edit flows.

### 11.2 My Orders

The server repository lists only `orders.user_id = session.user.id`, newest first, with a deterministic secondary order. A concise browser-safe customer order summary contains:

- order number;
- server total;
- payment method/status;
- order status;
- created timestamp;
- line/item count where useful.

Historical `user_id = null` orders never appear. Empty ownership is an intentional account empty state, not an infrastructure fallback.

### 11.3 Order Detail

The detail repository performs a single ownership-scoped lookup using both `order_number` and session `user_id`; it never fetches by order number and checks ownership afterward. The detail may show the owner's existing order/customer snapshots, authoritative monetary breakdown, item snapshots, and status history.

Missing and cross-user order numbers both call `notFound()` with the same branded result so the route does not disclose another customer's order existence. Database failures propagate to a generic route error boundary and never become 404.

The confirmed checkout success state can link to `/tai-khoan/don-hang/{encoded orderNumber}`. Access remains protected by the server query.

## 12. Account/order contracts

Add dedicated browser-safe read DTOs for customer order presentation; do not expose raw Drizzle rows. The exact contracts are finalized during the implementation plan, but are limited to existing persisted fields:

- `CustomerOrderSummaryDTO`: order number, total, payment/order statuses and methods, created timestamp, item count;
- `CustomerOrderDetailDTO`: summary plus customer delivery snapshots, subtotal/shipping/total, note, order item snapshots, and status history.

DTO mappers serialize `Date` to ISO strings. They do not expose `userId`, auth/session/provider IDs, OAuth tokens, password hashes, repository internals, or inventory quantities.

## 13. Privacy, security, and compliance

- Passwords are handled only by Better Auth and never enter application persistence/logging except the library's password hash in the account table.
- Session tokens use Better Auth's `httpOnly` cookie and database session row. Client code receives session user presentation data, not the raw token.
- Google OAuth tokens remain in the auth account table and are never rendered. Because no Google API access is needed after sign-in, request only identity scopes and do not add broader scopes.
- Customer auth/profile/form data is not persisted in localStorage/sessionStorage/URL/analytics. The cart remains the only existing local persistence and contains no auth credentials.
- Login errors avoid account enumeration-oriented copy. Server/API errors do not reveal SQL, stack traces, provider secrets, or internal IDs.
- Update the privacy policy and compliance audit during implementation to disclose account identifiers, database sessions, Google sign-in, order-account linkage, purposes, and the still-pending retention/rights operational decisions. Do not invent a finalized retention period.

## 14. Accessibility and responsive behavior

- Semantic forms with explicit labels; placeholders are supplementary only.
- Correct `autocomplete` (`name`, `email`, `current-password`, `new-password`) and password visibility behavior only if implemented accessibly.
- Errors linked with `aria-describedby`, summary/live region, focus moved to the first actionable error or result.
- OAuth, submit, logout, navigation, and order rows are keyboard accessible with visible focus and semantic controls.
- Busy states are programmatic and prevent double submit.
- Status is expressed in text, not color alone.
- Account and order layouts reuse cream/sand/charcoal/red tokens, editorial type hierarchy, generous spacing, and no dashboard/card-wall styling.
- Desktop 1440/1280, tablet 1024/768, and mobile 390 layouts avoid tables that overflow; order information becomes stacked definition/list content on small screens.
- Motion is CSS-only and respects reduced motion.

## 15. Error and empty-state semantics

- No session: redirect for pages; stable 401 for checkout mutation.
- Auth provider/credential failure: safe localized form error; no session/account claim.
- Account has no orders: branded empty state with product navigation.
- Owned order absent or belongs to someone else: identical not-found response.
- Database/auth infrastructure failure: generic branded error boundary or safe API 500; never anonymous/empty/not-found.
- Session expires during checkout form use: cart retained, form retained while mounted, login offered; no order/inventory mutation.
- Google configuration missing: Google control is not presented as operational in an environment that lacks both credentials; email/password remains available. Production readiness requires configured credentials.

## 16. Testing strategy

Vitest remains Node globally. DOM tests use per-file `// @vitest-environment jsdom` only.

### 16.1 Schema and auth configuration

- generated Better Auth schema matches configured models and UUID ID strategy;
- migration creates all auth tables, nullable `orders.user_id`, FK and index;
- pre-existing historical orders remain present with null owner;
- auth child relations/cascades and order `SET NULL` behavior are verified;
- missing required server secrets/configuration fails safely without secret leakage.

### 16.2 Return paths and auth UI

- accept safe internal paths and reject external, protocol-relative, backslash, control-character, malformed and credential-bearing inputs;
- registration validates name/email/password/confirmation and blocks duplicate submit;
- login errors are generic and password values are never rendered/logged;
- Google call uses only provider `google` and sanitized callback URL;
- auth forms do not write email/password/name to browser storage or URL;
- logout ends the session and leaves cart storage untouched.

### 16.3 Session protection

- authenticated/anonymous `requireSession` behavior;
- protected pages redirect anonymously and render with a valid session;
- checkout page redirects with sanitized `/thanh-toan` return path;
- checkout API returns `401 AUTHENTICATION_REQUIRED` before service invocation when anonymous;
- forged `userId` fields are rejected/ignored by canonical validation and never reach ownership context.

### 16.4 Checkout ownership

- service inserts the exact trusted session user ID inside the transaction;
- rollback and all existing lock/reservation tests remain green;
- success response contract remains unchanged;
- session expiration/401 preserves cart and does not reconcile it;
- successful authenticated checkout still reconciles only submitted cart quantities.

### 16.5 Order repository and pages

- list query returns only the session user's orders, newest first;
- null-owner historical orders are excluded;
- detail returns an owned order with item/status/customer snapshots;
- same order number requested by another user returns no result;
- missing and cross-user routes produce identical not-found behavior;
- no DTO contains `userId`, password/session/provider tokens, or inventory internals;
- infrastructure failures propagate instead of becoming empty/404.

### 16.6 Header/cart integration

- guest link is login, authenticated link is account, and mobile/desktop remain consistent;
- cart survives email login, Google callback navigation (mocked), logout, and page refresh;
- cart quantity/count behavior remains unchanged.

### 16.7 E2E and live checks

Guarded `delivn_e2e` tests cover email registration, login, logout, protected-route redirect/return, cart survival, authenticated checkout, My Orders, own detail, and cross-user denial. Test identities are deterministic and cleanup is limited to exact test-owned auth records after demo orders are safely removed; environment guards remain mandatory.

Real Google OAuth cannot be automated without approved credentials. Manual QA verifies local Google callback when credentials exist. Production callback/consent-screen setup is documented but not fabricated.

Full validation after implementation: `npm run test:run`, `npm run lint`, `npm run build`, `git diff --check`, guarded migration/schema drift validation, PostgreSQL integration, and desktop/mobile browser QA.

## 17. Proposed implementation scope

Likely new files:

```text
src/app/api/auth/[...all]/route.ts
src/app/(storefront)/tai-khoan/dang-nhap/page.tsx
src/app/(storefront)/tai-khoan/dang-ky/page.tsx
src/app/(storefront)/tai-khoan/page.tsx
src/app/(storefront)/tai-khoan/don-hang/page.tsx
src/app/(storefront)/tai-khoan/don-hang/[orderNumber]/page.tsx
src/app/(storefront)/tai-khoan/don-hang/[orderNumber]/not-found.tsx
src/components/auth/AccountLink.tsx
src/components/auth/AuthForm.tsx
src/components/auth/LogoutButton.tsx
src/components/account/AccountDashboard.tsx
src/components/account/OrderList.tsx
src/components/account/OrderDetail.tsx
src/contracts/customer-order.ts
src/lib/auth/auth-client.ts
src/lib/auth/return-to.ts
src/server/auth/auth.ts
src/server/auth/session.ts
src/server/db/schema/auth.ts
src/server/repositories/customer-order.repository.ts
src/server/services/customer-order.service.ts
drizzle/<next-auth-migration>.sql
docs/auth/google-oauth-setup.md
```

Likely focused modifications:

```text
package.json / package-lock.json
.env.example
src/server/db/schema/index.ts
src/server/db/schema/orders.ts
src/contracts/index.ts
src/app/api/checkout/route.ts
src/server/services/checkout.service.ts
src/server/repositories/order.repository.ts
src/app/(storefront)/thanh-toan/page.tsx
src/components/checkout/CheckoutClient.tsx
src/lib/checkout/checkout-errors.ts
src/components/layout/Header.tsx
src/components/layout/MobileMenuButton.tsx
src/data/legal.ts
docs/compliance/ecommerce-compliance-audit.md
guarded E2E auth helpers/specs and related focused tests
```

Exact component splitting belongs to the post-approval execution plan. No source file is changed during this design phase.

## 18. Protected scope

This phase does not redesign or modify homepage Screens 01–05, Three.js/R3F/Drei, GLBs, homepage GSAP, Footer visual design, F1 catalog layout, F2 PDP layout, product media/brand assets, `src/data/products.ts`, product/inventory models, address dataset/model, consent semantics, payment methods, shipping policy, checkout commercial calculations, transaction lock order, inventory reservation semantics, order-number behavior, admin, or payment gateway behavior.

The database change is limited to Better Auth's required tables plus nullable order ownership and its FK/index. No historical order is deleted or reassigned.

## 19. Explicitly deferred

- Password reset, email verification, magic links, and transactional email provider.
- Account deletion, email change, password change, manual provider linking/unlinking, and profile editing.
- Admin roles, staff authentication, RBAC, admin order management, and status mutation UI.
- Guest-order claiming or historical-order backfill.
- Server-side cart, cart merge across devices, wishlists, and cart ownership.
- Order cancellation/return/refund workflows and notifications.
- Google API access beyond authentication scopes.
- Multi-factor authentication, passkeys, phone authentication, and other OAuth providers.
- Payment gateway, bank reconciliation, shipping-provider API, and production shipping policy.
- Final operational retention period and subject-rights workflow, pending business/legal approval.

## 20. Design self-review

- The browser never controls `userId`; ownership originates only from a validated server session.
- CheckoutInput and OrderDTO remain unchanged.
- Anonymous checkout is rejected before commerce writes; guest catalog/cart remain available.
- Database sessions—not a cookie-existence shortcut—authorize every protected page and mutation.
- Cross-user order lookup is prevented in the SQL predicate and receives non-disclosing not-found behavior.
- Historical orders survive with null ownership; no unsafe email/phone backfill is proposed.
- Cart persistence is independent of auth and is never cleared on login/logout.
- Better Auth defaults are not weakened: CSRF/origin validation stays enabled, different-email linking stays disabled, and unverified Google identities do not receive sessions.
- No fake reset/verification email, Google credential, admin, gateway, or server cart is introduced.
- No customer/auth PII is persisted in browser storage or URLs.
- The proposal preserves all existing commerce transaction, address, consent, payment, compliance, and protected visual behavior.
