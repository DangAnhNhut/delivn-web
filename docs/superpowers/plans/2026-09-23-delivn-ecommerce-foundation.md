# DELIVN Ecommerce Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the PostgreSQL/Drizzle product, inventory, and transactional order foundation described by the frozen DELIVN ecommerce specification without changing the approved storefront.

**Architecture:** Shared contracts stay database-agnostic; Zod validates HTTP input; services own commerce rules; transaction-scoped repositories own Drizzle and controlled locking SQL; PostgreSQL owns relational integrity. Checkout normalizes before opening a transaction, then follows the global `products -> product_variants -> inventory` lock order before calculating server-authoritative money and writing the order atomically.

**Tech Stack:** Next.js 16.3.5 App Router, React 19, strict TypeScript, PostgreSQL 18.4, Drizzle ORM/Kit, `pg`, Zod, Vitest, `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-23-delivn-ecommerce-foundation-design.md` at SHA-256 `BCD76AB6AFA15D6C229FCF9EB5EDB93FCF3B4CCA75AC67D852611B9F44DF59CF`.

## Global Constraints

- Recompute the spec SHA before implementation; stop if it differs from the frozen SHA above.
- Do not modify homepage Screens 01–05, Three.js/GLB code or assets, homepage motion, footer, brand/story assets, or homepage CSS.
- Do not add `/san-pham`, product cards, cart UI, checkout UI, success UI, admin UI, authentication, accounts, reviews, wishlist, gateways, shipping-provider APIs, or order-status mutation APIs.
- Use `DATABASE_URL` only. Never ask for, print, commit, log, or hardcode its password.
- Keep `.env.local` ignored and track only a safe `.env.example` placeholder.
- Canonical categories are exactly `espresso | rang_xay` at every layer.
- VND values are integers in `0..2_147_483_647`; use exact checked arithmetic before persistence.
- Available inventory is `quantity - reserved_quantity`; checkout only increases `reserved_quantity`.
- All overlapping writers use `products -> product_variants -> inventory`, deduplicated ascending IDs per table, with no late out-of-order locks.
- Product/variant ownership is immutable through normal V1 repositories.
- The global order-number sequence never resets; rollback gaps are acceptable.
- Current shipping is an isolated `TEMPORARY V1 DEVELOPMENT POLICY` returning `0` VND.
- No Git metadata exists. Do not search for history or attempt commits; each task ends with a verified file/command checkpoint instead.

## Review Focus

These failure classes receive explicit tests in the owning tasks:

1. An active variant with no inventory row is out of stock for reads and unavailable for checkout, never treated as unlimited stock (B7/B10).
2. Repeated cart lines normalize to one order item and one reservation increment, with the grouped maximum enforced (B9/B10).
3. Discovery/locked product ownership drift aborts without taking a late product lock or writing anything (B10).
4. Money exactly at the PostgreSQL integer boundary succeeds, while overflow at line, subtotal, or final-total boundaries fails before persistence (B9/B10).
5. A seed rerun preserves every existing commercial/inventory field and rolls back the whole seed on conflicting SKU/media identity (B12).

## Proposed File Structure

```text
.env.example
.gitignore
drizzle.config.ts
vitest.config.ts
package.json
package-lock.json
drizzle/
  0000_initial_ecommerce.sql
  meta/
    _journal.json
    0000_snapshot.json
src/
  app/
    api/
      checkout/route.ts
      products/route.ts
      products/[slug]/route.ts
  contracts/
    api-error.ts
    checkout.ts
    index.ts
    order.ts
    product.ts
  server/
    db/
      index.ts
      migrate.ts
      seed-data.ts
      seed.ts
      schema/
        index.ts
        orders.ts
        products.ts
    errors/
      commerce-error.ts
    http/
      api-errors.ts
    repositories/
      inventory.repository.ts
      order.repository.ts
      product.repository.ts
      seed.repository.ts
      types.ts
    services/
      checkout.service.ts
      checkout.service.test.ts
      order.service.ts
      order.service.test.ts
      product.service.ts
      product.service.test.ts
      seed.service.ts
      seed.service.test.ts
      shipping.service.ts
    utils/
      money.test.ts
      money.ts
      order-number.test.ts
      order-number.ts
    validation/
      checkout-normalization.test.ts
      checkout-normalization.ts
      checkout.schema.test.ts
      checkout.schema.ts
      product.schema.ts
    database.integration.test.ts
    http/api-errors.test.ts
```

---

## B0 — Repository and system verification

**Objective:** Reconfirm only the implementation-relevant baseline and frozen-spec identity before any mutation.

**Files:**
- Read: `package.json`, `tsconfig.json`, `.gitignore`, `src/app/layout.tsx`, `src/app/(storefront)/layout.tsx`, `src/data/products.ts`, `src/domain/product/types.ts`
- Modify: none
- Create: none

**Dependencies:** None.

**Implementation details and invariants:**

- Confirm Next.js `16.3.5`, React 19, strict TypeScript, App Router, and `@/* -> ./src/*`.
- Confirm the existing homepage route group and static data stay read-only.
- Check only booleans for `.env.local` and `DATABASE_URL`; never output their contents.
- Check `.git` with `Test-Path`; do not run Git history/status commands when absent.
- Re-read installed Next.js route-handler/environment documentation before route implementation; retain the Next.js 16 promise form for dynamic params.

- [ ] **Step 1: Verify the frozen specification and baseline**

Run:

```powershell
$spec = 'docs\superpowers\specs\2026-09-23-delivn-ecommerce-foundation-design.md'
(Get-FileHash -Algorithm SHA256 -LiteralPath $spec).Hash
Get-Content -Raw package.json
Get-Content -Raw tsconfig.json
Get-Content -Raw .gitignore
rg --files src
"ENV_LOCAL_PRESENT=$([bool](Test-Path -LiteralPath '.env.local'))"
"DATABASE_URL_AVAILABLE=$([bool]$env:DATABASE_URL)"
"GIT_METADATA_PRESENT=$([bool](Test-Path -LiteralPath '.git'))"
```

Expected: SHA equals the frozen SHA; strict TypeScript and App Router are present; current audit shows no database packages, `.env.local`, `DATABASE_URL`, or Git metadata.

- [ ] **Step 2: Verify protected files are outside the implementation file list**

Run:

```powershell
rg --files src/components/home src/components/three src/components/layout 'src/app/(storefront)'
```

Expected: files are listed for awareness only; none appears in any later task's modify list.

**Failure/rollback:** A spec SHA mismatch stops all work for user review. Any newly discovered conflicting architecture updates this plan before implementation; B0 itself makes no changes.

---

## B1 — Dependencies, scripts, environment, and Drizzle/Vitest configuration

**Objective:** Install only approved backend/test packages and configure commands that work without opening a database during build or unit tests.

**Files:**
- Create: `.env.example`, `drizzle.config.ts`, `vitest.config.ts`
- Modify: `.gitignore`, `package.json`, `package-lock.json`
- Test: configuration commands below

**Dependencies:** B0.

**Implementation details:**

- Runtime dependencies: `drizzle-orm`, `pg`, `zod`.
- Development dependencies: `drizzle-kit`, `@types/pg`, `vitest`, `tsx`, `@next/env` matching Next.js `16.3.5` where npm resolution permits.
- Add scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx src/server/db/migrate.ts",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx src/server/db/seed.ts",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- `.env.example` contains only `DATABASE_URL=postgresql://delivn_app:CHANGE_ME@127.0.0.1:5432/delivn_dev`.
- Add `!.env.example` after `.env*`; do not weaken `.env.local` protection.
- `drizzle.config.ts` calls `loadEnvConfig(process.cwd())`, configures `schema: "./src/server/db/schema/index.ts"`, `out: "./drizzle"`, `dialect: "postgresql"`, and conditionally supplies `dbCredentials` only when `DATABASE_URL` exists. Schema generation must not require a live connection.
- `vitest.config.ts` uses Node environment, the `@` alias, and `src/**/*.test.ts`.

- [ ] **Step 1: Install exact dependency groups**

Run:

```powershell
npm install drizzle-orm pg zod
npm install --save-dev drizzle-kit @types/pg vitest tsx @next/env@16.3.5
```

Expected: exit 0; `package.json` and lockfile contain the approved packages only.

- [ ] **Step 2: Add scripts/config/env placeholder and preserve ignore behavior**

Expected implementation: the script/config details above, no secret value, and no imports from homepage code.

- [ ] **Step 3: Verify tooling loads without a database**

Run:

```powershell
npm run test:run -- --passWithNoTests
npx tsc --noEmit
npm run lint
```

Expected: exit 0; Vitest reports no tests yet; TypeScript and ESLint load the new configs without connecting to PostgreSQL.

**Failure/rollback:** If npm installation fails, leave existing homepage dependencies intact and retry only the failed install with approved network access. Never hand-edit a partial lockfile or remove unrelated dependencies.

---

## B2 — Shared contracts

**Objective:** Define one portable type source for product, checkout, order, and API error payloads.

**Files:**
- Create: `src/contracts/product.ts`, `src/contracts/checkout.ts`, `src/contracts/order.ts`, `src/contracts/api-error.ts`, `src/contracts/index.ts`
- Modify: none
- Test: TypeScript compile

**Dependencies:** B1.

**Interfaces produced:**

- `ProductCategory`, `ProductMediaDTO`, `ProductVariantDTO`, `ProductDTO`.
- `CheckoutInput` containing customer, payment method, and identifier/quantity items only.
- Exact frozen `OrderDTO`:

```ts
export type OrderDTO = {
  id: string;
  orderNumber: string;
  totalVnd: number;
  paymentMethod: "cod" | "bank_transfer";
  orderStatus:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipping"
    | "completed"
    | "cancelled";
  paymentStatus:
    | "unpaid"
    | "pending"
    | "paid"
    | "failed"
    | "refunded";
  createdAt: string;
};
```

- `ApiErrorResponse` with `{ error: { code; message; details? } }`.

**Invariants:** `ProductCategory` is `"espresso" | "rang_xay"`; contracts contain no Drizzle/Next server imports; raw inventory and client totals do not appear.

- [ ] **Step 1: Create contract files and the explicit barrel exports**

Expected: DTO names exist once, `CheckoutInput` has no price/name/SKU/total fields, and `OrderDTO.createdAt` is `string`.

- [ ] **Step 2: Compile contracts**

Run:

```powershell
npx tsc --noEmit
rg -n "rang-xay|ground_coffee|coffee_beans" src/contracts
```

Expected: TypeScript exit 0; `rg` returns no matches.

**Failure/rollback:** Contract compile errors are fixed in contracts rather than by loosening strict TypeScript. Do not modify legacy homepage product types in this phase.

---

## B3 — Product, variant, media, and inventory schema

**Objective:** Define the frozen product-side PostgreSQL schema with named constraints and indexes.

**Files:**
- Create: `src/server/db/schema/products.ts`, `src/server/db/schema/index.ts`
- Modify: none
- Test: TypeScript compile; migration inspection occurs in B5

**Dependencies:** B1–B2.

**Implementation details:**

- Define `product_category`, `product_status`, and `product_media_type` PostgreSQL enums with frozen values.
- Define UUID PKs with `defaultRandom()`, `timestamp(..., { withTimezone: true })`, integer prices/stock, and explicit defaults.
- Define `products`, `productVariants`, `productMedia`, and `inventory` exactly as section 6.1–6.4 of the spec.
- Name and include: unique slug/SKU, product status index, variant product index, media `(product_id, sort_order)` index, non-empty checks, positive weight, non-negative/ordered prices, media sort check, and all three inventory checks.
- `product_variants.product_id -> products.id ON DELETE RESTRICT ON UPDATE RESTRICT`.
- `product_media.product_id -> products.id ON DELETE CASCADE ON UPDATE RESTRICT`.
- `inventory.variant_id -> product_variants.id ON DELETE CASCADE ON UPDATE RESTRICT`.
- Add `UNIQUE (id, product_id)` on `product_variants` for the later composite FK.
- Do not expose a repository method that reparents an existing variant.

- [ ] **Step 1: Define enums/tables/constraints with explicit Drizzle names**

Expected: one schema source describes all four tables and the composite unique key.

- [ ] **Step 2: Export product schema and compile**

Run:

```powershell
npx tsc --noEmit
```

Expected: exit 0 with strict types; no database connection attempt.

**Failure/rollback:** If a Drizzle helper cannot express a frozen check/constraint, keep the table definition and record the exact constraint for reviewed custom migration SQL in B5; never omit it silently.

---

## B4 — Order schema and global sequence

**Objective:** Define orders, immutable item snapshots, status history, and the non-resetting order-number sequence.

**Files:**
- Create: `src/server/db/schema/orders.ts`
- Modify: `src/server/db/schema/index.ts`
- Test: TypeScript compile; generated SQL inspection in B5

**Dependencies:** B3.

**Implementation details:**

- Define `payment_method`, `payment_status`, and `order_status` enums.
- Define global `delivn_order_number_seq` with Drizzle `pgSequence`; it starts at 1 and never resets by date.
- Define `orders`, `orderItems`, and `orderStatusHistory` exactly as spec sections 6.5–6.7.
- Preserve all money, non-empty, positive quantity, line-total equality, and total equality checks.
- Add order number unique, created-at descending, phone, status, order-item order, and history indexes.
- Add `UNIQUE (order_id, variant_id)`.
- Add direct `order_items.product_id -> products.id ON DELETE RESTRICT ON UPDATE RESTRICT`.
- Add composite `FOREIGN KEY (variant_id, product_id) REFERENCES product_variants(id, product_id) ON DELETE RESTRICT ON UPDATE RESTRICT`; omit a redundant direct variant FK.
- `order_items.order_id` and history `order_id` both use `RESTRICT/RESTRICT`.

- [ ] **Step 1: Define enums, sequence, tables, and relational constraints**

Expected: mismatched product/variant pairs are structurally impossible at the database layer.

- [ ] **Step 2: Export all schema and compile**

Run:

```powershell
npx tsc --noEmit
```

Expected: exit 0; schema imports are acyclic and do not connect to the database.

**Failure/rollback:** Do not replace the composite FK with independent FKs. If Drizzle typing rejects the composite declaration, use its explicit `foreignKey({ columns, foreignColumns })` table callback and verify B5 SQL before continuing.

---

## B5 — Generated migration and inspection

**Objective:** Generate the checked-in initial migration and prove it contains every frozen database invariant without using `db:push`.

**Files:**
- Create (expected first migration): `drizzle/0000_initial_ecommerce.sql`, `drizzle/meta/_journal.json`, `drizzle/meta/0000_snapshot.json`
- Modify only if required by verified generator limitation: `drizzle/0000_initial_ecommerce.sql`
- Test: SQL inspection; conditional migration execution is B14

**Dependencies:** B3–B4.

**Implementation details:**

- Run the named Drizzle generation script with no `DATABASE_URL` requirement.
- Inspect enum values, seven tables, all indexes/checks, delete/update policies, `UNIQUE (id, product_id)`, composite order-item FK, normalized-line unique constraint, and sequence.
- Expected tables: `products`, `product_variants`, `product_media`, `inventory`, `orders`, `order_items`, `order_status_history`.
- Expected sequence: `delivn_order_number_seq`.
- If `pgSequence` does not emit sequence SQL in the installed compatible Drizzle Kit, add this reviewed statement before table use and keep the schema declaration:

```sql
CREATE SEQUENCE "delivn_order_number_seq"
  AS bigint
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
```

- [ ] **Step 1: Generate the initial migration**

Run:

```powershell
npm run db:generate -- --name initial_ecommerce
```

Expected: exit 0 and exactly one initial SQL migration plus metadata; no database connection.

- [ ] **Step 2: Inspect all authoritative SQL constructs**

Run:

```powershell
rg -n "CREATE TYPE|CREATE TABLE|CREATE SEQUENCE|delivn_order_number_seq|UNIQUE|FOREIGN KEY|CHECK|ON DELETE|ON UPDATE|CREATE INDEX" drizzle
```

Expected: all seven tables, six enums, global sequence, named indexes/checks, composite unique/FK, and explicit actions are present.

- [ ] **Step 3: Compile after generation**

Run:

```powershell
npx tsc --noEmit
```

Expected: exit 0.

**Failure/rollback:** Delete/regenerate only the newly generated initial migration if inspection fails and no live application occurred. Never run `db:push`, drop a database, or edit unrelated schemas.

---

## B6 — Lazy database connection and repository layer

**Objective:** Centralize all PostgreSQL access and expose transaction-scoped repository methods needed by product reads, checkout, and seeding.

**Files:**
- Create: `src/server/db/index.ts`, `src/server/db/migrate.ts`, `src/server/errors/commerce-error.ts`, `src/server/repositories/types.ts`, `src/server/repositories/product.repository.ts`, `src/server/repositories/inventory.repository.ts`, `src/server/repositories/order.repository.ts`, `src/server/repositories/seed.repository.ts`
- Modify: none
- Test: strict compile; behavioral tests use fakes in B7/B10/B12 and live adapter validation in B13/B14

**Dependencies:** B5.

**Interfaces produced:**

```ts
export type Database = NodePgDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export function getDb(): Database;
export function withTransaction<T>(work: (tx: DbTransaction) => Promise<T>): Promise<T>;
export function closeDb(): Promise<void>;
```

```ts
type VariantRelationship = { variantId: string; productId: string };
type LockedProduct = { id: string; name: string; status: "draft" | "active" | "archived" };
type LockedVariant = {
  id: string; productId: string; label: string; sku: string;
  active: boolean; priceVnd: number;
};
type LockedInventory = { variantId: string; quantity: number; reservedQuantity: number };
type OrderRecord = {
  id: string; orderNumber: string; totalVnd: number;
  paymentMethod: "cod" | "bank_transfer";
  orderStatus: "pending" | "confirmed" | "preparing" | "shipping" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  createdAt: Date;
};
```

Repository methods:

- storefront: `listActiveProducts()`, `findActiveProductBySlug(slug)`;
- checkout discovery: `discoverVariantRelationships(tx, variantIds)`;
- locks: `lockProductsForShare(tx, sortedProductIds)`, `lockVariantsForShare(tx, sortedVariantIds)`, `lockInventoryForUpdate(tx, sortedVariantIds)`;
- writes: `reserveInventory(tx, sortedReservations)`, `getNextOrderNumberParts(tx)`, `insertOrder(tx, data)`, `insertOrderItems(tx, items)`, `insertInitialStatus(tx, orderId)`;
- seed insert-if-missing/resolve methods with no update path for protected fields.

**Implementation details and invariants:**

- `commerce-error.ts` initially defines the typed server-configuration error; B9–B10 extend it with validation/money/availability domain errors.
- `getDb()` validates `DATABASE_URL` only on first call, creates one `pg.Pool`, never prints the URL, and throws that typed configuration error when absent.
- Default repository/service factories remain lazy: omitting an executor stores a `() => getDb()` provider and resolves it only inside a called method, never during Route Handler module import or `next build`.
- `migrate.ts` loads root env, calls Drizzle migrator on `./drizzle`, closes the pool in `finally`, and exits nonzero with a generic message on failure.
- Repositories accept a transaction executor for checkout; no checkout query uses the global DB after the transaction starts.
- Parameterize UUID arrays. Controlled raw/tagged SQL is allowed for the three lock queries; never concatenate IDs.
- Each lock method verifies its input is deduplicated/ascending and emits `ORDER BY ... ASC` with exact `FOR SHARE`/`FOR UPDATE` strength.
- `reserveInventory` updates already locked rows in ascending variant order with a guarded availability predicate and verifies one row updated per reservation.
- `nextOrderNumberSeed` returns database transaction time plus `nextval` as a string; formatting stays in `order-number.ts`.

- [ ] **Step 1: Implement lazy connection, transaction typing, and migration runner**

Verification:

```powershell
npx tsc --noEmit
```

Expected: exit 0 without `DATABASE_URL`; no pool is created by import.

- [ ] **Step 2: Implement read/lock/write repository boundaries**

Verification:

```powershell
npx tsc --noEmit
rg -n "FOR SHARE|FOR UPDATE|ORDER BY" src/server/repositories
```

Expected: compile passes; lock SQL appears only in repositories and contains the specified order/strength.

**Failure/rollback:** A repository error propagates to the owning transaction; repositories do not catch-and-commit. Migration runner never drops or truncates. Missing `DATABASE_URL` raises the typed server-configuration error defined in this phase.

---

## B7 — Product service and DTO mapper

**Objective:** Convert repository records to safe active `ProductDTO` values with deduped media/variants and derived stock.

**Files:**
- Create: `src/server/services/product.service.ts`, `src/server/services/product.service.test.ts`
- Modify: none
- Test: `src/server/services/product.service.test.ts`

**Dependencies:** B2, B6.

**Interfaces produced:**

```ts
export function mapProductRecordToDto(record: ProductStoreRecord): ProductDTO;
export function createProductService(repository?: ProductRepository): {
  listActiveProducts(): Promise<ProductDTO[]>;
  getActiveProductBySlug(slug: string): Promise<ProductDTO | null>;
};
```

**Invariants:** active products/variants only; `rang_xay` unchanged; media sorted by `sortOrder`; variants sorted by weight then SKU; `inStock = quantity - reservedQuantity > 0`; missing inventory means `false`; raw quantities absent.

- [ ] **Step 1: Write failing mapper/service tests**

Cases: exact DTO mapping, canonical category, media/variant ordering, inactive variant exclusion, positive/zero/reserved/missing inventory stock states, and no `quantity`/`reservedQuantity` keys.

Run:

```powershell
npm run test:run -- src/server/services/product.service.test.ts
```

Expected: fail because service/mapper exports do not exist.

- [ ] **Step 2: Implement minimal mapper and service**

Run the same command.

Expected: all product service tests pass.

- [ ] **Step 3: Run suite and compile**

```powershell
npm run test:run
npx tsc --noEmit
```

Expected: exit 0.

**Failure/rollback:** Never fix a mapper test by exposing inventory. Empty/inconsistent repository data becomes an empty media/variant list or `inStock: false`, not a fabricated quantity.

---

## B8 — Product validation and Route Handlers

**Objective:** Expose thin active-product read APIs using current Next.js 16 conventions.

**Files:**
- Create: `src/server/validation/product.schema.ts`, `src/server/http/api-errors.ts`, `src/app/api/products/route.ts`, `src/app/api/products/[slug]/route.ts`
- Modify: none
- Test: compile/build in B14; service behavior already tested

**Dependencies:** B7.

**Implementation details:**

- Slug Zod schema: trimmed lowercase ASCII, 1–200 characters, letters/digits separated by single hyphens.
- `GET /api/products` returns `ProductDTO[]` and no static caching opt-in.
- Dynamic handler signature uses `{ params }: { params: Promise<{ slug: string }> }` and awaits it.
- Create the shared HTTP error module with product validation/not-found/generic mappings now; B11 extends the same module with checkout domain mappings.
- Malformed slug returns frozen error envelope/status 400; missing/inactive returns 404; unexpected errors return generic 500.
- Route handlers call services only; no Drizzle/SQL imports.

- [ ] **Step 1: Implement slug validation and both handlers**

- [ ] **Step 2: Verify server-only layering and Next.js types**

Run:

```powershell
npx tsc --noEmit
rg -n "drizzle|pg|SELECT|INSERT|UPDATE" src/app/api/products
```

Expected: TypeScript exit 0; `rg` has no matches.

**Failure/rollback:** Database/config failures are returned generically; no fallback to legacy static products because that would mix authoritative stores.

---

## B9 — Checkout validation, normalization, and checked money

**Objective:** Validate hostile checkout input, normalize duplicate variants before database access, and provide exact bounded VND arithmetic.

**Files:**
- Create: `src/server/validation/checkout.schema.ts`, `src/server/validation/checkout.schema.test.ts`, `src/server/validation/checkout-normalization.ts`, `src/server/validation/checkout-normalization.test.ts`, `src/server/utils/money.ts`, `src/server/utils/money.test.ts`
- Modify: `src/server/errors/commerce-error.ts` to add the typed money-limit error
- Test: the three new test files

**Dependencies:** B2.

**Interfaces produced:**

```ts
export const checkoutSchema: z.ZodType<CheckoutInput>;
export const MAX_CHECKOUT_ITEMS = 50;
export const MAX_QUANTITY_PER_VARIANT = 20;
export type NormalizedCheckoutInput = Omit<CheckoutInput, "items"> & {
  items: ReadonlyArray<{ variantId: string; quantity: number }>;
};
export function normalizeCheckoutInput(input: CheckoutInput): NormalizedCheckoutInput;
export const POSTGRES_INTEGER_MAX = 2_147_483_647;
export function checkedMultiplyVnd(unitPriceVnd: number, quantity: number): number;
export function checkedAddVnd(leftVnd: number, rightVnd: number): number;
```

**Implementation details:**

- Apply the exact name/phone/email/address/note/item/payment bounds from spec section 7.2.
- Normalize phone separators, preserve only an optional leading plus and 8–16 digits; lowercase email; empty optional values become absent.
- Group validated UUIDs in a `Map`, sum, reject grouped total above 20, output one line per variant sorted by canonical UUID string.
- Money helpers reject non-integer, negative, or out-of-range operands, calculate through `BigInt`, check result, then convert to number.

- [ ] **Step 1: Write failing Zod and normalization tests**

Cases: all frozen bounds; malformed UUID; fractional/zero/21 quantity; 51 items; duplicate lines `12 + 8` accepted as one 20-unit line; `12 + 9` rejected; deterministic multi-UUID order.

Run:

```powershell
npm run test:run -- src/server/validation/checkout.schema.test.ts src/server/validation/checkout-normalization.test.ts
```

Expected: fail because implementations do not exist.

- [ ] **Step 2: Implement schemas/normalization and make tests pass**

Run the same command; expected all pass.

- [ ] **Step 3: Write failing checked-money boundary tests**

Literal cases:

- `checkedMultiplyVnd(2_147_483_647, 1)` returns max;
- `checkedMultiplyVnd(1_073_741_824, 2)` rejects;
- `checkedAddVnd(1_500_000_000, 1_000_000_000)` rejects;
- `checkedAddVnd(2_147_483_647, 1)` rejects;
- synthetic `125_000 * 2 + 220_000` returns `470_000`;
- negative and fractional operands reject.

Run:

```powershell
npm run test:run -- src/server/utils/money.test.ts
```

Expected: fail before helper implementation, then pass after exact `BigInt` implementation.

- [ ] **Step 4: Run all tests and compile**

```powershell
npm run test:run
npx tsc --noEmit
```

Expected: exit 0.

**Failure/rollback:** Validation and arithmetic occur before order writes. Typed validation/money errors contain no database internals.

---

## B10 — Transactional checkout, shipping, order mapping, and order number

**Objective:** Implement atomic checkout in the frozen 20-step order with explicit lock-stage dependencies and rollback behavior.

**Files:**
- Create: `src/server/services/shipping.service.ts`, `src/server/utils/order-number.ts`, `src/server/utils/order-number.test.ts`, `src/server/services/order.service.ts`, `src/server/services/order.service.test.ts`, `src/server/services/checkout.service.ts`, `src/server/services/checkout.service.test.ts`
- Modify: `src/server/errors/commerce-error.ts`
- Test: order-number, order-service, checkout-service tests

**Dependencies:** B4, B6, B9.

**Interfaces produced:**

```ts
export type ShippingQuoteInput = Readonly<{ subtotalVnd: number; address: string }>;
export function calculateShippingFeeVnd(input: ShippingQuoteInput): number; // returns 0 in V1 development
export function formatOrderNumber(createdAt: Date, sequenceValue: string): string;
export function mapOrderToDto(order: OrderRecord): OrderDTO;
export function createCheckoutService(deps: CheckoutDependencies): {
  createOrder(input: NormalizedCheckoutInput): Promise<OrderDTO>;
};
```

`CheckoutDependencies` includes `withTransaction`, product/inventory/order repositories, shipping function, and clock-independent order-number formatter. Tests use a stateful in-memory transactional fake that clones state on begin and publishes it only on success; assertions target returned/persisted behavior, not call counts alone.

**Required transaction algorithm:**

1. Receive already validated/normalized input.
2. Begin `withTransaction`.
3. Relationship-only discovery for sorted variant IDs.
4. Require one discovery row per requested variant.
5. Deduplicate/sort product IDs ascending.
6. `lockProductsForShare` for the full product set; require all rows.
7. Use already sorted variant IDs and `lockVariantsForShare`; require all rows.
8. Revalidate every locked variant's product ID against discovery and locked products; never acquire a late product lock.
9. Revalidate locked product `active` status and locked variant `active`, SKU, label, ownership, and current price.
10. `lockInventoryForUpdate` with ascending variant IDs; require all rows.
11. Validate `quantity - reservedQuantity >= normalized quantity`.
12. Build line snapshots using only locked names/SKU/prices and `checkedMultiplyVnd`.
13. Accumulate subtotal using `checkedAddVnd`.
14. Call isolated shipping policy; validate its integer range.
15. Calculate total with `checkedAddVnd`.
16. Obtain database transaction timestamp/global sequence and format `DLV-YYYYMMDD-NNNNNN` in UTC.
17. Insert the order with explicit transaction timestamp and initial payment/order state.
18. Insert one snapshot item per normalized variant.
19. Reserve inventory in ascending variant order.
20. Insert null-to-pending history, return mapped `OrderDTO`, and commit by returning from the transaction callback.

Any exception escapes the callback and rolls back. Sequence gaps are allowed. Product/variant locks are `FOR SHARE`, inventory locks are `FOR UPDATE`, and all remain held to transaction end.

- [ ] **Step 1: Write failing order-number and canonical DTO tests**

Cases: UTC date, sequence `41 -> 000041`, next-day `42 -> 000042`, value over six digits not truncated, complete exact `OrderDTO`, ISO `createdAt`, no customer/inventory fields.

Run:

```powershell
npm run test:run -- src/server/utils/order-number.test.ts src/server/services/order.service.test.ts
```

Expected: fail before implementation; pass after minimal formatter/mapper.

- [ ] **Step 2: Write failing checkout happy-path test**

Use two normalized variants presented in reverse fake-repository order and assert the real service returns/persists: current locked prices, literal line totals, one snapshot per variant, subtotal/zero shipping total, correct payment state, reservation increments, and initial history.

Run:

```powershell
npm run test:run -- src/server/services/checkout.service.test.ts
```

Expected: fail because checkout service is absent.

- [ ] **Step 3: Implement error types, temporary shipping, and transaction skeleton through all three lock stages**

The fake transaction log must show exactly `products:share -> variants:share -> inventory:update` and ascending deduplicated IDs at each stage. Make the happy path pass.

- [ ] **Step 4: Add failing availability/commercial-state tests**

Cases: missing product, missing variant, missing inventory, inactive product, inactive variant, insufficient `quantity - reservedQuantity`, and server price differing from any impossible client total field.

Expected: `ITEM_UNAVAILABLE` or `INSUFFICIENT_INVENTORY`; no transaction state published.

- [ ] **Step 5: Implement availability/commercial validation and rerun tests**

Expected: all cases pass without extra locks or writes.

- [ ] **Step 6: Add failing stale-discovery/global-order tests**

Cases: discovery says Product A but locked variant says Product B; duplicate products dedupe; products/variants/inventory IDs each sort ascending; relationship drift records no attempt to lock Product B after variant lock.

Expected: stale relationship returns `ITEM_UNAVAILABLE`, fake state/log shows no late product lock and no write.

- [ ] **Step 7: Implement locked relationship revalidation and rerun tests**

Expected: all lock protocol tests pass.

- [ ] **Step 8: Add failing service-level money tests**

Cases: total exactly max accepted with shipping 0; multiplication overflow; individually valid lines whose subtotal overflows; valid subtotal plus injected shipping overflow; normal `470_000` synthetic total.

Expected: overflow cases raise typed money error before sequence/order insertion; exact max/normal cases pass.

- [ ] **Step 9: Integrate checked arithmetic and temporary shipping policy**

Expected: money tests pass; production shipping function is clearly labeled `TEMPORARY V1 DEVELOPMENT POLICY` and returns literal `0`.

- [ ] **Step 10: Add failing rollback tests at each write boundary**

Inject failures during order insertion, item insertion, reservation, and history insertion. Assert the transaction fake's committed order/items/history/reservations remain byte-for-byte unchanged after each failure.

- [ ] **Step 11: Complete writes and make rollback tests pass**

Run:

```powershell
npm run test:run -- src/server/services/checkout.service.test.ts
npm run test:run
npx tsc --noEmit
```

Expected: all tests and compile pass.

**Failure/rollback:** Never catch an internal checkout error inside the transaction and return success. No late product lock, client amount, current-price recomputation after locks, partial reservation, or swallowed write failure is permitted.

---

## B11 — Checkout API and stable HTTP error mapping

**Objective:** Add a thin POST handler that returns canonical `OrderDTO` and frozen safe errors.

**Files:**
- Create: `src/server/http/api-errors.test.ts`, `src/app/api/checkout/route.ts`
- Modify: `src/server/http/api-errors.ts`, `src/app/api/products/route.ts`, `src/app/api/products/[slug]/route.ts`
- Test: API error mapper tests; compile/build later

**Dependencies:** B8–B10.

**Implementation details:**

- Handler sequence: parse JSON -> `checkoutSchema.safeParse` -> normalize -> checkout service -> `Response.json(OrderDTO, { status: 201 })`.
- Map malformed JSON to 400 `INVALID_JSON`; Zod/normalization to 400 `VALIDATION_ERROR`; unavailable/inactive/stale relationship to 409 `ITEM_UNAVAILABLE`; stock to 409 `INSUFFICIENT_INVENTORY`; money to 422 `ORDER_VALUE_LIMIT_EXCEEDED`; missing DB config and unknown errors to safe 500 codes.
- Do not return SQL, Drizzle/pg messages, stack, constraint names, or connection data.
- Route imports no repositories/Drizzle/pg.

- [ ] **Step 1: Write failing error-mapper tests**

Cases: every frozen status/code, safe Zod path details, unknown `Error("password=secret")` mapped to generic `INTERNAL_ERROR` without original message.

- [ ] **Step 2: Implement mapper and make tests pass**

Run:

```powershell
npm run test:run -- src/server/http/api-errors.test.ts
```

Expected: all mapping/leak tests pass.

- [ ] **Step 3: Implement checkout handler and unify product handlers**

Run:

```powershell
npx tsc --noEmit
rg -n "drizzle|pg|SELECT|INSERT|UPDATE|DATABASE_URL" src/app/api
```

Expected: compile passes; route handlers contain no persistence details or secret access.

**Failure/rollback:** JSON/validation failures occur before a transaction. Internal failures return 500 without exposing cause; service transaction remains authoritative for rollback.

---

## B12 — Safe development seed

**Objective:** Provide an explicit, non-destructive seed for confirmed product identities/weights that cannot overwrite live commercial state.

**Files:**
- Create: `src/server/db/seed-data.ts`, `src/server/services/seed.service.ts`, `src/server/services/seed.service.test.ts`, `src/server/db/seed.ts`
- Modify: `src/server/repositories/seed.repository.ts` only to complete the already defined adapter
- Test: seed service tests

**Dependencies:** B6, B10.

**Implementation details:**

- Template identities: `CÀ PHÊ HẠT RANG ESPRESSO`/`espresso` and `CÀ PHÊ RANG XAY`/`rang_xay`, each with `250g` and `500g`.
- Reuse approved slug/short-name/description content already present in `src/data/products.ts` by copying verified Unicode literals into server-only seed data; do not import browser data or modify it.
- Require explicit environment SKU, price, and stock for all four variants. Exact prefixes: `DELIVN_SEED_ESPRESSO_250_*`, `DELIVN_SEED_ESPRESSO_500_*`, `DELIVN_SEED_RANG_XAY_250_*`, `DELIVN_SEED_RANG_XAY_500_*`, with suffixes `SKU`, `PRICE_VND`, `STOCK`.
- Validate non-empty SKU, positive integer price within PostgreSQL max, and non-negative integer stock before opening the transaction.
- Missing product inserts draft; existing slug is resolved and unchanged.
- Missing SKU inserts inactive variant; existing SKU is unchanged and identity/ownership/weight verified.
- Missing inventory inserts explicit stock/reserved 0; existing inventory is unchanged.
- No production-template media is seeded because no deterministic database media UUID is approved. The generic seed service/repository accepts a deterministic media UUID when a future template supplies one, uses insert-if-missing only, and has no media update path.
- Seed writes follow the global writer order: resolve/insert and ascending-lock products first, resolve/insert and ascending-lock variants second, then insert inventory; it never returns to an earlier table lock stage.
- Entire seed transaction aborts on conflicting SKU identity. No destructive/refresh flag exists.

- [ ] **Step 1: Write failing seed input and rerun-policy tests**

Cases: missing/invalid env rejected before transaction; first run creates draft/inactive rows; rerun preserves status, active state, price, compare-at, quantity, reservation, text, and existing media; conflicting SKU owner/weight or synthetic deterministic-media identity aborts with no partial writes; existing `quantity < reservedQuantity` is never produced or modified.

Run:

```powershell
npm run test:run -- src/server/services/seed.service.test.ts
```

Expected: fail before service implementation.

- [ ] **Step 2: Implement seed template/service/CLI and repository adapter**

Use transaction-scoped `INSERT ... ON CONFLICT DO NOTHING`, then resolve/verify identities. Never use `DO UPDATE` for protected data.

- [ ] **Step 3: Run seed tests and compile without executing the CLI**

```powershell
npm run test:run -- src/server/services/seed.service.test.ts
npx tsc --noEmit
```

Expected: tests/compile pass; no database connection or seed write occurs.

**Failure/rollback:** Environment or identity failure happens before commit and leaves all tables unchanged. Existing commercial values always win. No default numeric price/stock appears in seed source.

---

## B13 — Focused suite completion and conditional database integration

**Objective:** Close coverage gaps, add safe live-database validation when configured, and run the complete focused suite.

**Files:**
- Create: `src/server/database.integration.test.ts`
- Modify: none expected; all unit cases are assigned to B7/B9/B10/B11/B12
- Test: every `*.test.ts`

**Dependencies:** B1–B12.

**Required coverage matrix:**

- product mapping, `espresso | rang_xay`, sorting, no raw inventory, all `inStock` boundaries;
- CheckoutInput bounds, phone/email normalization, duplicate grouping, grouped maximum, deterministic UUID order;
- checked max/multiply/subtotal/final-total/normal arithmetic;
- current locked server price, snapshots, inactive/missing product/variant/inventory, insufficient available stock;
- global lock stages/order/strength, stale discovery, no late lock;
- one normalized item/reservation, initial status/payment/history, canonical `OrderDTO`, rollback at every write stage;
- global non-resetting order number and sequence formatting;
- stable safe API errors;
- non-destructive seed rerun/conflict rollback.

**Conditional integration behavior:**

- Skip with an explicit diagnostic if `DATABASE_URL` is absent; never fail the unit suite solely for that absence.
- When present, parse without printing it and require local host plus database name `delivn_dev` before mutation tests.
- Assume B14 migration ran first, use transaction/savepoints, unique UUID fixtures, and roll back all test rows.
- Verify composite product/variant FK mismatch rejection, negative/reserved-over-quantity inventory checks, slug/SKU/order-number/normalized-line uniques, sequence monotonicity across rollbacks, and a small checkout commit/rollback smoke case.
- Do not drop, truncate, reset sequence, or touch unrelated schemas/data.

- [ ] **Step 1: Audit the frozen matrix against named tests**

Run:

```powershell
rg -n "describe\(|it\(|test\(" src/server -g "*.test.ts"
```

Expected: each matrix item maps to a specific named test; add a failing test first for every gap.

- [ ] **Step 2: Add conditional integration tests**

Run without URL:

```powershell
npm run test:run -- src/server/database.integration.test.ts
```

Expected: explicit skip/deferred result, exit 0, no connection attempt.

- [ ] **Step 3: Run the complete unit/focused suite**

```powershell
npm run test:run
```

Expected: all non-conditional tests pass; database integration either passes when safely configured or reports skipped when absent.

**Failure/rollback:** A live test failure rolls back its transaction/savepoint and reports the failed invariant without credentials. Existing database rows and sequence are not reset.

---

## B14 — Final lint, build, migration, and database validation

**Objective:** Produce fresh evidence for tests, lint, build, migration SQL, and conditional live database behavior.

**Files:**
- Modify: none expected; a failure requires returning to its owning B-phase and adding a failing regression test before the scoped correction
- Create: none expected

**Dependencies:** B0–B13.

**Verification order:**

- [ ] **Step 1: Recheck frozen spec and scope**

```powershell
(Get-FileHash -Algorithm SHA256 -LiteralPath 'docs\superpowers\specs\2026-09-23-delivn-ecommerce-foundation-design.md').Hash
rg -n "rang-xay|ground_coffee|coffee_beans" src/contracts src/server src/app/api
```

Expected: frozen SHA; no category aliases.

- [ ] **Step 2: Run all tests**

```powershell
npm run test:run
```

Expected: all unit tests pass; integration passes or explicitly skips due absent URL.

- [ ] **Step 3: Run lint and production build**

```powershell
npm run lint
npm run build
```

Expected: both exit 0 without requiring a database connection; homepage remains build-compatible.

- [ ] **Step 4: Reinspect migration**

```powershell
rg -n "CREATE TYPE|CREATE TABLE|CREATE SEQUENCE|delivn_order_number_seq|UNIQUE|FOREIGN KEY|CHECK|ON DELETE|ON UPDATE|CREATE INDEX" drizzle
```

Expected: all frozen schema constructs remain present; no `db:push` artifacts.

- [ ] **Step 5: Conditionally apply and validate the live database**

If `DATABASE_URL` is present privately:

```powershell
npm run db:migrate
npm run test:run -- src/server/database.integration.test.ts
```

Expected: migration applies cleanly to `delivn_dev`; integration cases pass; created tables/sequence can be inspected without dropping anything.

If absent, do not run either command and record exactly:

```text
DATABASE_VALIDATION_DEFERRED_NO_DATABASE_URL
```

- [ ] **Step 6: Confirm protected files were not part of implementation**

Because Git metadata is absent, compare the implementation file manifest against the protected path list captured in B0 and report that no task wrote those paths.

Expected final evidence: tests/lint/build pass; live database either passes or has the exact deferred status; no secret, UI, or protected asset modification.

**Failure/rollback:** Do not claim a failed command passed. Fix only in-scope causes, rerun the full command, and report unrelated pre-existing failures by name. Never drop the database, reset the global sequence, or delete unrelated tables.

---

## Implementation dependency order

```text
B0 audit/spec hash
 -> B1 tooling
 -> B2 contracts
 -> B3 product schema
 -> B4 order schema
 -> B5 generated migration
 -> B6 DB/repositories
 -> B7 product service tests + mapper
 -> B8 product routes
 -> B9 validation/normalization/money tests
 -> B10 checkout/order tests + transaction
 -> B11 checkout route/error mapper
 -> B12 seed tests + seed
 -> B13 full focused/integration tests
 -> B14 final verification
```

## Explicitly deferred

- Every ecommerce React page/component and cart/localStorage implementation.
- Admin UI and product/inventory/order mutation APIs.
- Authentication, customer accounts, reviews, and wishlist.
- Payment gateways, bank-account content, and shipping-provider integrations.
- Real shipping pricing; the current policy remains development-only zero.
- Cancellation reservation release, fulfillment stock consumption, partial fulfillment, returns, refunds, and inventory reconciliation beyond checkout reservation.
- Product-variant re-parenting.
- Production activation, confirmed SKUs/prices/stock, and destructive seed refresh.
- Live migration/database validation until `DATABASE_URL` is privately configured.

## Plan completion gate

Implementation starts only after this plan is reviewed and approved. At execution time, follow TDD for behavior: write a focused failing test, verify the expected failure, implement minimally, rerun the focused test, then run the full suite before crossing each task boundary.
