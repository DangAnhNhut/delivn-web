# DELIVN F5 Development Data and Commerce E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guarded deterministic demo-data profile and Chromium E2E suite that proves the existing DELIVN commerce path against a dedicated local PostgreSQL database.

**Architecture:** A new server-only `src/server/demo/` subsystem validates an explicit local `delivn_e2e` target and owns only deterministic demo identities. Playwright global setup migrates and resets those rows, starts Next.js with the E2E database URL, drives the real storefront/API, and performs read-only database verification of the resulting order and reservation.

**Tech Stack:** Next.js 16.3.5, React 19.2.8, TypeScript, Drizzle/PostgreSQL, Zod, Vitest, Playwright Test with Chromium.

**Spec:** `docs/superpowers/specs/2026-09-27-delivn-f5-development-data-e2e-design.md`

## Global Constraints

- Demo identities and stock are synthetic development/test infrastructure. The four fixture prices are current business-provided DELIVN values for this project state and may be revised later through operational workflows.
- Preserve the existing generic seed service and `db:seed` behavior.
- Require `NODE_ENV !== "production"`, `DELIVN_ENABLE_DEMO_SEED === "true"`, loopback host, and database name exactly `delivn_e2e` before demo mutation.
- Never fall back to `DATABASE_URL`, truncate tables, delete arbitrary or mixed/non-demo orders, or match ownership by display name/category/wildcard.
- Use only deterministic demo UUIDs, `dev-demo-*` slugs, and `DEV-DEMO-*` SKUs defined by the spec.
- Make no database schema or migration changes.
- Do not modify storefront, cart, checkout, transaction, inventory, shipping, payment, order-number, homepage, 3D, GLB, GSAP, footer, or `src/data/products.ts` behavior.
- Playwright is a development dependency; tests target only `127.0.0.1:3100` and local PostgreSQL.
- Keep Vitest globally in Node; browser/jsdom settings remain file-scoped.
- Do not commit, push, merge, reset, or switch branches unless separately authorized.

## Review Focus

- A URL containing production credentials but a misleading variable name must still be rejected by hostname and exact database-name validation.
- A reserved slug/SKU paired with a non-demo UUID must abort before any row is changed.
- Reset after a prior run must remove verified demo-only orders in FK-safe order and restore only demo inventory; mixed demo/non-demo orders abort the transaction, while unrelated orders and inventory remain intact.
- An expected checkout 409 must not be hidden by runtime monitoring, while unexpected same-origin failures still fail the test.
- A pre-existing process on port 3100 must fail the run rather than be reused with an unknown database configuration.

---

### F5.0: Baseline and dependency setup

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: existing npm/Vitest/Next commands.
- Produces: local `@playwright/test`, ignored Playwright outputs, and future scripts used by later tasks.

**Dependencies:** Clean `feature/e2e-development-data` worktree and the existing npm lockfile.

- [ ] **Step 1: Verify the implementation branch and clean starting state**

Run `git branch --show-current`, `git status --short`, and `git diff --stat`. Require `feature/e2e-development-data`; stop rather than discarding unrelated work.

- [ ] **Step 2: Install Playwright Test as a development dependency**

Run `npm install --save-dev @playwright/test`. Do not install browsers as part of package installation.

- [ ] **Step 3: Ignore generated Playwright artifacts**

Add `/playwright-report/`, `/test-results/`, and `/blob-report/` to `.gitignore`.

- [ ] **Step 4: Verify dependency-only changes**

Run `npm ls @playwright/test --depth=0` and `git diff --check`.

Review checkpoint: do not commit unless explicitly instructed.

### F5.1: Demo environment safety contract

**Files:**
- Create: `src/server/demo/demo-environment.ts`
- Create: `src/server/demo/demo-environment.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `loadDemoEnvironment(environment: Record<string, string | undefined>): DemoEnvironment`, where `DemoEnvironment` contains the validated `databaseUrl` and database name.
- Consumed by: demo commands, Playwright config, global setup, and E2E DB helpers.

**Dependencies:** F5.0 only; this module stays pure and must not open a database connection.

- [ ] **Step 1: Write failing guard tests**

Cover production mode, absent/incorrect opt-in, missing URL, invalid protocol, remote host, wrong pathname, node-postgres routing overrides (`host`, `port`, `db`, `database`), collision with ordinary `DATABASE_URL`, and valid `127.0.0.1`/`localhost` URLs. Collision comparison normalizes loopback aliases, effective port, and database pathname rather than credentials. Assert failures occur before any connection callback is invoked. Permit only `sslmode`; no query parameter may override the validated connection target.

- [ ] **Step 2: Run the guard tests and verify RED**

Run `npm run test:run -- src/server/demo/demo-environment.test.ts`. Expect module/function-not-found failures.

- [ ] **Step 3: Implement the pure validator**

Implement the exact signature above without importing database, repository, or Next runtime modules. Require `DELIVN_ENABLE_DEMO_SEED === "true"` and pathname `/delivn_e2e`; never read `DATABASE_URL` as a fallback.

- [ ] **Step 4: Document environment variables**

Add commented development-only placeholders for `DELIVN_E2E_DATABASE_URL` and `DELIVN_ENABLE_DEMO_SEED=false` to `.env.example`; do not include secrets.

- [ ] **Step 5: Verify GREEN**

Run `npm run test:run -- src/server/demo/demo-environment.test.ts` and `npm run lint`.

Review checkpoint: do not commit unless explicitly instructed.

### F5.2: Deterministic demo fixture definition

**Files:**
- Create: `src/server/demo/demo-data.ts`
- Create: `src/server/demo/demo-data.test.ts`

**Interfaces:**
- Produces: `DEMO_PRODUCTS`, `DEMO_VARIANTS`, `DEMO_MEDIA`, `DEMO_STOCK`, and typed lookup helpers keyed by stable fixture names.
- Consumed by: demo service, E2E actions, and DB assertions.

**Dependencies:** F5.1 safety contract and the existing schema/ProductDTO-compatible media conventions.

- [ ] **Step 1: Write failing fixture-contract tests**

Assert the exact UUIDs, slugs, SKU prefix, labels, current business-provided prices, synthetic stock 100, active states, null compare-at prices, media URLs/sort order, uniqueness across every identity, and existence of all referenced files under `public/`.

- [ ] **Step 2: Run the fixture tests and verify RED**

Run `npm run test:run -- src/server/demo/demo-data.test.ts`. Expect missing fixture exports.

- [ ] **Step 3: Implement the immutable fixture constants**

Use the two products, four variants, four media records, names, descriptions, prices, and UUIDs exactly as specified in the design. Export readonly data; do not read commercial environment variables.

- [ ] **Step 4: Verify GREEN**

Run `npm run test:run -- src/server/demo/demo-data.test.ts`.

Review checkpoint: do not commit unless explicitly instructed.

### F5.3: Guarded demo seed and ownership validation

**Files:**
- Create: `src/server/demo/demo-repository.ts`
- Create: `src/server/demo/demo-service.ts`
- Create: `src/server/demo/demo-service.test.ts`
- Create: `src/server/demo/demo-database.ts`
- Create: `src/server/demo/seed.ts`

**Interfaces:**
- Consumes: `DemoEnvironment` and immutable demo fixtures.
- Produces: `createDemoService(dependencies)`, `seedDemoData()`, explicit-target database lifecycle, and the `demo:seed` CLI.
- Invariant: service methods can write only the fixture's exact UUIDs after ownership preflight.

**Dependencies:** F5.1 environment validator, F5.2 fixture constants, existing Drizzle schema, and existing migration files.

- [ ] **Step 1: Write failing service tests**

Build an in-memory dependency harness and test first insertion, safe insert-only rerun, deterministic product/variant/media ownership, conflict rollback, and preservation of unrelated rows and existing demo inventory.

- [ ] **Step 2: Add adversarial ownership tests from Review Focus**

Test a reserved slug with a foreign UUID, reserved SKU with a foreign UUID, deterministic UUID with a foreign slug/SKU, wrong variant parent, and wrong media parent. Each must reject before the harness records any mutation.

- [ ] **Step 3: Run service tests and verify RED**

Run `npm run test:run -- src/server/demo/demo-service.test.ts`.

- [ ] **Step 4: Implement repository protocols and seed behavior**

Create focused repository methods for exact identity discovery, sorted locking, insert-if-missing, and transaction execution. Implement `seedDemoData()` as preflight then insert-only; no update/delete method belongs in the seed path.

- [ ] **Step 5: Implement the explicit E2E database lifecycle**

`demo-database.ts` must create and close its own Pool from the already validated E2E URL, apply existing migrations with Drizzle, and never use `getDb()` or implicit `DATABASE_URL` fallback.

- [ ] **Step 6: Implement the guarded CLI**

`seed.ts` loads `.env.local`, validates the environment before connecting, applies migrations, invokes seed mode, emits no credential values, and closes the pool on success/failure.

- [ ] **Step 7: Verify GREEN**

Run the demo environment/data/service tests together, then `npm run lint` and `git diff --check`.

Review checkpoint: do not commit unless explicitly instructed.

### F5.4: Safe repeatability and demo reset

**Files:**
- Modify: `src/server/demo/demo-repository.ts`
- Modify: `src/server/demo/demo-service.ts`
- Modify: `src/server/demo/demo-service.test.ts`
- Create: `src/server/demo/reset.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `resetDemoData()` and scripts `demo:seed` / `demo:reset`.
- Consumed by: Playwright global setup and mutating E2E tests.

**Dependencies:** F5.3 ownership preflight, repository protocols, and explicit database lifecycle.

- [ ] **Step 1: Write failing reset tests**

Assert exact demo presentation fields are restored, products/variants become active, media is reconciled, and only the four demo inventory rows become `{quantity: 100, reservedQuantity: 0}`. Assert verified demo-only orders are deleted in FK-safe dependency order (`order_status_history`, `order_items`, then `orders`) while unrelated products, variants, inventory, and non-demo-only orders remain byte-for-byte unchanged.

- [ ] **Step 2: Write mixed-order and transactional safety tests**

Create a candidate order containing one deterministic demo variant and one non-demo variant. Reset must reject before any delete/update. Also inject a failure after demo-order discovery and prove all order, fixture, and inventory state rolls back. Verify reset locks products, variants, and inventory before order discovery, revalidates identities after locking, and uses a serializable database transaction. These tests protect the invariant that reset never clears reservations while a candidate order remains.

- [ ] **Step 3: Test repeatability and partial-state recovery**

Seed partially missing fixtures and previously reserved demo inventory, call reset twice, and assert the same final state without duplicate rows.

- [ ] **Step 4: Run reset tests and verify RED**

Run `npm run test:run -- src/server/demo/demo-service.test.ts`.

- [ ] **Step 5: Implement exact-ID reset and order cleanup**

Reuse ownership preflight. Find candidate order IDs only through exact demo variant UUIDs, load every item for those candidates, and abort the transaction if any item is non-demo. For verified demo-only candidates, delete exact status-history rows, exact item rows, and exact order rows before restoring fixture and inventory state. Do not add table truncation, wildcard/prefix/customer-based mutation, or sequence reset.

- [ ] **Step 6: Add CLI scripts**

Add `demo:seed` and `demo:reset` scripts pointing to their TypeScript entrypoints. Both remain guarded; reset applies existing migrations before the transaction.

- [ ] **Step 7: Verify GREEN**

Run all `src/server/demo/*.test.ts`, lint, and `git diff --check`.

Review checkpoint: do not commit unless explicitly instructed.

### F5.5: Playwright configuration and setup lifecycle

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/global-setup.ts`
- Create: `e2e/support/runtime-monitor.ts`
- Create: `e2e/support/demo-db.ts`
- Create: `src/server/demo/demo-playwright-config.ts`
- Create: `src/server/demo/demo-playwright-config.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: guarded demo environment and reset API.
- Produces: a single-worker Chromium runner at `127.0.0.1:3100`, automatic guarded migration/reset, runtime-monitor helpers, read-only verification helpers, and exact demo inventory test controls.

**Dependencies:** F5.0 Playwright dependency, F5.1 guard, F5.2 fixtures, and F5.4 reset API.

- [ ] **Step 1: Write pure Playwright-configuration contract tests**

Test a pure configuration helper that fixes the base URL to `http://127.0.0.1:3100`, passes the validated `DELIVN_E2E_DATABASE_URL` as the spawned app's explicit `DATABASE_URL`, and refuses any caller-supplied external base URL. Include a conflicting ordinary `DATABASE_URL` case and prove it is never selected for the app. Missing/incorrect opt-in remains covered by `demo-environment.test.ts`; offline behavior is an integration check in global setup, not an unreachable Playwright test behind that same setup.

- [ ] **Step 2: Implement Playwright configuration**

Use the existing `@next/env` loader to read `.env.local`, validate it before deriving configuration, consume the pure configuration helper, then set `testDir`, Chromium, one worker, failure traces/screenshots, `reuseExistingServer: false`, and global setup. Set `webServer.env.DATABASE_URL` directly from the validated E2E URL, overriding any ordinary `.env.local` value. Do not configure production/staging URLs.

- [ ] **Step 3: Implement global setup**

Validate environment, verify PostgreSQL/current database, apply migrations, reset demo data, and close connections. Produce concise errors without URLs or credentials.

- [ ] **Step 4: Implement runtime monitoring**

Provide a helper that captures page errors, console errors, same-origin request failures, and unexpected same-origin responses. Accept an explicit per-test allowlist for the stock test's expected `/api/checkout` 409 only.

- [ ] **Step 5: Implement DB support boundaries**

Expose read-only `readOrderByNumber(orderNumber)` and `readDemoInventory(variantId)`. Expose one guarded mutation `makeDemoVariantUnavailable(variantId)` that refuses non-fixture IDs, sets only that row to `{quantity: 0, reservedQuantity: 0}`, and always uses the validated E2E database.

- [ ] **Step 6: Add E2E package scripts**

Add `test:e2e` and `test:e2e:headed`. Document `npx playwright install chromium` separately; do not install browsers in runtime dependencies.

- [ ] **Step 7: Verify configuration without mutating an unavailable DB**

Run `npm run test:run -- src/server/demo/demo-playwright-config.test.ts`, then Playwright's test listing/config validation with the explicit demo environment. With PostgreSQL offline, an actual E2E run must fail clearly in global setup before browser actions; do not change configuration to hide it.

Review checkpoint: do not commit unless explicitly instructed.

### F5.6: Full happy-path browser flow and DB assertions

**Files:**
- Create: `e2e/commerce-happy-path.spec.ts`
- Modify: `e2e/support/demo-db.ts`

**Interfaces:**
- Consumes: semantic storefront controls, demo fixture constants, runtime monitor, and read-only DB helper.
- Produces: browser-to-database proof of the complete commerce flow.

**Dependencies:** F5.5 configured runner, migrated/reset E2E database, installed Chromium, and existing F1–F4 UI/API behavior.

- [ ] **Step 1: Write the happy-path test using roles and labels**

Implement the 18-step flow from the spec with the exact synthetic customer values. Assert catalog/PDP content, `GIỎ HÀNG (1)`, cart quantity, checkout fields, success heading, order-number format, authoritative 173,000 VND total, and reconciled zero cart count.

- [ ] **Step 2: Add response-boundary assertions**

Observe the browser's `/api/checkout` response and require HTTP 201 plus the visible success state. Do not parse or call a test-only checkout endpoint.

- [ ] **Step 3: Add database-side assertions**

Lookup by returned order number and assert order fields, one order-item snapshot, exact demo variant/SKU, quantity 1, unit/line price 173,000 VND, reserved quantity 1, and one initial pending history record.

- [ ] **Step 4: Run and verify**

With PostgreSQL and Chromium available, run `npm run test:e2e -- e2e/commerce-happy-path.spec.ts`. If unavailable, report the exact prerequisite; do not seed `delivn_dev` or fabricate runtime data.

Review checkpoint: do not commit unless explicitly instructed.

### F5.7: Controlled insufficient-inventory scenario

**Files:**
- Create: `e2e/commerce-insufficient-stock.spec.ts`
- Modify: `e2e/support/demo-db.ts`

**Interfaces:**
- Consumes: exact demo fixture reset and `makeDemoVariantUnavailable()`.
- Produces: real server 409/UI preservation proof without changing commerce code.

**Dependencies:** F5.5 guarded DB controls and F5.6 semantic checkout navigation patterns.

- [ ] **Step 1: Write the browser failure test**

Reset, add Espresso 250g, make only that deterministic inventory row unavailable after it enters the cart, submit valid checkout, and allow only the expected `/api/checkout` 409 in runtime monitoring.

- [ ] **Step 2: Assert failure semantics**

Capture the order count for the unique synthetic customer marker before submission. Require the existing insufficient-inventory Vietnamese message, absence of success copy, preserved form values, and `GIỎ HÀNG (1)`/cart storage. Read the database afterward and assert that the marker's order count did not increase.

- [ ] **Step 3: Restore demo inventory**

Use `afterEach` with the guarded reset API. Never update a non-demo ID.

- [ ] **Step 4: Run and verify**

Run `npm run test:e2e -- e2e/commerce-insufficient-stock.spec.ts` with local prerequisites.

Review checkpoint: do not commit unless explicitly instructed.

### F5.8: Responsive and runtime smoke coverage

**Files:**
- Create: `e2e/storefront-responsive.spec.ts`

**Interfaces:**
- Consumes: demo storefront, runtime monitor, and Playwright page/context APIs.
- Produces: 1440/1024/768/390 smoke artifacts for catalog, PDP, cart, and checkout.

**Dependencies:** F5.5 runtime monitor/configuration and F5.6 stable semantic helpers for building a real cart.

- [ ] **Step 1: Define exact viewports**

Use widths 1440, 1024, 768, and 390 with stable practical heights. Create independent named tests while retaining one worker.

- [ ] **Step 2: Build a one-item cart through the PDP at each viewport**

Use the real variant radio and add button; do not write a handcrafted cart payload to localStorage.

- [ ] **Step 3: Assert each route**

For catalog, PDP, cart, and checkout require visible primary content/control, `document.documentElement.scrollWidth <= window.innerWidth`, loaded media with nonzero natural width, and no captured fatal runtime issues.

- [ ] **Step 4: Attach screenshots**

Attach full-page screenshots to Playwright results without committing visual baselines.

- [ ] **Step 5: Run and verify**

Run `npm run test:e2e -- e2e/storefront-responsive.spec.ts`.

Review checkpoint: do not commit unless explicitly instructed.

### F5.9: Developer runbook and final regression

**Files:**
- Create: `docs/development-e2e.md`
- Modify only if validation requires it: files introduced by F5 tasks above.

**Interfaces:**
- Produces: complete local setup, safety, execution, cleanup, and future replacement documentation.

**Dependencies:** All prior F5 tasks and their verified commands/failure modes.

- [ ] **Step 1: Document prerequisites and one-time setup**

Cover local PostgreSQL, manual creation of `delivn_e2e`, `.env.local` values, explicit opt-in, `npm install`, and `npx playwright install chromium`. Never include a real password.

- [ ] **Step 2: Document commands and failure behavior**

Explain `demo:seed`, `demo:reset`, `test:e2e`, headed mode, offline/disabled failures, current business-provided prices, synthetic demo identity/stock, artifact locations, and that no command targets production or `delivn_dev`.

- [ ] **Step 3: Document cleanup and future data replacement**

State that demo reset deletes only verified demo-only orders, never deletes non-demo or mixed orders, the whole dedicated E2E database can be manually dropped, and future commercial/Admin data uses the unchanged production schema and storefront contracts.

- [ ] **Step 4: Run focused tests**

Run all demo unit tests and Playwright tests when PostgreSQL/Chromium are available. Report environmental deferrals separately.

- [ ] **Step 5: Run complete regression**

Run `npm run test:run`, `npm run lint`, `npm run build`, and `git diff --check`. Existing PostgreSQL integration failures caused only by an offline server must be reported, never hidden.

- [ ] **Step 6: Perform protected-scope and Git audit**

Run `git diff --name-only`, inspect all F5 diffs, confirm no protected file changed, then report `git branch --show-current`, `git status --short`, and `git diff --stat`.

Review checkpoint: do not commit unless explicitly instructed.
