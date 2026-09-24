# DELIVN Ecommerce Foundation Design

**Date:** 2026-09-23  
**Status:** Proposed specification for review  
**Scope:** PostgreSQL, Drizzle ORM, ecommerce contracts, product reads, and transactional checkout/order creation. No ecommerce UI or homepage changes.

## 1. Purpose and success criteria

This foundation replaces no existing storefront behavior. It adds a server-only commerce subsystem that future storefront pages can consume without trusting browser-provided prices, totals, names, SKUs, or stock values.

The work is successful when:

- PostgreSQL schema and generated Drizzle migrations describe products, variants, media, inventory, orders, order items, and order status history.
- Shared TypeScript contracts define storefront-safe product output and checkout input without importing server code.
- product list/detail Route Handlers return active products only.
- checkout validates and normalizes item requests, follows one global table/row lock protocol, calculates money on the server, creates immutable order snapshots, reserves stock, and records initial status history in one transaction.
- focused tests cover the highest-risk domain behavior.
- lint and build work without requiring a live database connection.
- live migration/database validation is explicitly deferred until `DATABASE_URL` is configured privately in root `.env.local`.

## 2. Existing architecture and protected scope

The project is a Next.js 16.3.5 App Router application with React 19 and strict TypeScript. The existing homepage lives under `src/app/(storefront)` and uses static product data in `src/data/products.ts` plus homepage and Three.js components.

The following remain untouched:

- homepage Screens 01 through 05;
- Three.js and GLB behavior/assets;
- footer, motion system, and brand/story assets;
- current homepage styles and static product data unless a build-only compatibility change proves necessary;
- all ecommerce UI, including `/san-pham`, product cards, cart, and checkout pages.

The workspace currently has no Git metadata. Specification and plan commits cannot be created here. This does not change the intended source layout or validation process.

## 3. Architectural boundaries

The dependency direction is:

```text
Route Handler -> Zod validation -> Service -> Repository -> Drizzle -> PostgreSQL
                         |             |
                         +-> Contract <-+
```

### Contracts

`src/contracts` contains portable TypeScript types used by server code and future UI. Contracts do not import Drizzle, PostgreSQL, Next.js server modules, or repository types.

### Validation

`src/server/validation` owns Zod schemas, input bounds, trimming, phone normalization, slug validation, and checkout-item normalization. It does not query the database.

### Services

Services own use-case behavior:

- `product.service.ts` requests active product records and maps them to `ProductDTO`.
- `checkout.service.ts` orchestrates the transaction, authoritative price calculation, inventory checks/reservation, snapshots, shipping, and checkout output.
- `order.service.ts` exposes order-number and order-creation coordination needed by checkout; status mutation behavior is outside this task.
- `shipping.service.ts` isolates the temporary shipping policy.

### Repositories

Repositories are server-only data-access units:

- `product.repository.ts` reads active products with active variants, media, and inventory needed for DTO derivation.
- `inventory.repository.ts` acquires inventory locks in the global protocol and applies reservation increments within the same transaction.
- `order.repository.ts` obtains sequence-backed order numbers and inserts orders, snapshot items, and initial status history.

Repository methods that participate in checkout receive the same Drizzle transaction handle. They never start independent transactions or use a separate pool connection during checkout.

### Route Handlers

Route Handlers translate HTTP input/output only. They parse JSON, call validation/services, map known domain errors to stable responses, and return generic internal errors without PostgreSQL details.

## 4. Runtime and configuration

Dependencies:

- runtime: `drizzle-orm`, `pg`, `zod`;
- development: `drizzle-kit`, `@types/pg`, `vitest`, and `tsx` for the seed command;
- Next.js-provided `@next/env` is used by root tooling to load `.env*` consistently when needed.

`DATABASE_URL` is the only database connection string. It is read on the server and never exposed with a `NEXT_PUBLIC_` prefix.

Root `.env.example` contains only a safe placeholder:

```dotenv
DATABASE_URL=postgresql://delivn_app:CHANGE_ME@127.0.0.1:5432/delivn_dev
```

`.gitignore` continues to ignore `.env*`, adds `!.env.example`, and therefore keeps `.env.local` private. Database initialization is lazy: importing server modules or building routes does not open a connection or require `DATABASE_URL`; calling a database-backed use case without it produces a controlled server configuration error.

## 5. PostgreSQL enum/value strategy

PostgreSQL enums provide constrained V1 values:

| Enum | Values |
|---|---|
| `product_category` | `espresso`, `rang_xay` |
| `product_status` | `draft`, `active`, `archived` |
| `product_media_type` | `image` |
| `payment_method` | `cod`, `bank_transfer` |
| `payment_status` | `unpaid`, `pending`, `paid`, `failed`, `refunded` |
| `order_status` | `pending`, `confirmed`, `preparing`, `shipping`, `completed`, `cancelled` |

`espresso` and `rang_xay` are canonical everywhere: PostgreSQL, Drizzle, repositories, services, contracts, and API JSON. There is no category translation layer.

Adding a future media type or lifecycle value requires an explicit migration. This is intentional because API and database values must evolve together.

## 6. Database schema

All primary identifiers are UUIDs generated by PostgreSQL/Drizzle defaults. All timestamps use `timestamptz`. All VND amounts use PostgreSQL `integer`; fractional monetary values are invalid and floating-point monetary calculations are not used. The service applies the checked arithmetic policy in section 6.9 before any order persistence.

### 6.1 `products`

| Column | Type | Null | Default/constraint |
|---|---|---:|---|
| `id` | uuid | no | primary key, random UUID |
| `slug` | text | no | unique, non-empty |
| `name` | text | no | non-empty |
| `short_name` | text | no | non-empty |
| `description` | text | no | non-empty |
| `category` | `product_category` | no | — |
| `status` | `product_status` | no | `draft` |
| `featured` | boolean | no | `false` |
| `created_at` | timestamptz | no | current timestamp |
| `updated_at` | timestamptz | no | current timestamp |

Indexes and constraints:

- unique index on `slug`;
- index on `status`;
- check trimmed `slug`, `name`, `short_name`, and `description` are non-empty.

Products are archived instead of hard-deleted once commercially relevant.

### 6.2 `product_variants`

| Column | Type | Null | Default/constraint |
|---|---|---:|---|
| `id` | uuid | no | primary key, random UUID |
| `product_id` | uuid | no | FK to `products.id`, `ON DELETE RESTRICT`, `ON UPDATE RESTRICT` |
| `sku` | text | no | unique, non-empty |
| `label` | text | no | non-empty |
| `weight_grams` | integer | no | greater than zero |
| `price_vnd` | integer | no | zero or greater |
| `compare_at_price_vnd` | integer | yes | null or greater than/equal to `price_vnd` |
| `active` | boolean | no | `false` |
| `created_at` | timestamptz | no | current timestamp |
| `updated_at` | timestamptz | no | current timestamp |

Indexes and constraints:

- unique index on `sku`;
- composite unique constraint on `(id, product_id)` to support the order-item ownership foreign key;
- index on `product_id`;
- checks for positive weight, non-negative prices, valid compare-at price, and non-empty SKU/label.

The 250 g and 500 g packages are variant rows belonging to one product row per product identity. A variant's `product_id` is effectively immutable after creation in V1.

### 6.3 `product_media`

| Column | Type | Null | Default/constraint |
|---|---|---:|---|
| `id` | uuid | no | primary key, random UUID |
| `product_id` | uuid | no | FK to `products.id`, `ON DELETE CASCADE`, `ON UPDATE RESTRICT` |
| `type` | `product_media_type` | no | `image` |
| `url` | text | no | non-empty |
| `alt` | text | no | may be empty only when intentionally decorative |
| `sort_order` | integer | no | `0`, zero or greater |

Indexes and constraints:

- composite index on `(product_id, sort_order)`;
- checks for non-empty URL and non-negative sort order.

Media rows are dependent metadata and can be removed with an otherwise deletable product. Future media types extend the enum without redesigning products.

### 6.4 `inventory`

| Column | Type | Null | Default/constraint |
|---|---|---:|---|
| `variant_id` | uuid | no | primary key and FK to `product_variants.id`, `ON DELETE CASCADE`, `ON UPDATE RESTRICT` |
| `quantity` | integer | no | `0` |
| `reserved_quantity` | integer | no | `0` |
| `updated_at` | timestamptz | no | current timestamp |

Checks:

- `quantity >= 0`;
- `reserved_quantity >= 0`;
- `reserved_quantity <= quantity`.

There is exactly one inventory row per variant. The invariant is:

```text
available_quantity = quantity - reserved_quantity
```

Checkout reserves inventory by increasing `reserved_quantity`; it does not reduce `quantity`.

### 6.5 `orders`

| Column | Type | Null | Default/constraint |
|---|---|---:|---|
| `id` | uuid | no | primary key, random UUID |
| `order_number` | text | no | unique |
| `customer_name` | text | no | non-empty |
| `phone` | text | no | normalized, non-empty |
| `email` | text | yes | normalized lowercase email or null |
| `address` | text | no | non-empty |
| `note` | text | yes | trimmed text or null |
| `subtotal_vnd` | integer | no | zero or greater |
| `shipping_fee_vnd` | integer | no | zero or greater |
| `total_vnd` | integer | no | equals subtotal plus shipping |
| `payment_method` | `payment_method` | no | — |
| `payment_status` | `payment_status` | no | `unpaid` |
| `order_status` | `order_status` | no | `pending` |
| `created_at` | timestamptz | no | current timestamp |
| `updated_at` | timestamptz | no | current timestamp |

Indexes and constraints:

- unique index on `order_number`;
- descending index on `created_at`;
- index on `phone`;
- index on `order_status`;
- check money values are non-negative and `total_vnd = subtotal_vnd + shipping_fee_vnd`;
- checks for non-empty customer name, phone, and address.

### 6.6 `order_items`

| Column | Type | Null | Default/constraint |
|---|---|---:|---|
| `id` | uuid | no | primary key, random UUID |
| `order_id` | uuid | no | FK to `orders.id`, `ON DELETE RESTRICT`, `ON UPDATE RESTRICT` |
| `product_id` | uuid | no | FK to `products.id`, `ON DELETE RESTRICT`, `ON UPDATE RESTRICT`; also part of the composite variant-ownership FK |
| `variant_id` | uuid | no | part of composite FK `(variant_id, product_id)` to `product_variants(id, product_id)` |
| `product_name_snapshot` | text | no | non-empty |
| `variant_name_snapshot` | text | no | non-empty |
| `sku_snapshot` | text | no | non-empty |
| `unit_price_vnd_snapshot` | integer | no | zero or greater |
| `quantity` | integer | no | greater than zero |
| `line_total_vnd` | integer | no | unit price multiplied by quantity |

Indexes and constraints:

- index on `order_id`;
- unique constraint on `(order_id, variant_id)` so normalized checkout cannot create duplicate variant lines;
- composite FK `(variant_id, product_id) REFERENCES product_variants(id, product_id) ON DELETE RESTRICT ON UPDATE RESTRICT`;
- checks for positive quantity, non-negative price/line total, snapshot text, and correct line-total multiplication.

The direct `product_id -> products.id` FK is retained for explicit product integrity, analytics joins, and intentional delete semantics. The composite variant-ownership FK is the authoritative proof that the stored variant belongs to that same product. The database rejects an order item pairing Product A with a variant owned by Product B, even when both UUIDs exist independently. Drizzle represents these with a composite `unique` declaration on `product_variants` and a composite `foreignKey` declaration on `order_items`; no redundant direct `variant_id` FK is needed.

Order rendering uses snapshot fields and stored totals only. It never recomputes history from current product rows.

### 6.7 `order_status_history`

| Column | Type | Null | Default/constraint |
|---|---|---:|---|
| `id` | uuid | no | primary key, random UUID |
| `order_id` | uuid | no | FK to `orders.id`, `ON DELETE RESTRICT`, `ON UPDATE RESTRICT` |
| `from_status` | `order_status` | yes | null for initial entry |
| `to_status` | `order_status` | no | — |
| `note` | text | yes | — |
| `created_at` | timestamptz | no | current timestamp |

Indexes:

- composite index on `(order_id, created_at)`;
- index on `created_at` for operational history queries.

The initial entry is `{ from_status: null, to_status: "pending" }`.

### 6.8 Global order-number sequence

`delivn_order_number_seq` is a global, monotonically increasing PostgreSQL sequence. It never resets daily. Within checkout, the repository obtains `nextval` plus the database's UTC calendar date and formats:

```text
DLV-YYYYMMDD-NNNNNN
```

Examples:

```text
DLV-20260923-000041
DLV-20260924-000042
```

The date is a human-readable UTC calendar component, not a uniqueness boundary. The numeric sequence is left-padded to at least six digits and continues beyond six digits without truncation. Sequence values are not rolled back, so gaps are expected. The unique constraint on `orders.order_number` remains authoritative.

### 6.9 Checked VND arithmetic

Every persisted VND value must be an integer in the inclusive range `0..2_147_483_647`, matching PostgreSQL `integer`. Checkout does not rely on a PostgreSQL overflow error as business validation.

A focused money helper exposes behavior equivalent to:

```ts
checkedMultiplyVnd(unitPriceVnd: number, quantity: number): number;
checkedAddVnd(leftVnd: number, rightVnd: number): number;
```

Each helper first requires integer, non-negative operands within the PostgreSQL integer range, performs the operation using exact integer semantics such as `BigInt`, and returns a JavaScript number only after verifying the result is no greater than `2_147_483_647`. An unexpected negative operand/result, non-integer operand/result, or result above the maximum raises a typed checkout money-limit error.

Checkout applies these helpers to all three boundaries before obtaining an order number or inserting an order:

1. each `unit_price_vnd * quantity` line total;
2. every subtotal accumulation across normalized lines;
3. `subtotal_vnd + shipping_fee_vnd`.

The shipping result must itself be a non-negative integer within range. A value exactly equal to `2_147_483_647` is accepted if every other checkout rule passes. Any invalid/overflowing result stops checkout before persistence, rolls back the transaction, and maps to the stable public `ORDER_VALUE_LIMIT_EXCEEDED` error without exposing PostgreSQL types or messages.

## 7. Shared contracts

### 7.1 Product contract

```ts
export type ProductCategory = "espresso" | "rang_xay";

export type ProductMediaDTO = {
  id: string;
  type: "image";
  url: string;
  alt: string;
  sortOrder: number;
};

export type ProductVariantDTO = {
  id: string;
  sku: string;
  label: string;
  weightGrams: number;
  priceVnd: number;
  compareAtPriceVnd: number | null;
  inStock: boolean;
};

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  featured: boolean;
  media: ProductMediaDTO[];
  variants: ProductVariantDTO[];
};
```

Product APIs return active products and active variants only. Media is sorted by `sortOrder`, variants by `weightGrams` then SKU. `inStock` is derived server-side as `quantity - reservedQuantity > 0`. Raw inventory quantities are not exposed.

### 7.2 Checkout input

```ts
export type CheckoutInput = {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    note?: string;
  };
  paymentMethod: "cod" | "bank_transfer";
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
};
```

Commercial names, SKUs, prices, shipping fees, subtotals, and totals are absent by design.

Validation bounds:

- customer name: 2–100 trimmed characters;
- phone: accepted input contains digits plus common separators and optional leading `+`; separators are removed before storage, and the normalized value must contain 8–16 digits;
- email: optional, trimmed, lowercased, valid email, maximum 254 characters; empty input becomes absent;
- address: 5–500 trimmed characters;
- note: optional, maximum 1,000 trimmed characters; empty input becomes absent;
- items: 1–50 submitted entries;
- variant ID: UUID;
- submitted quantity: positive integer, maximum 20;
- payment method: `cod` or `bank_transfer` only.

### 7.3 Checkout normalization

After Zod validates the external shape and before any database query:

1. group entries by `variantId`;
2. sum quantities for each variant;
3. reject a grouped quantity over `MAX_QUANTITY_PER_VARIANT` (`20`), even if each individual entry passed validation;
4. produce exactly one normalized item per variant;
5. sort normalized items lexicographically by canonical UUID string.

The sorted normalized array is the only item collection passed to repositories. It supplies the deduplicated variant IDs used by the global lock protocol and produces one order item per purchased variant.

### 7.4 Canonical public order contract

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

`createdAt` is an ISO 8601 UTC timestamp serialized from `orders.created_at`. `POST /api/checkout` returns `OrderDTO` directly; there is no separate or competing `CheckoutSuccessDTO`. A newly created COD order begins with payment status `unpaid`; a bank-transfer order begins with payment status `pending`; both begin with order status `pending`.

This minimal contract is sufficient for the future checkout success page. A richer order-history or order-detail representation, including customer snapshot, items, and status history, may be introduced later as a separate `OrderDetailDTO`; it is explicitly deferred from this foundation.

## 8. Product read flow

`GET /api/products`:

- queries `products.status = active`;
- returns `ProductDTO[]` with active variants, sorted media, and derived `inStock`;
- returns HTTP 200 with an empty array if none exist.

`GET /api/products/[slug]`:

- awaits the Next.js 16 route `params` promise;
- validates the slug as 1–200 lowercase ASCII characters using letters, digits, and single hyphen separators;
- returns HTTP 200 with one active `ProductDTO`;
- returns HTTP 404 for missing or inactive products;
- returns HTTP 400 for malformed slugs.

Product reads are dynamic database reads and are not opted into static Route Handler caching in this foundation.

## 9. Checkout transaction and global locking

### 9.1 Global ecommerce lock protocol

Every transaction that locks overlapping product, variant, or inventory state uses this table order:

1. `products`;
2. `product_variants`;
3. `inventory`.

Within each table, the transaction deduplicates the IDs, sorts them in ascending UUID order, and acquires locks in that exact order. Checkout uses:

```text
SELECT ... FROM products
WHERE id = ANY (...)
ORDER BY id ASC
FOR SHARE;

SELECT ... FROM product_variants
WHERE id = ANY (...)
ORDER BY id ASC
FOR SHARE;

SELECT ... FROM inventory
WHERE variant_id = ANY (...)
ORDER BY variant_id ASC
FOR UPDATE;
```

`FOR SHARE` protects commercial product/variant metadata—status, active state, price, product ownership, SKU, and snapshot names—from concurrent update or deletion while checkout validates and snapshots it. `FOR UPDATE` protects inventory because checkout mutates `reserved_quantity`. PostgreSQL keeps all three lock sets until transaction commit or rollback.

This ordering is a global architectural invariant, not a checkout-local convention. Every future writer that locks overlapping ecommerce state, including admin product updates, variant updates, inventory adjustments, and bulk maintenance, must take only the applicable table locks in the same `products -> product_variants -> inventory` order and ascending-ID order within each table. A writer must never lock a variant and then its product, or inventory and then its variant.

Existing variant ownership is effectively immutable in V1: changing `product_variants.product_id` is not a normal repository operation. Any future re-parenting feature requires an explicit design that uses the same global lock protocol and preserves order-item relational integrity.

### 9.2 Discovery and locked revalidation

Normalized variant IDs do not reveal product IDs, so checkout may make one preliminary non-locking discovery read that returns only variant ID/product ID relationships. The discovery result is used only to construct the deduplicated, ascending product-ID lock set. No status, active flag, price, SKU, name, or total from this read is authoritative.

After acquiring product locks in ascending order, checkout acquires variant locks in ascending order, then inventory locks in ascending variant-ID order. It re-reads and revalidates every commercial fact from those locked rows before calculating totals or producing snapshots. The locked variant's `product_id` must match the discovered relationship and an acquired product lock. If a relationship changed, a discovered product disappeared, or an additional product lock would be required, checkout fails safely with a retryable/unavailable domain error; it never takes a late out-of-order product lock or uses stale discovery data.

### 9.3 Transaction sequence

`POST /api/checkout` executes this sequence:

1. Parse request JSON and validate with Zod.
2. Normalize duplicate variant lines, enforce post-grouping quantity bounds, and sort variant UUIDs lexicographically.
3. Start one PostgreSQL transaction.
4. Perform the relationship-only discovery read for normalized variant IDs; detect missing variants.
5. Deduplicate/sort discovered product IDs and acquire all matching `products` locks with ordered `FOR SHARE`.
6. Deduplicate/sort normalized variant IDs and acquire all matching `product_variants` locks with ordered `FOR SHARE`.
7. Revalidate locked variant ownership against discovery and the locked product set; fail safely on any mismatch.
8. Acquire all matching `inventory` locks with ordered `FOR UPDATE`; detect missing inventory rows.
9. From locked rows, verify every variant is active, every product has `status = active`, and every relationship still matches.
10. Verify `quantity - reserved_quantity >= requested quantity` for every normalized line.
11. Read authoritative names, SKU, and integer price only from the locked rows.
12. Calculate each `line_total_vnd = price_vnd * quantity` with checked integer arithmetic.
13. Sum the authoritative subtotal with checked integer arithmetic.
14. Call the server-only shipping policy and calculate total with checked integer arithmetic.
15. Obtain the next global sequence value and format the order number.
16. Insert the order.
17. Insert one immutable snapshot order item per normalized variant.
18. Increase each locked inventory row's `reserved_quantity` by the normalized quantity and update `updated_at`.
19. Insert initial order status history from null to `pending`.
20. Commit and return the canonical `OrderDTO`.

Any thrown validation, relationship, availability, arithmetic, insert, reservation, or history error aborts the callback and rolls back every transactional table write. PostgreSQL sequence increments may remain as gaps after rollback.

The global ordering prevents participating writers from taking the same logical resources in conflicting orders. Inventory row locks prevent simultaneous checkouts from both observing the final available units. Database inventory and relationship constraints remain final integrity backstops.

## 10. Reservation lifecycle

This task implements reservation creation only:

```text
on checkout: reserved_quantity += purchased_quantity
available_quantity = quantity - reserved_quantity
```

Future order-status mutation services must reconcile reservations atomically:

- cancellation releases the reservation by decreasing `reserved_quantity`;
- fulfillment/completion converts the reservation into consumed stock according to the final inventory policy, normally decreasing both `quantity` and `reserved_quantity` by the fulfilled amount;
- invalid or repeated transitions must be idempotent or rejected so stock is never released or consumed twice.

Those mutation APIs, admin workflows, and final fulfillment inventory policy are intentionally not implemented in this foundation.

## 11. Shipping policy

`calculateShippingFeeVnd()` is a focused server service with an input type that can later accept order value and destination data. Its V1 development implementation returns `0` VND.

The source and final report must label this as `TEMPORARY V1 DEVELOPMENT POLICY`. Checkout never accepts a shipping fee from the client. Replacing the policy must not require route, repository, or schema changes.

## 12. API errors

All API errors use:

```ts
export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Status mapping:

| Condition | Status | Code |
|---|---:|---|
| malformed JSON | 400 | `INVALID_JSON` |
| Zod/slug validation failure | 400 | `VALIDATION_ERROR` |
| inactive/missing product detail | 404 | `PRODUCT_NOT_FOUND` |
| missing/inactive variant or product at checkout | 409 | `ITEM_UNAVAILABLE` |
| insufficient available inventory | 409 | `INSUFFICIENT_INVENTORY` |
| invalid or overflowing VND arithmetic | 422 | `ORDER_VALUE_LIMIT_EXCEEDED` |
| missing server database configuration | 500 | `SERVER_CONFIGURATION_ERROR` |
| unexpected persistence/runtime failure | 500 | `INTERNAL_ERROR` |

Validation details may contain field paths and safe messages. Database messages, SQL, stack traces, connection strings, and constraint internals are never returned.

## 13. Seed safety

The development seed template contains only these confirmed identities and structures:

- `CÀ PHÊ HẠT RANG ESPRESSO`, category `espresso`, variants 250 g and 500 g;
- `CÀ PHÊ RANG XAY`, category `rang_xay`, variants 250 g and 500 g.

The executable seed requires explicit environment values for all four prices and stock quantities. It validates prices as positive integer VND and stock as non-negative integers before opening a transaction. Missing or invalid values stop the seed without writes.

The default seed is development-only and uses safe insert-if-missing behavior in one transaction:

1. insert a product only when its unique slug is absent; a newly inserted product uses `status = draft`;
2. resolve the product row by slug, whether it was just inserted or already existed;
3. insert a variant only when its unique SKU is absent; a newly inserted variant uses `active = false` and the explicitly supplied price;
4. if an existing SKU belongs to a different product or conflicts with the template's identity/weight, abort the seed transaction with a clear identity-conflict error rather than re-parenting or overwriting it;
5. insert inventory only when `variant_id` has no inventory row; a newly inserted row uses the explicitly supplied quantity and `reserved_quantity = 0`;
6. insert media only when the template provides a deterministic media UUID; conflict on that UUID performs no update, and media without deterministic identity is skipped rather than duplicated;
7. if an existing deterministic media UUID points at conflicting product/media identity, abort the seed transaction instead of overwriting it.

Conflict handling is `DO NOTHING`/insert-if-missing, followed by identity verification where relationships matter. Existing data always wins. A rerun never overwrites product status or commercial text, variant active state, price, compare-at price, inventory quantity, `reserved_quantity`, or existing media content. In particular, it never changes an active product to draft, changes an active variant to inactive, changes a real price, reduces stock, resets reservations, or replaces production content.

Existing inventory leaves both `quantity` and `reserved_quantity` unchanged. Newly inserted inventory always begins with `reserved_quantity = 0`, so rerunning the seed cannot create `quantity < reserved_quantity`.

The seed contains no invented prices, stock, bank information, shipping values, or production auto-run hook. Any future destructive/refresh mode must be a separate explicit command or flag and is outside this foundation.

## 14. Migration workflow

Drizzle schema files are the source of migration generation. Generated SQL and Drizzle migration metadata are committed artifacts in a normal Git checkout.

Scripts:

```text
npm run db:generate  # generate SQL from schema changes
npm run db:migrate   # apply checked-in migrations using DATABASE_URL
npm run db:studio    # inspect a configured database
npm run db:seed      # run the guarded development seed
```

Workflow:

1. change Drizzle schema;
2. run `npm run db:generate`;
3. inspect generated SQL for enums, sequence, composite ownership key/FK, checks, indexes, and explicit delete/update actions;
4. run unit tests, lint, and build without requiring a database;
5. after root `.env.local` privately defines `DATABASE_URL`, run `npm run db:migrate` against `delivn_dev`;
6. inspect only the created DELIVN tables and sequence;
7. execute a small rollback-safe development checkout transaction test;
8. never drop the database or unrelated schemas/tables.

Because `DATABASE_URL` is currently absent, step 5 onward is deferred and must be reported as not run rather than treated as a failure of code generation.

## 15. Focused test matrix

Vitest unit tests use real mapping, validation, normalization, calculation, and service behavior. Database access is represented at the service boundary by a transaction/repository test double that mirrors the complete repository result shape; assertions target service outcomes and committed/rolled-back state, not mock call counts.

| Area | Required behavior |
|---|---|
| Product mapper | maps snake_case repository records to one `ProductDTO` without exposing inventory |
| Stock derivation | `inStock` is true only when `quantity - reserved_quantity > 0` |
| Category contract | `rang_xay` is unchanged from database record to API DTO |
| Product visibility | mapper/service excludes inactive variants and repository only requests active products |
| Checkout validation | rejects malformed UUIDs, zero/fractional/oversized quantities, empty items, invalid customer fields, and unsupported payment methods |
| Item normalization | merges duplicate variant IDs, returns deterministic UUID order, and rejects a grouped total over 20 |
| Lock planning | deduplicates/sorts IDs and acquires `products FOR SHARE`, then `product_variants FOR SHARE`, then `inventory FOR UPDATE`, with ascending IDs inside every table |
| Locked revalidation | rejects/retries when a locked variant relationship differs from discovery and never uses discovery metadata for price or snapshots |
| Server pricing | ignores the possibility of client totals by accepting identifiers/quantities only and computes literal expected subtotal/total from repository prices |
| Money maximum accepted | accepts a line total exactly `2_147_483_647` when quantity, availability, shipping, and all other rules are valid |
| Line multiplication overflow | rejects `unitPriceVnd * quantity > 2_147_483_647` before order creation |
| Subtotal accumulation overflow | rejects individually valid line totals whose checked sum exceeds `2_147_483_647` before order creation |
| Total addition overflow | rejects a valid subtotal when checked addition of an injected shipping-policy result would exceed `2_147_483_647` |
| Normal money calculation | synthetic fixture `125_000 * 2 + 220_000 * 1` yields subtotal/zero-shipping total `470_000` |
| Snapshot creation | persists current product name, variant label, SKU, unit price, normalized quantity, and literal line total |
| Order DTO | returns the canonical public fields with ISO 8601 `createdAt` and no customer/internal inventory data |
| Availability | rejects missing inventory, inactive variant, inactive product, and insufficient available quantity |
| Reservation | increases reserved quantity exactly once per normalized variant |
| Initial order state | creates pending order status/history and payment state appropriate to COD or bank transfer |
| Rollback | simulated order-item/history/reservation failure leaves no order, items, history, or reservation changes in the transaction test store |
| Order number | formats UTC date plus a supplied global sequence without truncating values over six digits |
| Shipping | development policy contributes exactly 0 VND and is only sourced server-side |
| Seed rerun safety | existing commercial/product/variant/inventory/media fields remain byte-for-byte unchanged; missing rows insert; conflicting SKU/media identity aborts without partial writes |
| API errors | domain errors map to the documented status/code envelope without internal details |

When `DATABASE_URL` becomes available, a live smoke test additionally verifies migrations, constraints, global ordered row locking behavior, commit, rollback, and rejection of an `order_items` row whose product/variant pair violates the composite ownership FK against `delivn_dev`. It must not drop or truncate unrelated data.

## 16. Validation and completion criteria

Implementation validation runs:

```text
npm test
npm run lint
npm run build
```

Migration SQL generation and inspection are required without live credentials. Live `db:migrate`, table inspection, and development transaction verification are required only after the user privately configures root `.env.local`.

The final report distinguishes every executed check from deferred live-database checks and repeats that the shipping policy and inventory lifecycle mutations remain intentionally incomplete.

## 17. Explicitly deferred work

- `/san-pham`, product cards, cart UI, checkout UI, and success-page UI;
- real payment gateways and bank-account configuration;
- production shipping pricing;
- order-status mutation/admin APIs;
- cancellation reservation release;
- fulfillment/completion stock consumption;
- partial fulfillment, returns, refunds, and inventory adjustments;
- authentication, authorization, rate limiting, and operational admin tooling;
- production activation, confirmed retail prices, and confirmed stock values;
- live database migration/transaction validation until `DATABASE_URL` is privately configured.
