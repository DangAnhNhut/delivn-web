# DELIVN development demo data and commerce E2E

This workflow uses development fixtures in a dedicated local PostgreSQL database. The four prices are current business-provided DELIVN values for this project state; they may be revised through future operational workflows. Deterministic IDs, demo names/SKUs/slugs, stock, descriptions, and customer details remain development-only data.

## One-time prerequisites

1. Start PostgreSQL locally.
2. Create a separate database owned by the local application role. The local `delivn_app` role does not have `CREATEDB`, so an existing local PostgreSQL administrator performs this one-time operation without changing application-role privileges:

   ```text
   D:\pgsql\bin\createdb.exe -h 127.0.0.1 -p 5432 -U postgres -O delivn_app delivn_e2e
   ```

3. Copy the following values into the uncommitted local environment configuration and provide the real local password:

   ```text
   DELIVN_E2E_DATABASE_URL=postgresql://delivn_app:LOCAL_PASSWORD@127.0.0.1:5432/delivn_e2e
   DELIVN_ENABLE_DEMO_SEED=true
   ```

4. Install dependencies, then install Playwright's Chromium binary once:

   ```text
   npm install
   npx playwright install chromium
   ```

Never enable demo tooling in production. The guard refuses production mode, remote hosts, any database name other than `delivn_e2e`, a missing exact opt-in, an E2E target that resolves to the ordinary `DATABASE_URL` database, and connection-string query parameters other than `sslmode` so node-postgres cannot override the validated host/port/database.

## Commands

```text
npm run demo:seed
npm run demo:reset
npm run test:e2e
npm run test:e2e:headed
```

- `demo:seed` applies existing migrations and inserts only missing deterministic demo records.
- `demo:reset` uses a serializable transaction, locks exact demo product/variant/inventory rows before discovering orders, revalidates ownership, removes only verified demo-only orders in FK-safe order, and restores exact demo fixtures/inventory. A mixed demo/non-demo order aborts the reset without mutation.
- `test:e2e` runs one Chromium worker. Global setup validates the target, applies migrations, and resets demo data before the browser flow.
- The Playwright web server always receives `DATABASE_URL=DELIVN_E2E_DATABASE_URL`; it never uses `delivn_dev` implicitly.

If PostgreSQL is offline, the database is missing, credentials are invalid, or opt-in is absent, setup fails. There is no fallback or skipped-success mode.

### Local stable-browser fallback

By default, Playwright continues to use its own managed Chromium build. If that browser cannot be downloaded locally, an already-installed stable Chrome or Edge can be selected through Playwright's official channel support.

Chrome:

```powershell
$env:DELIVN_E2E_BROWSER_CHANNEL="chrome"
npm run test:e2e
```

Edge:

```powershell
$env:DELIVN_E2E_BROWSER_CHANNEL="msedge"
npm run test:e2e
```

Only `chrome` and `msedge` are accepted. Remove the variable to return to Playwright-managed Chromium. CI and the default local workflow remain on managed Chromium when it is available; this fallback does not change application runtime or database routing.

## Full customer sales journey

`e2e/customer-sales-journey.spec.ts` starts on the DELIVN homepage and follows only customer-facing controls through Homepage → Catalog → PDP → Cart → Checkout → Order confirmation. It then uses the guarded E2E database helper to prove the submitted order, authoritative price, inventory reservation, and initial status history were persisted in `delivn_e2e`.

Run only this journey with local Chrome:

```powershell
$env:DELIVN_E2E_BROWSER_CHANNEL="chrome"
npx playwright test e2e/customer-sales-journey.spec.ts
```

## Development fixture profile

- Espresso / HẠT demo: 250g at 173,000 VND and 500g at 345,000 VND.
- Rang Xay / BỘT demo: 250g at 168,000 VND and 500g at 335,000 VND.
- Each variant starts with synthetic stock 100.
- SKUs use `DEV-DEMO-*`; slugs use `dev-demo-*`; IDs are deterministic.
- Existing Black/Sand assets under `public/products/` provide local media.

The E2E customer uses `E2E Customer`, `0900000000`, `e2e.customer@example.com`, and a clearly synthetic address. No real customer data is used or persisted outside the test order in `delivn_e2e`.

## Artifacts and runtime checks

Playwright writes failure screenshots/traces to ignored `test-results/` and reports to ignored `playwright-report/`. Runtime monitoring fails on page errors, browser console errors, unexpected same-origin failed requests, and unexpected HTTP errors. The only framework-noise filter is an aborted `/_next/` request during development navigation; the insufficient-stock test explicitly allows only its expected `/api/checkout` 409.

## Cleanup and future replacement

The reset command deletes verified demo-only orders but never truncates tables or deletes non-demo/mixed orders. To remove all development data and accumulated sequence state, manually drop the dedicated `delivn_e2e` database when no test is running.

Future real products and F6 Admin continue using the existing production schema, ProductDTO, storefront, cart, and checkout paths. No application code depends on these demo constants.
