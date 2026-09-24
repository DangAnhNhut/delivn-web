# DELIVN Frontend F3 Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hydration-safe, versioned browser cart; connect it to the PDP and header; and implement the editorial `/gio-hang` page without implementing checkout.

**Architecture:** Keep the storefront layout server-rendered and place one focused `CartProvider` client boundary around existing layout content. Pure browser-safe modules own cart contracts, strict Zod validation, reducer transitions, selectors, snapshot construction, and localStorage I/O. Client components consume a small `useCart()` API. Browser snapshots remain non-authoritative, and the future checkout projection contains only `variantId` and `quantity`.

**Tech Stack:** Next.js 16.3.5 App Router, React 19.2.8, strict TypeScript, Zod 4.6.5, Vitest 3.2.4 with Node globally and file-scoped jsdom, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-09-24-delivn-cart-f3-design.md` at SHA-256 `1CEB358EC8743D19E213FE4D9F83C435620C9D63DEB899FFF1810617FD52FE9A`.

## Global Constraints

- Before implementation, recompute the spec SHA-256 and stop if it differs from the frozen hash above.
- Remain on `feature/cart`; do not commit, push, merge, or switch branches.
- Stop before editing if `git status --short` contains unrelated work.
- Follow `AGENTS.md`: read the relevant installed Next.js 16 guides under `node_modules/next/dist/docs/` before changing layout/component boundaries.
- Keep `src/app/(storefront)/layout.tsx` a Server Component.
- Keep all client imports browser-safe; no cart client module may import `server-only`, repositories, services, PostgreSQL, `pg`, Drizzle server runtime, or Node built-ins.
- Keep Vitest's global environment `node`; use `// @vitest-environment jsdom` only in DOM/localStorage test files.
- Do not add state-management or testing dependencies.
- Do not seed or mutate the database. Cart unit/component tests must not require PostgreSQL.
- Do not call `POST /api/checkout` or create checkout navigation/UI.
- Do not change ProductDTO, CheckoutInput, checkout behavior, inventory behavior, schema, or migrations.
- The only backend-adjacent refactor is moving the existing quantity constant without changing its value or validation behavior.
- Use `apply_patch` for edits. Preserve unrelated user changes.

## Review Focus

1. A valid persisted cart cannot be overwritten by the initial empty snapshot or any pre-hydration action.
2. A cross-tab state adoption does not immediately write the same payload back.
3. Strict storage validation rejects unknown versions, extra fields, duplicate variants, malformed identities/images, and invalid money/quantity.
4. Same-variant add refreshes presentation fields while incrementing and clamping quantity.
5. BigInt is used for line/subtotal arithmetic; snapshots are never treated as authoritative checkout values.
6. The PDP, header, and cart page remain accessible and hydration-stable.
7. No checkout action/button/API call slips into F3.

## Proposed Source Tree

```text
docs/superpowers/
  specs/2026-09-24-delivn-cart-f3-design.md
  plans/2026-09-24-delivn-cart-f3.md
src/
  app/(storefront)/
    layout.tsx                                      # modify
    gio-hang/page.tsx                              # create
  components/
    cart/
      CartProvider.tsx                             # create
      CartProvider.test.ts                         # create, jsdom
      CartPage.tsx                                 # create
      CartPage.test.ts                             # create, jsdom
    layout/
      CartLink.tsx                                 # modify
      CartLink.test.ts                             # create, jsdom
    products/
      ProductDetail.tsx                            # modify only prop wiring
      ProductDetail.test.ts                        # modify
      ProductPurchasePanel.tsx                     # modify
      ProductPurchasePanel.test.ts                 # modify, jsdom
  contracts/
    commerce-limits.ts                             # create
    index.ts                                       # modify
  lib/
    cart/
      cart-types.ts                                # create
      cart-schema.ts                               # create
      cart-schema.test.ts                          # create
      cart-reducer.ts                              # create
      cart-reducer.test.ts                         # create
      cart-selectors.ts                            # create
      cart-selectors.test.ts                       # create
      cart-snapshot.ts                             # create
      cart-snapshot.test.ts                        # create
      cart-storage.ts                              # create
      cart-storage.test.ts                         # create, jsdom
    storefront/
      product-presentation.ts                      # modify formatter signature only
      product-presentation.test.ts                 # modify
  server/validation/
    checkout.schema.ts                             # modify import/re-export only
    checkout.schema.test.ts                        # modify shared-limit assertion if needed
```

No `package.json`, lockfile, Vitest config, database file, API route, or homepage file should change.

---

## F3.0 — Audit and freeze the working boundary

**Files:** Read-only inspection of `AGENTS.md`, Git state, installed Next docs, current cart-adjacent components/contracts/tests.

**Dependencies:** None.

- [ ] Confirm branch and clean status:

  ```powershell
  git branch --show-current
  git status --short
  ```

  Expected: `feature/cart` and no unrelated output. If not, stop and report before editing.

- [ ] Verify the frozen spec:

  ```powershell
  (Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/specs/2026-09-24-delivn-cart-f3-design.md').Hash
  ```

  Expected: `1CEB358EC8743D19E213FE4D9F83C435620C9D63DEB899FFF1810617FD52FE9A`.

- [ ] Locate and read the installed Next.js 16 documentation relevant to Server/Client Component composition and context providers:

  ```powershell
  rg -n "Context providers|Client Components|use client|Server Component" node_modules/next/dist/docs
  ```

  Read the matching guides completely before code changes; heed deprecations.

- [ ] Reinspect exact current behavior and test style:

  ```powershell
  Get-Content -LiteralPath 'src/app/(storefront)/layout.tsx'
  Get-Content -LiteralPath 'src/components/layout/CartLink.tsx'
  Get-Content -LiteralPath 'src/components/products/ProductPurchasePanel.tsx'
  Get-Content -LiteralPath 'src/components/products/ProductPurchasePanel.test.ts'
  Get-Content -LiteralPath 'src/contracts/product.ts'
  Get-Content -LiteralPath 'src/contracts/checkout.ts'
  Get-Content -LiteralPath 'src/server/validation/checkout.schema.ts'
  Get-Content -LiteralPath 'vitest.config.ts'
  rg -n "cart|localStorage|MAX_QUANTITY_PER_VARIANT" src
  ```

- [ ] Record that no duplicate cart architecture exists and that jsdom is already a development dependency.

**Verification:** No files changed; `git status --short` remains unchanged.

---

## F3.1 — Extract the shared quantity limit without behavior change

**Files:**

- Create `src/contracts/commerce-limits.ts`
- Modify `src/contracts/index.ts`
- Modify `src/server/validation/checkout.schema.ts`
- Modify `src/server/validation/checkout.schema.test.ts` only if needed to assert the shared boundary explicitly

**Dependencies:** F3.0.

- [ ] Add a failing contract/server test proving the canonical shared value is 20 and checkout accepts 20 but rejects 21.

  ```ts
  import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";

  expect(MAX_QUANTITY_PER_VARIANT).toBe(20);
  expect(parseQuantity(20)).toBe(true);
  expect(parseQuantity(21)).toBe(false);
  ```

- [ ] Run the focused test and confirm the new contract import fails before implementation:

  ```powershell
  npm run test:run -- src/server/validation/checkout.schema.test.ts
  ```

- [ ] Create the browser-safe constant and re-export it:

  ```ts
  // src/contracts/commerce-limits.ts
  export const MAX_QUANTITY_PER_VARIANT = 20;
  ```

- [ ] Import the constant into `checkout.schema.ts`. Preserve compatibility for `checkout-normalization.ts` either by changing its import to `@/contracts` or re-exporting the imported constant from `checkout.schema.ts`. Do not leave another literal `20`.

- [ ] Prove behavior did not change:

  ```powershell
  npm run test:run -- src/server/validation/checkout.schema.test.ts src/server/validation/checkout-normalization.test.ts
  rg -n "MAX_QUANTITY_PER_VARIANT|\.max\(20\)|= 20" src
  ```

  Expected: one value definition in `commerce-limits.ts`; server validation and normalization tests pass.

---

## F3.2 — Define cart types and strict storage schema

**Files:**

- Create `src/lib/cart/cart-types.ts`
- Create `src/lib/cart/cart-schema.ts`
- Create `src/lib/cart/cart-schema.test.ts`

**Dependencies:** F3.1 shared limit.

- [ ] Define types and constants without server imports:

  ```ts
  export const CART_STORAGE_KEY = "delivn.cart.v1";
  export const CART_STORAGE_VERSION = 1 as const;
  export const MAX_SNAPSHOT_PRICE_VND = 2_147_483_647;

  export type CartImageSnapshot = { url: string; alt: string };
  export type CartItem = {
    productId: string;
    productSlug: string;
    productName: string;
    variantId: string;
    variantLabel: string;
    image: CartImageSnapshot | null;
    unitPriceVndSnapshot: number;
    quantity: number;
  };
  export type CartStorageV1 = { version: 1; items: CartItem[] };
  ```

- [ ] Write failing Node-environment schema tests for a valid payload and every invalid class: malformed identities, empty/whitespace slug/name/label, unsafe or malformed image URL, blank alt, negative/fractional/overflow price, quantity 0/21/fraction, duplicate variant IDs, wrong version, and unexpected root/item/image fields.

- [ ] Implement strict Zod schemas. Use `.strict()` at all object levels, `z.uuid()` for IDs, finite `.int()` bounded snapshot prices, the shared quantity maximum, and an array refinement rejecting duplicate `variantId` values.

  ```ts
  export const cartStorageV1Schema = z
    .object({
      version: z.literal(CART_STORAGE_VERSION),
      items: z.array(cartItemSchema).superRefine(rejectDuplicateVariantIds),
    })
    .strict();
  ```

  Match the existing product slug rule and maximum (1–200). Validate product name, variant label, image URL, and image alt as trimmed non-empty strings without cart-only length caps because their canonical ProductDTO/database fields are unconstrained text. Do not apply `z.string().url()` or a stricter scheme parser; current product data legitimately uses relative public paths. Reject non-string/empty values and malformed or extra image fields.

- [ ] Run focused tests:

  ```powershell
  npm run test:run -- src/lib/cart/cart-schema.test.ts
  ```

**Invariant:** A validated `CartStorageV1` already satisfies reducer line identity and all client money/quantity bounds.

---

## F3.3 — Implement reducer, snapshot builder, and selectors with TDD

**Files:**

- Create `src/lib/cart/cart-reducer.ts`
- Create `src/lib/cart/cart-reducer.test.ts`
- Create `src/lib/cart/cart-selectors.ts`
- Create `src/lib/cart/cart-selectors.test.ts`
- Create `src/lib/cart/cart-snapshot.ts`
- Create `src/lib/cart/cart-snapshot.test.ts`
- Modify `src/lib/storefront/product-presentation.ts`
- Modify `src/lib/storefront/product-presentation.test.ts`

**Dependencies:** F3.1–F3.2.

- [ ] Write reducer tests first for add-new, add-same merge, full snapshot refresh, max clamp, different variants, increment, decrement/minimum, remove, clear, and unknown-ID no-ops.

  ```ts
  expect(cartReducer(existing, { type: "add", item: refreshed })).toEqual([
    { ...refreshed, quantity: existing[0].quantity + 1 },
  ]);
  ```

- [ ] Implement an exhaustive discriminated-union reducer:

  ```ts
  export type CartAction =
    | { type: "replace"; items: CartItem[] }
    | { type: "add"; item: Omit<CartItem, "quantity"> }
    | { type: "increment"; variantId: string }
    | { type: "decrement"; variantId: string }
    | { type: "remove"; variantId: string }
    | { type: "clear" };
  ```

  Reducer input is assumed validated/constructed by trusted local modules; it still clamps all quantity transitions to the shared maximum.

- [ ] Write selector tests first, including quantities `2 + 4 = 6`, a line multiplication requiring BigInt output, subtotal accumulation, and checkout projection deep equality with no extra keys.

- [ ] Implement selectors returning `bigint` for line/subtotal money:

  ```ts
  export function selectCartLineTotalVnd(item: CartItem): bigint {
    return BigInt(item.unitPriceVndSnapshot) * BigInt(item.quantity);
  }

  export function selectCheckoutItems(items: readonly CartItem[]) {
    return items.map(({ variantId, quantity }) => ({ variantId, quantity }));
  }
  ```

- [ ] Write snapshot tests first using synthetic ProductDTO fixtures: primary media maps to `{url, alt}`, no media maps to `null`, selected variant data maps correctly, and output has no SKU, compare-at price, stock quantity, or reserved quantity.

- [ ] Implement `createCartItemSnapshot(product, variant)` as a pure browser-safe function returning `Omit<CartItem, "quantity">`. Use the primary media alt when non-blank and fall back to `product.name` for accessibility; do not fabricate an image URL.

- [ ] Extend the existing formatter signature from `number` to `number | bigint`; add a BigInt formatting test and do not duplicate `Intl.NumberFormat` setup.

- [ ] Run focused tests:

  ```powershell
  npm run test:run -- src/lib/cart/cart-reducer.test.ts src/lib/cart/cart-selectors.test.ts src/lib/cart/cart-snapshot.test.ts src/lib/storefront/product-presentation.test.ts
  ```

**Invariant:** Cart aggregation is exact presentation arithmetic only; no selector becomes an authoritative checkout total.

---

## F3.4 — Implement validated localStorage I/O

**Files:**

- Create `src/lib/cart/cart-storage.ts`
- Create `src/lib/cart/cart-storage.test.ts` with `// @vitest-environment jsdom`

**Dependencies:** F3.2 schema.

- [ ] Write failing tests for missing storage, valid v1 parsing, malformed JSON, unknown version, each representative schema failure, invalid-entry removal, serialization round trip, and throwing `getItem`/`setItem`/`removeItem` implementations.

- [ ] Implement pure/string parsing separately from browser I/O so external events can validate without mutating storage:

  ```ts
  export type ParsedCart =
    | { ok: true; payload: CartStorageV1; serialized: string }
    | { ok: false };

  export function parseCartStorage(raw: string): ParsedCart;
  export function serializeCart(items: readonly CartItem[]): string;
  export function readCartStorage(storage: Storage): CartStorageV1;
  export function writeCartStorage(storage: Storage, serialized: string): boolean;
  ```

  `serialized` is canonical JSON created from the validated payload, not necessarily the incoming whitespace/key-order representation.

- [ ] Initial `readCartStorage` behavior:

  - missing key → empty payload;
  - valid → normalized payload;
  - invalid → attempt exact-key removal, then empty payload;
  - access exception → empty payload without throwing.

- [ ] Run focused tests:

  ```powershell
  npm run test:run -- src/lib/cart/cart-storage.test.ts
  ```

**Invariant:** Only initial hydration may remove a corrupt key. Cross-tab event parsing itself has no removal side effect.

---

## F3.5 — Build CartProvider hydration, persistence, and cross-tab protocol

**Files:**

- Create `src/components/cart/CartProvider.tsx`
- Create `src/components/cart/CartProvider.test.ts` with `// @vitest-environment jsdom`
- Modify `src/app/(storefront)/layout.tsx`

**Dependencies:** F3.2–F3.4.

- [ ] Write provider tests with React DOM primitives (`createRoot`, `act`) and no new testing library. Cover initial `items=[]/isHydrated=false`, valid hydration, actions after hydration, write-after-change, and cleanup.

- [ ] Add the critical race test:

  1. preload `localStorage` with a valid non-empty payload;
  2. mount a harness that attempts `addItem` before `isHydrated` becomes true;
  3. spy on `Storage.prototype.setItem`;
  4. assert no initial empty or early-mutated payload was written;
  5. assert the saved payload is adopted;
  6. assert a post-hydration action works and persists.

- [ ] Implement a small context API:

  ```ts
  type CartContextValue = {
    items: readonly CartItem[];
    itemCount: number;
    isHydrated: boolean;
    addItem(item: Omit<CartItem, "quantity">): boolean;
    increment(variantId: string): void;
    decrement(variantId: string): void;
    removeItem(variantId: string): void;
    clearCart(): void;
  };
  ```

  `addItem` returns `false` before hydration and `true` after dispatch, enabling truthful PDP feedback. Every mutation method no-ops before hydration.

- [ ] Use SSR-safe initialization (`items=[]`, `isHydrated=false`), mount-only storage reading, and a persistence effect gated by `isHydrated`.

- [ ] Manage `lastSerializedRef` exactly:

  ```ts
  if (!isHydrated) return;
  const serialized = serializeCart(items);
  if (serialized === lastSerializedRef.current) return;
  if (writeCartStorage(window.localStorage, serialized)) {
    lastSerializedRef.current = serialized;
  }
  ```

- [ ] Add cross-tab tests:

  - exact-key valid event adopts state;
  - adopted serialization updates the ref and causes zero write-back calls;
  - `newValue === null` adopts empty and does not ping-pong;
  - unrelated keys, malformed JSON, wrong version, and invalid payload are ignored;
  - mismatched non-null `storageArea` is ignored.

- [ ] In the event handler, canonicalize valid input, assign `lastSerializedRef.current`, then dispatch `replace`. For null, assign canonical empty serialization before dispatching clear/replace.

- [ ] Wrap existing `<Header />`, `<main>`, and `<Footer />` inside `<CartProvider>` in the Server Component layout. Do not alter their visual composition.

- [ ] Verify focused tests and boundary imports:

  ```powershell
  npm run test:run -- src/components/cart/CartProvider.test.ts
  rg -n "server-only|server/|drizzle|from ['\"]pg['\"]" src/components/cart src/lib/cart
  ```

  Expected import scan: no client/server boundary violation.

---

## F3.6 — Connect the live header quantity count

**Files:**

- Modify `src/components/layout/CartLink.tsx`
- Create `src/components/layout/CartLink.test.ts` with `// @vitest-environment jsdom`

**Dependencies:** F3.5 provider.

- [ ] Write component tests using a provider or controlled context harness for count `1`, same-line quantity `3`, and two-line quantities `2 + 4 = 6`. Include the initial unhydrated `GIỎ HÀNG (0)` assertion.

- [ ] Convert only `CartLink` to a Client Component, consume `itemCount`, and render zero until hydration to match SSR:

  ```tsx
  const { itemCount, isHydrated } = useCart();
  const count = isHydrated ? itemCount : 0;
  ```

- [ ] Preserve the existing route and visual classes; keep the count text footprint stable where practical.

- [ ] Run:

  ```powershell
  npm run test:run -- src/components/layout/CartLink.test.ts
  ```

---

## F3.7 — Add PDP cart action from the selected ProductDTO variant

**Files:**

- Modify `src/components/products/ProductPurchasePanel.tsx`
- Modify `src/components/products/ProductPurchasePanel.test.ts`
- Modify `src/components/products/ProductDetail.tsx`
- Modify `src/components/products/ProductDetail.test.ts`

**Dependencies:** F3.3 snapshot builder; F3.5 provider.

- [ ] Update tests first so `ProductPurchasePanel` receives a canonical synthetic `ProductDTO`. Add assertions for:

  - first in-stock variant selected even when it is not first;
  - in-stock add disabled before hydration and enabled afterward;
  - clicking adds exactly the selected snapshot and announces `ĐÃ THÊM VÀO GIỎ`;
  - repeated click merges via provider quantity;
  - switching to an out-of-stock radio changes price/state and disables `TẠM HẾT HÀNG` action;
  - zero variants render no purchase action;
  - no quantity, reserved quantity, alert, navigation, modal, or drawer behavior appears.

- [ ] Change the prop to:

  ```ts
  interface ProductPurchasePanelProps {
    product: ProductDTO;
  }
  ```

- [ ] Reuse current default-selection and VND helpers. On successful click, call `addItem(createCartItemSnapshot(product, selectedVariant))`; set feedback only when `addItem` returns true.

- [ ] Render one native button for the selected in-stock/unavailable state. Use semantic `disabled` before hydration or when unavailable. With no variants, preserve `ĐANG CẬP NHẬT` and omit the button entirely.

- [ ] Add a dedicated `aria-live="polite"`/`aria-atomic="true"` feedback region. Do not use `alert()` or navigation.

- [ ] In `ProductDetail`, replace the two primitive props with `<ProductPurchasePanel product={product} />`; make no other layout/design change.

- [ ] Run focused regressions:

  ```powershell
  npm run test:run -- src/components/products/ProductPurchasePanel.test.ts src/components/products/ProductDetail.test.ts
  ```

---

## F3.8 — Implement the editorial `/gio-hang` page

**Files:**

- Create `src/components/cart/CartPage.tsx`
- Create `src/components/cart/CartPage.test.ts` with `// @vitest-environment jsdom`
- Create `src/app/(storefront)/gio-hang/page.tsx`

**Dependencies:** F3.3 selectors/formatter; F3.5 provider.

- [ ] Write page-component tests first for:

  - neutral hydration-safe state without the empty-cart headline;
  - branded empty state only after hydration and link to `/san-pham`;
  - persisted snapshot image/no-image, product name, variant label, unit price, line total, and `/san-pham/{productSlug}` links;
  - decrement at one remains one; increment; max-disabled increment; explicit remove; clear-all;
  - correct BigInt subtotal formatting;
  - disclaimer that price/availability are reconfirmed;
  - absence of shipping, authoritative final total, checkout button/link, and any checkout API invocation;
  - continue-shopping CTA to `/san-pham`.

- [ ] Implement `CartPage` as a focused Client Component consuming `useCart()`. Disable mutation controls when not hydrated even though the provider also guards actions.

- [ ] Use a responsive list, not a table. Desktop may use list-plus-summary columns; switch to a stack before tablet/mobile content becomes cramped. Ensure long names and prices wrap and all controls have large tap targets.

- [ ] Use descriptive labels, for example `Tăng số lượng {productName} – {variantLabel}`, and semantic button disabled states at minimum/maximum.

- [ ] For a missing image, render an intentional DELIVN no-image block without fabricating media. For an image, use the stored alt. Keep ProductDTO/runtime URL handling consistent with existing product imagery policy.

- [ ] Keep `page.tsx` a small Server Component:

  ```tsx
  import { CartPage } from "@/components/cart/CartPage";

  export default function GioHangPage() {
    return <CartPage />;
  }
  ```

- [ ] Run focused tests:

  ```powershell
  npm run test:run -- src/components/cart/CartPage.test.ts
  ```

---

## F3.9 — Close focused test-matrix gaps

**Files:** All tests listed in the proposed tree; implementation files only when a failing test identifies a requirement gap.

**Dependencies:** F3.1–F3.8.

- [ ] Run the F3-only suite and map every spec test item to a named test:

  ```powershell
  npm run test:run -- src/lib/cart src/components/cart src/components/layout/CartLink.test.ts src/components/products/ProductPurchasePanel.test.ts src/components/products/ProductDetail.test.ts src/lib/storefront/product-presentation.test.ts src/server/validation/checkout.schema.test.ts src/server/validation/checkout-normalization.test.ts
  ```

- [ ] Add only missing behavioral tests; avoid snapshots and implementation-detail assertions.

- [ ] Explicitly inspect test headers:

  ```powershell
  rg -n "@vitest-environment" src/lib/cart src/components/cart src/components/layout src/components/products
  ```

  Expected: jsdom only in storage/provider/component tests. Reducer/schema/selectors/snapshot and backend tests remain Node.

- [ ] Inspect for forbidden checkout and server imports:

  ```powershell
  rg -n "api/checkout|fetch\(|server-only|server/|drizzle|from ['\"]pg['\"]" src/components/cart src/components/layout/CartLink.tsx src/components/products/ProductPurchasePanel.tsx src/lib/cart
  ```

  Expected: no checkout call and no server-only dependency.

---

## F3.10 — Full regression and production-build validation

**Files:** No planned new edits; fix only demonstrated F3 regressions within approved scope.

**Dependencies:** All implementation phases.

- [ ] Run the complete non-watch suite:

  ```powershell
  npm run test:run
  ```

  Confirm F3, F2, F1, and backend tests pass. Report guarded PostgreSQL integration separately if the database is offline; do not alter DB configuration.

- [ ] Run lint:

  ```powershell
  npm run lint
  ```

- [ ] Run the production build:

  ```powershell
  npm run build
  ```

  Confirm build does not require PostgreSQL for cart routes and preserves request-time behavior of product routes.

- [ ] Check whitespace and diff scope:

  ```powershell
  git diff --check
  git status --short
  git diff --stat
  git diff -- 'src/app/(storefront)/layout.tsx' 'src/app/(storefront)/gio-hang/page.tsx' 'src/components/cart' 'src/components/layout/CartLink.tsx' 'src/components/products/ProductPurchasePanel.tsx' 'src/components/products/ProductDetail.tsx' 'src/contracts' 'src/lib/cart' 'src/lib/storefront/product-presentation.ts' 'src/server/validation/checkout.schema.ts'
  ```

- [ ] Confirm protected files are absent from the diff:

  ```powershell
  git diff --name-only | rg "src/data/products|Three|three|\.glb$|Screen0[1-5]|Footer|migrations|drizzle/|checkout\.service|inventory"
  ```

  Expected: no output except an explicitly reviewed false-positive path.

---

## F3.11 — Static and manual browser QA

**Files:** No planned edits; adjust only verified F3 layout/accessibility defects.

**Dependencies:** Passing F3.10 validation.

- [ ] Start the application only if browser QA is available:

  ```powershell
  npm run dev
  ```

- [ ] At 1440, 1280, 1024, 768, and 390px, check `/gio-hang` for loading-to-empty/persisted transition, item/summary layout, no horizontal overflow, long text wrapping, focus visibility, and tap targets.

- [ ] With a valid active product when available, check PDP variant selection, enabled/disabled add state, `ĐÃ THÊM VÀO GIỎ`, header sum, repeated-add merge, reload persistence, quantity controls, removal, clear, and empty state.

- [ ] If no active database product exists, record PDP interaction QA as `VALID_PDP_BROWSER_QA_DEFERRED_NO_ACTIVE_PRODUCT`; do not add fixtures or seed.

- [ ] If cross-tab sync is implemented as specified, open two tabs and verify add/quantity/clear propagation without repeated writes or oscillation.

- [ ] If browser tooling is unavailable, stop after one availability check and report `MANUAL_BROWSER_VISUAL_CHECK_REQUIRED`.

- [ ] Capture final review state without committing:

  ```powershell
  git branch --show-current
  git status --short
  ```

  Expected branch: `feature/cart`. Do not commit, push, merge, or switch branches.

## Completion criteria

F3 may be reported complete only when the complete test suite, lint, build, and `git diff --check` pass; protected scope is clean; hydration race and cross-tab no-write-back tests pass; and browser QA is completed or accurately deferred for the allowed environmental reason.

The final implementation report must explicitly confirm:

- client cart values are non-authoritative;
- future CheckoutInput projection contains only `variantId` and `quantity`;
- no fake checkout flow or checkout API call exists;
- no pre-hydration mutation/persistence path can overwrite a saved cart;
- global Vitest remains Node and jsdom is test-file scoped;
- Git remains uncommitted on `feature/cart`.
