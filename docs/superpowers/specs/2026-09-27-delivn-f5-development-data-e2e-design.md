# DELIVN F5 Development Data and Commerce E2E Design

**Status:** Proposed for approval
**Date:** 2026-09-27
**Branch:** `feature/e2e-development-data`

## 1. Goals and non-goals

F5 creates a safe local development-data profile and a real-browser commerce test that exercises PostgreSQL through the existing storefront and checkout API. The proof must cover catalog, product detail, cart, checkout, real order creation, inventory reservation, authoritative totals, and cart reconciliation.

The deterministic identities and stock are synthetic infrastructure. The four fixture prices are current business-provided DELIVN values for this project state, while remaining revisable through future operational workflows. F5 does not define permanent products, stock, shipping, payment operations, or brand claims. It does not redesign storefront pages, change checkout behavior, add an admin, or alter database schema and migrations.

Success means a developer with a local PostgreSQL instance can create an empty `delivn_e2e` database, enable the explicit demo guard, install Chromium once, and run one command that migrates and prepares only deterministic demo rows before Playwright executes the full flow.

## 2. Audit findings

### Database and commerce

The repository has one Drizzle migration and the complete ecommerce schema:

- `products`, `product_variants`, `product_media`, and `inventory`;
- `orders`, `order_items`, and `order_status_history`;
- restrictive product/order foreign keys, inventory bounds, order-total checks, and a global order-number sequence.

Checkout already performs a real transaction. It discovers and locks product/variant relationships, locks active products and variants for share, locks inventory for update, calculates line totals from locked database prices, writes the order and snapshots, increments `reserved_quantity`, initializes `order_status_history`, and returns a direct `OrderDTO` from `POST /api/checkout` with HTTP 201.

The temporary shipping policy returns zero. F5 may assert the resulting server total but must not advertise free shipping or treat that policy as finalized.

### Existing seed architecture

`npm run db:seed` loads four SKU/price/stock groups from environment variables. `createSeedService()` is deliberately conservative:

- products are inserted by slug as `draft`;
- variants are inserted by SKU as inactive;
- inventory and deterministic media are inserted only when missing;
- existing commercial values are never updated;
- identity conflicts roll back the transaction.

The current command does not provide F5's production/opt-in/database-name guards and is not suitable for repeatable active storefront fixtures. It must remain unchanged rather than becoming an overwrite/reset tool.

### Product and frontend behavior

The product service returns only active products and active variants. `ProductDTO.inStock` is derived from `quantity - reservedQuantity > 0`; media is ordered by `sortOrder`. The catalog and PDP already support database media and no-media states. Semantic roles, labels, links, radio controls, quantity controls, and checkout form labels provide stable Playwright locators without adding test IDs.

The cart stores non-authoritative snapshots in `delivn.cart.v1`. Checkout projects only `variantId` and `quantity`, validates the runtime `OrderDTO`, and reconciles only confirmed submitted quantities.

### Assets and test tooling

The following existing approved assets are suitable:

- `/products/black/front.png`
- `/products/black/three-quarter.png`
- `/products/sand/front.png`
- `/products/sand/three-quarter.png`

The Black files depict the Espresso packaging and the Sand files depict Rang Xay packaging. No asset generation or external URL is needed.

Vitest is globally Node-based with file-scoped jsdom tests. No Playwright, Puppeteer, or Cypress runner is currently installed. `@playwright/test` appears only as an optional Next.js peer in the lockfile and is not an installed top-level package.

PostgreSQL at `127.0.0.1:5432` was offline during this audit. F5 setup must fail clearly when the server or database is unavailable; it must never skip silently or fall back to another database.

## 3. Architecture decision

### Considered approaches

1. **Dedicated `delivn_e2e` database with deterministic demo rows — selected.** It isolates reservations and generated orders from ordinary manual development data. Setup adds one local database, but reset logic is substantially safer and simpler.
2. **Reuse `delivn_dev` with deterministic demo rows.** Fewer setup steps, but repeated inventory resets can conflict with manual development orders and accidental cleanup would have a larger blast radius.
3. **Ephemeral container/database per run.** Strong isolation, but adds container orchestration that the repository does not otherwise require. This is unnecessary for the current startup-scale local workflow.

F5 uses option 1. The dedicated database is still protected by exact-row ownership rules; the design does not assume that every row in `delivn_e2e` is disposable.

## 4. Development-data ownership model

Demo ownership is established by a tuple of deterministic UUID, reserved slug/SKU, and expected relationship. Display names are not identity.

### Products

| Fixture | UUID | Slug | Category |
|---|---|---|---|
| Espresso | `d3110000-0000-4000-8000-000000000001` | `dev-demo-delivn-espresso` | `espresso` |
| Rang Xay | `d3110000-0000-4000-8000-000000000002` | `dev-demo-delivn-rang-xay` | `rang_xay` |

### Variants

| Fixture | UUID | SKU | Label | Current provided price | Demo stock |
|---|---|---|---|---:|---:|
| Espresso / HẠT 250g | `d3110000-0000-4000-8000-000000000101` | `DEV-DEMO-ESPRESSO-250` | `250g` | 173,000 VND | 100 |
| Espresso / HẠT 500g | `d3110000-0000-4000-8000-000000000102` | `DEV-DEMO-ESPRESSO-500` | `500g` | 345,000 VND | 100 |
| Rang Xay / BỘT 250g | `d3110000-0000-4000-8000-000000000201` | `DEV-DEMO-RANG-XAY-250` | `250g` | 168,000 VND | 100 |
| Rang Xay / BỘT 500g | `d3110000-0000-4000-8000-000000000202` | `DEV-DEMO-RANG-XAY-500` | `500g` | 335,000 VND | 100 |

The prices above are current business-provided values, defined once in `src/server/demo/demo-data.ts` and verified by tests. They are not permanently immutable and may be revised through future operational workflows. Demo stock 100 and all deterministic DEV-DEMO identities remain synthetic development data and are not real inventory.

Product display names are `DELIVN ESPRESSO — DEMO PHÁT TRIỂN` and `DELIVN RANG XAY — DEMO PHÁT TRIỂN`. Descriptions say only that the entries are synthetic data for development and commerce testing. Products and variants are active so existing storefront filtering includes them; `compareAtPriceVnd` is null and `featured` is false.

Media IDs are deterministic UUIDs in the same reserved `d311...` range. Espresso uses the two Black paths and Rang Xay uses the two Sand paths, with front at sort order 0 and three-quarter at sort order 1. Alt text explicitly identifies each image as development-demo packaging.

## 5. Safety guards

Every demo mutation entrypoint must pass all checks before opening a write transaction:

1. refuse when `NODE_ENV === "production"`;
2. require `DELIVN_ENABLE_DEMO_SEED === "true"` exactly;
3. require `DELIVN_E2E_DATABASE_URL` with `postgresql:` or `postgres:` protocol;
4. require host `127.0.0.1` or `localhost`;
5. require database pathname exactly `/delivn_e2e`;
6. allow only the non-routing `sslmode` query parameter; reject `host`, `port`, `db`, `database`, and every other query key so node-postgres cannot override the validated target;
7. refuse if the target and configured ordinary `DATABASE_URL` have the same normalized loopback host, effective port, and database pathname, even if credentials differ;
8. never fall back from `DELIVN_E2E_DATABASE_URL` to `DATABASE_URL`;
9. preflight every deterministic UUID, slug, SKU, media ID, and parent relationship;
10. abort the whole transaction if a reserved identity is occupied by an unexpected row;
11. update only exact deterministic demo IDs after preflight succeeds.

No demo operation may use category, display name, substring, wildcard, or broad table membership to decide ownership. No operation truncates tables or deletes arbitrary products or orders.

## 6. Seed and reset behavior

The generic seed path remains untouched. A separate `src/server/demo/` subsystem owns F5.

`demo:seed` applies migrations to the guarded E2E target, inserts missing deterministic demo rows, and validates existing demo ownership. It does not overwrite existing demo inventory or delete anything.

`demo:reset` applies migrations and performs the same ownership preflight in a serializable transaction. It acquires locks in the checkout-compatible product → variant → inventory order, revalidates deterministic identities, and only then finds candidate orders through `order_items.variant_id IN (the four exact demo variant UUIDs)`. This prevents a concurrent checkout from committing an unseen demo order before inventory restoration. Every item in every candidate order must reference one of those four IDs. If any candidate is mixed with a non-demo variant, or an identity changes during setup, reset aborts the entire transaction before changing orders, fixtures, or inventory.

The current schema uses `ON DELETE RESTRICT` from both `order_items` and `order_status_history` to `orders`. Reset therefore deletes only verified demo-only candidates in FK-safe order: their exact status-history rows, their exact order-item rows, then their exact order rows. It never selects or deletes orders by customer data, name, category, SKU prefix, or wildcard. Orders containing only non-demo variants are not candidates and survive unchanged.

After demo-only order cleanup, reset reconciles only exact demo product/variant/media fields and restores exactly four demo inventory rows to `quantity = 100` and `reserved_quantity = 0`. Cleanup and inventory restoration are one transaction, so a failure cannot leave stale orders paired with cleared reservations. Repeated E2E runs begin from a consistent baseline without deleting non-demo or mixed orders.

The entire E2E database can later be removed manually by dropping `delivn_e2e`. Application code will not contain a database-drop command.

## 7. Database readiness and migration

`playwright.config.ts` first uses the already-installed `@next/env` loader for `.env.local`, resolves one guarded E2E environment, and passes the validated `DELIVN_E2E_DATABASE_URL` explicitly to the local web server as `DATABASE_URL`. The spawned Next.js process must not inherit or infer its application database from `.env.local`. Playwright global setup independently validates the same environment, opens the explicit E2E connection, verifies `current_database() = 'delivn_e2e'`, applies the repository's existing Drizzle migrations, and executes `demo:reset`.

The command fails with a concise setup error if PostgreSQL is offline, the database does not exist, credentials fail, the opt-in is absent, or any identity conflict occurs. It does not create the database, switch to `delivn_dev`, skip tests, seed fallback data, or alter configuration.

## 8. E2E framework and browser lifecycle

F5 adds `@playwright/test` as a development dependency and installs only Chromium for the initial suite. Browser installation remains a separate developer command:

```text
npx playwright install chromium
```

`playwright.config.ts` uses:

- `testDir: "./e2e"`;
- base URL `http://127.0.0.1:3100`;
- one Chromium project;
- one worker and no full parallelism because tests share deterministic database fixtures;
- screenshot and trace retention on failure;
- a local Next.js development server on port 3100;
- `reuseExistingServer: false`, preventing reuse of a server pointed at another database;
- `webServer.env.DATABASE_URL` set explicitly from the validated E2E URL.

Playwright officially supports local `webServer` startup and explicit environment variables for the spawned process: <https://playwright.dev/docs/test-webserver>.

## 9. Happy-path commerce test

The browser test uses semantic roles and labels and performs this real flow:

1. reset the deterministic fixture;
2. visit `/san-pham` and find `DELIVN ESPRESSO — DEMO PHÁT TRIỂN`;
3. open `/san-pham/dev-demo-delivn-espresso` through the catalog link;
4. select the `250g` in-stock radio option;
5. click `THÊM VÀO GIỎ` and observe `ĐÃ THÊM VÀO GIỎ`;
6. verify the Header exposes `GIỎ HÀNG (1)`;
7. navigate to `/gio-hang` and verify the product, variant, and quantity;
8. follow `TIẾP TỤC THANH TOÁN`;
9. fill `E2E Customer`, `0900000000`, `e2e.customer@example.com`, `123 Đường Kiểm Thử, Thành phố Demo`, and note `DEV-DEMO E2E CHECKOUT`;
10. select COD and submit `ĐẶT HÀNG`;
11. observe the confirmed success heading, a dynamic order number matching the existing format, and authoritative `173.000 ₫` total;
12. verify cart reconciliation returns the Header count to zero.

The browser must create the order through the existing `POST /api/checkout`; no test-only checkout endpoint or direct order insertion is allowed.

## 10. Database-side verification

After browser confirmation, a read-only Playwright helper queries the E2E database by the returned order number and verifies:

- one order exists with the synthetic customer fields, COD, pending order status, unpaid payment status, and server total 173,000 VND;
- one order item references the deterministic Espresso 250g variant with quantity 1;
- the item snapshots the server product name, label, `DEV-DEMO-ESPRESSO-250` SKU, unit price 173,000 VND, and line total 173,000 VND;
- the corresponding inventory row changed from reserved 0 to reserved 1;
- one initial status-history row has `from_status = null` and `to_status = 'pending'`.

Order IDs and sequence values are not hardcoded. The test asserts the documented order-number shape and then uses the returned number as its lookup key.

## 11. Commercial trust proof

The happy-path database assertion proves that the persisted item price equals the locked demo variant price. Existing F4 projection tests already prove that product names, media, and snapshot prices are not sent, and checkout-service tests prove locked server prices are used. F5 does not mutate localStorage prices merely to duplicate those lower-level guarantees.

## 12. Controlled failure scenarios

### Insufficient inventory

A second sequential browser test resets the fixture, adds Espresso 250g while it is in stock, then uses a guarded E2E-only helper to set that exact demo inventory row to `quantity = 0` and `reserved_quantity = 0`. This creates an unavailable test condition without fabricating an unbacked reservation. Checkout must receive the real 409 response, show the existing Vietnamese inventory error, keep `GIỎ HÀNG (1)`, preserve the form/cart, and show no success state. An `afterEach` full demo reset restores the consistent baseline.

### Network uncertainty

Real network flakiness is intentionally excluded. Existing mocked CheckoutClient tests cover uncertain network and malformed-response behavior deterministically.

### Offline or disabled setup

If PostgreSQL is offline, the E2E target is missing, or opt-in is false/missing, global setup fails before browser actions with no fallback and no database mutation.

## 13. Runtime and responsive QA

The E2E runtime monitor records uncaught page errors, same-origin request failures, fatal server responses, and browser console errors. The stock test explicitly allows its expected checkout 409. Expected development-server noise must be reviewed and narrowly filtered rather than broadly ignored.

Responsive smoke tests cover widths 1440, 1024, 768, and 390 for:

- `/san-pham`;
- the Espresso demo PDP;
- `/gio-hang` with one item;
- `/thanh-toan` with that item.

Each smoke asserts no horizontal document overflow, visible primary controls, successfully loaded product images, and no fatal runtime issues. Screenshots are attached as test artifacts; F5 does not introduce committed pixel-baseline regression testing.

## 14. Environment and commands

`.env.example` gains documented placeholders:

```text
DELIVN_E2E_DATABASE_URL=postgresql://delivn_app:CHANGE_ME@127.0.0.1:5432/delivn_e2e
DELIVN_ENABLE_DEMO_SEED=false
```

Developers set the opt-in to `true` only in local environment configuration. No secrets, customer details, or demo enablement are committed in `.env.local`.

Proposed commands:

```text
npm run demo:seed
npm run demo:reset
npm run test:e2e
npm run test:e2e:headed
```

`npm run test:e2e` performs guarded migration/reset through Playwright global setup and starts the isolated local Next server with `DATABASE_URL` overridden to the exact validated `DELIVN_E2E_DATABASE_URL`. The first browser installation is documented separately.

## 15. Future real-data replacement and Admin compatibility

Real commercial data later enters the existing products, variants, media, and inventory tables through approved operational tooling. No storefront, cart, checkout, or ProductDTO code depends on demo constants. Production configuration never points at `delivn_e2e`.

Demo records require no `isDemo` column and no schema cleanup. Removing the dedicated E2E database removes all demo data. F6 Admin remains responsible for real product, media, inventory, and order management; F5 adds no competing data-management interface.

## 16. Protected scope

F5 will not modify homepage screens, 3D/GLB assets, GSAP, footer design, catalog/PDP/cart/checkout behavior, transaction locking, inventory semantics, order-number semantics, shipping policy, payment methods, database schema, migrations, or `src/data/products.ts`.

If E2E reveals an application integration bug, implementation stops and reports the defect before changing protected commerce behavior.

## 17. Test matrix

| Layer | Required proof |
|---|---|
| Environment guard | production, missing opt-in, wrong opt-in, remote host, wrong DB name, ordinary DB collision all refuse before writes |
| Fixture contract | unique deterministic UUIDs/slugs/SKUs/media; exact current provided prices; synthetic stock baseline; referenced public assets exist |
| Seed service | first insert, safe rerun, identity conflict rollback, unrelated rows untouched |
| Reset service | demo-only orders deleted in FK-safe order; mixed candidates abort transaction; non-demo orders/inventory survive; four demo inventory rows reset consistently |
| App DB binding | Playwright web server receives `DATABASE_URL = validated DELIVN_E2E_DATABASE_URL`; normal `DATABASE_URL` is never used as fallback |
| Offline setup | connection/missing DB fails clearly without fallback |
| Browser happy path | catalog → PDP → cart → checkout → confirmed success → cart reconciliation |
| Database verification | order, item snapshots, authoritative total, inventory reservation, initial status history |
| Insufficient inventory | real 409, cart/form preserved, no false success, demo inventory restored |
| Runtime QA | page errors, same-origin request failures, fatal responses, console errors reviewed/fail appropriately |
| Responsive smoke | 1440/1024/768/390 across catalog, PDP, cart, checkout; no overflow or broken media |
| Regression | Vitest, lint, build, and `git diff --check` remain green independently of E2E availability |
