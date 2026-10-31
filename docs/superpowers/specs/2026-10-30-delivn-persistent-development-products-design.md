# DELIVN persistent development products design

## Intent

Give normal local development a persistent, usable catalog in `delivn_dev` without pointing the application at `delivn_e2e`. A developer applies migrations and runs an explicit one-time `npm run dev:seed`; later `npm run dev` sessions read the persisted rows through the existing product repository, service, `ProductDTO`, catalog, PDP, cart, and checkout paths.

`delivn_dev` is persistent manual-development state. `delivn_e2e` remains deterministic, resettable automated-test state.

## Goals

- Add a separate `dev:seed` command targeting the ordinary `DATABASE_URL` only when it resolves to local `delivn_dev`.
- Create or restore exactly two active DEV-LOCAL products, four active variants, four media rows, and missing inventory rows.
- Use the current business-provided prices and existing Black/Sand product images.
- Keep reruns safe, deterministic, transactional, and independent of F5 demo reset behavior.
- Make `/san-pham`, both PDPs, variant selection, and Add To Cart usable under ordinary `npm run dev`.

## Non-goals and anti-goals

- Do not run the seed automatically from `npm run dev`.
- Do not reuse `DEV-DEMO-*` identities or point normal development at `delivn_e2e`.
- Do not weaken or change `db:seed`, F5 environment guards, demo reset behavior, product filtering, checkout, inventory reservation, schema, or migrations.
- Do not truncate tables, delete orders, reset inventory, or change arbitrary commercial rows.
- Do not introduce real production stock, claims, credentials, or customer data.

## Current-state findings

- `.env.local` and `.env.example` use `DATABASE_URL=.../delivn_dev`; current `delivn_dev` has no product or media rows.
- Existing `db:seed` is intentionally conservative: it inserts products as `draft`, variants as inactive, and preserves every existing commercial value. Its input is environment-driven. It is unsuitable for a ready-to-browse catalog and must remain unchanged.
- The product repository returns only `products.status = "active"`; hydration includes only variants with `active = true`.
- F5 demo tooling owns deterministic `DEV-DEMO-*` records only in loopback `delivn_e2e`, may reset those fixtures and demo-only orders, and has strict opt-in guards. It must not be parameterized for `delivn_dev`.

## Approaches considered

### 1. Extend `db:seed`

Rejected. Activating products and variants or restoring prices would weaken the existing seed's deliberate draft/inactive, insert-only semantics and mix two different responsibilities.

### 2. Parameterize F5 demo tooling

Rejected. F5 owns disposable E2E fixtures and includes reset behavior. Reusing it for persistent manual development would blur ownership and risk weakening `delivn_e2e` safeguards.

### 3. Add an isolated DEV-LOCAL seed subsystem

Selected. A new server-only module owns distinct deterministic identities, validates `DATABASE_URL` as local `delivn_dev`, and exposes only a seed operation. It shares schema primitives but not F5 environment, runner, service, repository, or reset code.

## Deterministic development data

All identities are development-owned and distinct from F5's `d311...`/`DEV-DEMO-*` namespace.

### Products

| Product | ID | Slug | Category | Status |
| --- | --- | --- | --- | --- |
| CÀ PHÊ HẠT RANG ESPRESSO | `d3120000-0000-4000-8000-000000000001` | `dev-local-delivn-espresso` | `espresso` | `active` |
| CÀ PHÊ RANG XAY | `d3120000-0000-4000-8000-000000000002` | `dev-local-delivn-rang-xay` | `rang_xay` | `active` |

Both products are non-featured. Their descriptions identify them as local-development data and make no sourcing, tasting, health, or production claims.

### Variants

| Product | ID | SKU | Label | Price | Active |
| --- | --- | --- | --- | ---: | --- |
| Espresso | `d3120000-0000-4000-8000-000000000101` | `DEV-LOCAL-ESPRESSO-250` | 250g | 173000 VND | yes |
| Espresso | `d3120000-0000-4000-8000-000000000102` | `DEV-LOCAL-ESPRESSO-500` | 500g | 345000 VND | yes |
| Rang xay | `d3120000-0000-4000-8000-000000000201` | `DEV-LOCAL-RANG-XAY-250` | 250g | 168000 VND | yes |
| Rang xay | `d3120000-0000-4000-8000-000000000202` | `DEV-LOCAL-RANG-XAY-500` | 500g | 335000 VND | yes |

All compare-at prices are null.

### Media

Deterministic media IDs `d3120000-0000-4000-8000-000000000301` through `...304` map, in sort order, to:

- Espresso: `/products/black/front.png`, `/products/black/three-quarter.png`
- Rang xay: `/products/sand/front.png`, `/products/sand/three-quarter.png`

Alt text describes the visible DELIVN packaging and identifies it as local-development media. No image is downloaded or fabricated.

### Inventory

- If a deterministic variant has no inventory row, insert `quantity = 100`, `reserved_quantity = 0`.
- If its inventory row exists, preserve both values exactly on every rerun.
- The baseline is synthetic development stock, not commercial truth.

## Target and environment safety

`dev:seed` loads `.env.local` through the existing Next environment loader, then validates `DATABASE_URL` before connecting:

- reject `NODE_ENV=production`;
- require `postgresql:` or `postgres:`;
- require `localhost` or `127.0.0.1`;
- require the pathname `/delivn_dev` exactly;
- reject query parameters other than `sslmode`, preventing driver parameters from overriding the validated host, port, or database;
- after connection, require `select current_database()` to return `delivn_dev`.

The command does not consult `DELIVN_E2E_DATABASE_URL` and does not require or modify `DELIVN_ENABLE_DEMO_SEED`.

## Seed transaction and ownership protocol

The operation uses a serializable transaction and has no reset mode.

1. Read rows matching any reserved product ID or slug, variant ID or SKU, and media ID.
2. Verify every existing reserved identity has the exact expected ID/slug, ID/SKU/product ownership, or ID/product ownership pair. Abort before mutation on any conflict.
3. Insert missing DEV-LOCAL products, variants, media, and inventory rows.
4. Lock the deterministic product and variant rows in globally sorted ID order.
5. Reverify ownership after insertion/locking.
6. Restore only deterministic DEV-LOCAL product, variant, and media fields to the fixture definition, including active state and current prices.
7. Leave existing inventory rows untouched. Never query, update, or delete orders.

Updating current DEV-LOCAL variant prices does not alter immutable order-item price snapshots. Preserving inventory retains local reservation history and prevents a rerun from acting as a reset.

## Module boundaries

The proposed isolated server-only area is `src/server/dev-products/`:

- `dev-product-data.ts`: typed deterministic fixtures only;
- `dev-product-environment.ts`: pure `DATABASE_URL` guard;
- `dev-product-database.ts`: validated pool, database assertion, serializable transaction, close;
- `dev-product-repository.ts`: identity reads, inserts, locks, and owned-field restoration;
- `dev-product-service.ts`: ownership protocol and seed orchestration;
- `dev-product-runner.ts`: environment/database/service composition;
- `seed.ts`: CLI entrypoint with safe error presentation.

`package.json` adds only `"dev:seed": "tsx src/server/dev-products/seed.ts"`. `npm run dev` remains `next dev` and performs no writes.

Documentation will add a short normal-development workflow: `npm run db:migrate`, `npm run dev:seed` once, then `npm run dev` for later sessions.

## Error behavior

- Environment, target, or identity conflicts terminate non-zero with a concise development-safe message.
- Unexpected database errors return a generic seed failure message; connection strings and credentials are not printed.
- The transaction rolls back completely on conflict or write failure.

## Testing and verification

Focused Node-environment Vitest coverage will prove:

- exact products, variants, prices, media, active states, and distinct DEV-LOCAL identities;
- environment rejection for production, remote hosts, wrong database, missing URL, unknown query parameters, and resolved database mismatch;
- missing records are inserted;
- reruns restore owned product/variant/media fields;
- existing inventory quantity/reserved quantity are preserved;
- missing inventory receives `100 / 0`;
- identity conflicts abort without mutation;
- no order/reset/delete operations exist in the protocol.

Live read/write verification against the configured local `delivn_dev` will run the command, inspect exact rows, query the existing ProductService, and manually/browser-check catalog, PDP, variant selection, and Add To Cart. Full Vitest, TypeScript, lint, build, and diff hygiene follow.

## Protected scope

No storefront, cart, checkout, ProductDTO, database schema, migration, F5 demo module, or existing seed behavior changes. The only database writes are deterministic DEV-LOCAL rows in validated local `delivn_dev`; no production database or E2E database is touched.
