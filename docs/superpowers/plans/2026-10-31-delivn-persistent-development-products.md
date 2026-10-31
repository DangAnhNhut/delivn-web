# DELIVN Persistent Development Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit, safe `dev:seed` command that creates or restores deterministic active DEV-LOCAL catalog data in local `delivn_dev` while preserving existing inventory and all local order history.

**Architecture:** A new isolated `src/server/dev-products/` subsystem owns typed fixtures, target validation, a serializable database boundary, ownership-aware persistence, and a CLI runner. It uses ordinary `DATABASE_URL` but refuses every target except loopback `delivn_dev`; it shares only existing schema/database types and does not reuse or modify `db:seed` or F5 demo tooling.

**Tech Stack:** TypeScript, Node.js, PostgreSQL, Drizzle ORM, `pg`, Vitest, `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-30-delivn-persistent-development-products-design.md`

## Global Constraints

- Stay on `feature/persistent-development-products`; do not commit, push, merge, or tag.
- Keep `npm run dev` exactly `next dev`; `dev:seed` is explicit and never runs at application startup.
- `dev:seed` must reject production, missing/unsupported URLs, non-loopback hosts, non-`delivn_dev` databases, and unknown URL parameters except `sslmode` before connecting.
- After connecting, require `current_database() = 'delivn_dev'` before mutation.
- Use deterministic `d312...` IDs, `DEV-LOCAL-*` SKUs, active products/variants, exact approved prices, existing local media, and synthetic initial stock `100 / 0`.
- On rerun, preserve existing inventory `quantity` and `reserved_quantity` exactly; never delete or mutate orders.
- Do not modify `db:seed`, F5 demo files/guards, schema, migrations, storefront, ProductDTO, cart, checkout, inventory reservation, homepage, assets, or visual systems.
- Use test-first RED/GREEN cycles for every new production behavior; keep Vitest's global environment Node.

## Review Focus

- A URL containing query-level `host`, `port`, or `database` overrides must be rejected before a connection is created; cover in Task 2.
- An existing row that matches a reserved slug/SKU but has a different deterministic ID or parent must abort the entire transaction; cover in Task 3.
- A rerun after checkout reservations must not overwrite either inventory field; cover in Task 3 and live proof in Task 5.
- An insertion/update failure midway through the operation must roll back all prior writes; cover in Task 3.
- Normal `DATABASE_URL` and E2E environment variables may coexist, but the runner must use only the validated normal URL; cover in Task 4.

---

### Task 1: Deterministic DEV-LOCAL fixture contract

**Files:**
- Create: `src/server/dev-products/dev-product-data.test.ts`
- Create: `src/server/dev-products/dev-product-data.ts`

**Interfaces:**
- Produces: `DEV_PRODUCTS`, `DEV_VARIANTS`, `DEV_MEDIA`, `DEV_STOCK`, `DEV_PRODUCT_IDS`, `DEV_VARIANT_IDS` as readonly typed fixture collections matching the existing schema field shapes.
- Consumes: `ProductCategory` and `ProductStatus` types only; no database runtime.

- [ ] **Step 1: Write failing exact-fixture tests**

Assert the two `d312...001/002` products, four `d312...101/102/201/202` variants, four `d312...301-304` media rows, exact slugs/SKUs/prices/paths, active states, null compare-at prices, non-commercial descriptions, and initial `100 / 0` stock. Assert no ID, slug, or SKU overlaps F5 `DEMO_*` fixtures.

- [ ] **Step 2: Run the fixture test and verify RED**

Run: `npm run test:run -- src/server/dev-products/dev-product-data.test.ts`

Expected: FAIL because `dev-product-data.ts` or its exports do not exist.

- [ ] **Step 3: Implement the typed fixture constants**

Use the exact identities and values from the approved spec. Descriptions and alt text must explicitly identify local-development context without sourcing, tasting, health, or production claims.

- [ ] **Step 4: Run the fixture test and verify GREEN**

Run: `npm run test:run -- src/server/dev-products/dev-product-data.test.ts`

Expected: all fixture tests PASS.

### Task 2: Pure target-environment validation

**Files:**
- Create: `src/server/dev-products/dev-product-environment.test.ts`
- Create: `src/server/dev-products/dev-product-environment.ts`

**Interfaces:**
- Produces: `type DevProductEnvironment = { databaseUrl: string; databaseName: "delivn_dev" }`.
- Produces: `loadDevProductEnvironment(environment: Record<string, string | undefined>): DevProductEnvironment`.
- Consumes: ordinary `DATABASE_URL`; ignores `DELIVN_E2E_DATABASE_URL` and `DELIVN_ENABLE_DEMO_SEED`.

- [ ] **Step 1: Write failing environment-table tests**

Cover valid `localhost` and `127.0.0.1` PostgreSQL URLs (including optional `sslmode`), plus rejection of production, missing URL, unsupported protocol, remote host, `/delivn_e2e`, any other database path, query `host`/`port`/`database`, and any unknown parameter. Include E2E variables beside a valid normal URL and assert they do not affect the result.

- [ ] **Step 2: Run the environment test and verify RED**

Run: `npm run test:run -- src/server/dev-products/dev-product-environment.test.ts`

Expected: FAIL because the loader does not exist.

- [ ] **Step 3: Implement strict URL validation**

Parse with `URL`, normalize only the accepted loopback spellings, allow only `sslmode`, require pathname exactly `/delivn_dev`, and return the original trimmed connection string without logging it.

- [ ] **Step 4: Run the environment test and verify GREEN**

Run: `npm run test:run -- src/server/dev-products/dev-product-environment.test.ts`

Expected: all environment tests PASS.

### Task 3: Ownership-safe seed service and repository

**Files:**
- Create: `src/server/dev-products/dev-product-service.test.ts`
- Create: `src/server/dev-products/dev-product-service.ts`
- Create: `src/server/dev-products/dev-product-repository.ts`

**Interfaces:**
- Produces: `DevProductFixtures` and `DevProductRepositoryProtocol<TTransaction>` describing identity reads, inserts, sorted locks, owned-row restoration, and insert-only inventory.
- Produces: `createDevProductService<TTransaction>(dependencies).seed(): Promise<void>`.
- Produces: `createDevProductRepository(): DevProductRepositoryProtocol<DbTransaction>`.
- Consumes: Task 1 fixture constants and existing Drizzle schema tables.

- [ ] **Step 1: Write a fake transactional harness and failing seed tests**

Test missing-row creation, active product/variant restoration, exact price restoration, owned product/media restoration, missing inventory `100 / 0`, preservation of non-baseline existing inventory, unrelated rows unchanged, reserved product ID/slug conflicts, reserved variant ID/SKU/parent conflicts, media parent conflicts, and injected write failure rollback. Assert the protocol exposes no order/delete/reset operations.

- [ ] **Step 2: Run the service test and verify RED**

Run: `npm run test:run -- src/server/dev-products/dev-product-service.test.ts`

Expected: FAIL because the service/repository protocol does not exist.

- [ ] **Step 3: Implement preflight and ownership helpers**

Add pure conflict checks based only on deterministic product ID+slug, variant ID+SKU+product ID, and media ID+product ID pairs. Conflicts throw a dedicated safe error before mutation.

- [ ] **Step 4: Implement `seed()` orchestration**

Follow the approved 16-step protocol: preflight, insert missing rows, sorted product/variant locks, reverify, restore only owned product/variant/media fields, and never update existing inventory.

- [ ] **Step 5: Implement the Drizzle repository**

Use `or(inArray(id), inArray(identity))` identity reads; `onConflictDoNothing` inserts; sorted `for("update")` locks; exact-ID updates for owned rows; and inventory `onConflictDoNothing` only. Do not import order tables.

- [ ] **Step 6: Run the service tests and verify GREEN**

Run: `npm run test:run -- src/server/dev-products/dev-product-service.test.ts`

Expected: all service tests PASS, including rollback and inventory preservation.

- [ ] **Step 7: Run all focused dev-products tests**

Run: `npm run test:run -- src/server/dev-products`

Expected: all Task 1-3 tests PASS.

### Task 4: Validated database boundary, runner, CLI, and documentation

**Files:**
- Create: `src/server/dev-products/dev-product-database.ts`
- Create: `src/server/dev-products/dev-product-runner.test.ts`
- Create: `src/server/dev-products/dev-product-runner.ts`
- Create: `src/server/dev-products/seed.ts`
- Create: `docs/development-products.md`
- Modify: `package.json`

**Interfaces:**
- Produces: `createDevProductDatabase(environment)` with `assertTarget()`, serializable `withTransaction()`, and `close()`.
- Produces: `type DevProductRunnerDependencies` for injected database/service composition tests.
- Produces: `runDevProductSeed(environment?: NodeJS.ProcessEnv, dependencies?: DevProductRunnerDependencies): Promise<void>` composing validation, target assertion, repository, and service.
- Produces: CLI command `npm run dev:seed`.
- Consumes: Tasks 2-3 interfaces and existing Next environment-loading convention.

- [ ] **Step 1: Write failing runner/database boundary tests**

Using dependency injection, assert resolved database mismatch aborts before service seed, the runner passes only the validated normal URL to the database factory, E2E variables do not affect routing, and close runs after success or failure.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm run test:run -- src/server/dev-products`

Expected: FAIL because database/runner composition does not exist.

- [ ] **Step 3: Implement the database boundary**

Create a dedicated `pg.Pool`/Drizzle instance, query `current_database()`, reject anything except `delivn_dev`, and call `database.transaction(work, { isolationLevel: "serializable" })`. Do not run migrations automatically.

- [ ] **Step 4: Implement runner and safe CLI**

Load `.env.local` before invoking the runner. Print a concise success message; classify environment/target/identity errors safely; print only a generic message for unexpected failures; always close the pool. Never include URLs or credentials in output.

- [ ] **Step 5: Add package command and focused runbook**

Add only `"dev:seed": "tsx src/server/dev-products/seed.ts"`; leave `"dev": "next dev"` unchanged. Document one-time `db:migrate` + `dev:seed`, daily `npm run dev`, persistent inventory semantics, and `delivn_dev` versus `delivn_e2e` separation.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm run test:run -- src/server/dev-products`

Expected: all focused tests PASS.

### Task 5: Live `delivn_dev` and storefront verification

**Files:**
- No production files expected.
- Test-only temporary database mutations must target deterministic DEV-LOCAL inventory rows only and be restored to the observed state after the proof if changed.

**Interfaces:**
- Consumes: `npm run dev:seed`, existing ProductService, existing storefront/PDP/cart UI.
- Produces: validation evidence only.

- [ ] **Step 1: Confirm the target without printing credentials**

Before `db:migrate` or `dev:seed`, load the effective environment exactly as the CLI will and report only protocol, loopback host, port, and database name. Require `delivn_dev` before continuing so an old PowerShell `DATABASE_URL` override cannot redirect either command.

- [ ] **Step 2: Run the explicit seed command**

Run: `npm run dev:seed`

Expected: safe success message and exit 0.

- [ ] **Step 3: Verify exact persisted records read-only**

Query only deterministic DEV-LOCAL IDs. Assert two active products, four active variants with exact prices, four media rows with exact paths, and four inventory rows initially inserted at `100 / 0` when absent.

- [ ] **Step 4: Prove rerun inventory preservation safely**

Treat the unit/service tests as the primary preservation proof. Only when no manual app or checkout activity is running, record the current deterministic inventory row, set one DEV-LOCAL row to controlled non-baseline values that satisfy constraints, rerun `dev:seed`, and assert both values remain unchanged. Before restoring the recorded values, lock and verify that the row still equals the controlled proof value; if it changed unexpectedly, abort restoration rather than overwriting a possible real local reservation. Do not touch unrelated rows or orders.

- [ ] **Step 5: Verify through ProductService**

Run a server-side script using `createProductService()` and assert both slugs resolve with the two exact active variants, prices, stock presentation, and media.

- [ ] **Step 6: Verify the customer UI**

Run normal `npm run dev` against unchanged `DATABASE_URL`. Check `/san-pham`, both DEV-LOCAL PDP routes, both variant choices/prices, and one Add To Cart interaction. Do not point the process at E2E variables and do not modify storefront code.

### Task 6: Full regression and scope audit

**Files:**
- No additional files expected.

**Interfaces:**
- Consumes: completed Tasks 1-5.
- Produces: final validation evidence and review-ready working tree.

- [ ] **Step 1: Run the full unit/integration suite**

Run: `npm run test:run`

Expected: all existing and new Vitest files/tests PASS.

- [ ] **Step 2: Run TypeScript**

Run: `npx tsc --noEmit`

Expected: exit 0 with no diagnostics.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit 0.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: exit 0 without querying or mutating `delivn_dev` during prerender.

- [ ] **Step 5: Run diff hygiene and protected-scope audit**

Run: `git diff --check`, `git status --short`, and `git diff --stat`.

Expected: no whitespace errors; changes limited to the design/plan, new dev-products subsystem/tests/runbook, and `package.json`. Confirm no db:seed, F5 demo, schema, migration, storefront, cart, checkout, homepage, or asset file changed.
