# DELIVN Frontend F3 Cart Design

**Date:** 2026-09-24  
**Status:** Proposed specification for approval  
**Scope:** Versioned browser cart state, PDP add-to-cart, live header count, and `/gio-hang`. Checkout UI and checkout API usage are excluded.

## 1. Purpose and success criteria

F3 adds a resilient client-side cart without making the browser a commercial source of truth. The cart preserves enough ProductDTO-derived presentation data to provide a useful storefront experience, while future checkout submits only variant identity and quantity for authoritative server validation.

F3 succeeds when:

- React Context plus pure cart modules provide one cart state to the storefront header, PDP, and cart page;
- a strict versioned payload persists under `delivn.cart.v1` without overwriting saved data during hydration;
- corrupted, incompatible, or hostile storage cannot crash the storefront or inject invalid cart state;
- the PDP adds one in-stock selected variant, merges duplicate variant lines, and provides accessible confirmation;
- the header count is the sum of quantities;
- `/gio-hang` supports quantity changes, explicit removal, clearing, snapshot totals, and intentional loading/empty states;
- no F3 code calls checkout, claims browser prices are authoritative, or changes protected backend/product behavior.

## 2. Architecture and module boundaries

The dependency direction is:

```text
Server storefront layout
  -> CartProvider (client boundary)
       -> pure reducer + selectors + validated storage
       -> useCart()
            -> CartLink
            -> ProductPurchasePanel
            -> CartPage
```

`src/app/(storefront)/layout.tsx` remains a Server Component. It may render `<CartProvider>` around `<Header>`, the route content, and `<Footer>`, but it must not gain `"use client"`.

All modules imported by `CartProvider`, `CartLink`, `ProductPurchasePanel`, or `CartPage` are browser-safe. They may import shared contracts and pure helpers, but never `server-only`, repositories, product services, PostgreSQL, `pg`, Drizzle server runtime, or Node-only modules.

Pure cart concerns live under `src/lib/cart/`:

- `cart-types.ts`: storage and action-facing types;
- `cart-schema.ts`: strict Zod payload validation;
- `cart-reducer.ts`: deterministic state transitions;
- `cart-selectors.ts`: derived counts and exact snapshot-money totals;
- `cart-storage.ts`: parse/read/write/remove helpers for the exact key;
- `cart-snapshot.ts`: ProductDTO-to-CartItem presentation snapshot construction.

React lifecycle and browser event orchestration live in `CartProvider.tsx`; presentation lives in product, layout, and cart components. No data fetching is added to cart components.

## 3. Cart contract

```ts
type CartImageSnapshot = {
  url: string;
  alt: string;
};

type CartItem = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  image: CartImageSnapshot | null;
  unitPriceVndSnapshot: number;
  quantity: number;
};

type CartStorageV1 = {
  version: 1;
  items: CartItem[];
};
```

Line identity is `variantId`. Product IDs and variant IDs are UUIDs. Product/variant names and labels are trimmed non-empty presentation strings. `productSlug` is a trimmed non-empty storefront slug. A stored image contains only `url` and `alt`; no ProductMediaDTO IDs, sort data, or unrelated metadata are persisted.

Snapshots deliberately exclude inventory quantities, reserved quantities, SKU, compare-at price, customer/payment data, shipping, discounts, and order totals. `unitPriceVndSnapshot` is display-only despite being validated precisely.

## 4. Storage payload and strict Zod validation

The only F3 key is:

```text
delivn.cart.v1
```

The key and payload version are independently explicit: the JSON root must be a strict object with exactly `version: 1` and `items`. Nested item and image objects are also strict, so unexpected fields invalidate the payload rather than being silently retained.

Validation rules:

- `productId` and `variantId`: UUID strings;
- `productSlug`: trimmed, 1–200 characters, matching the existing storefront slug rule `^[a-z0-9]+(?:-[a-z0-9]+)*$`;
- `productName`: trimmed and non-empty; the canonical ProductDTO/database field has no length cap, so cart validation adds none;
- `variantLabel`: trimmed and non-empty; the canonical ProductDTO/database field has no length cap, so cart validation adds none;
- `image`: exactly `null` or a strict `{ url, alt }` object;
- image URL: trimmed and non-empty. The canonical ProductMediaDTO/database field accepts arbitrary string URLs without a length cap and existing product fixtures use root-relative public paths, so cart validation deliberately adds neither absolute-URL parsing, a scheme whitelist, nor a shorter length cap. Non-string values, malformed image objects, and unexpected image fields are rejected;
- image alt: trimmed and non-empty with no cart-only length cap; the snapshot builder falls back to the product name if a real primary media record has blank alt text;
- `unitPriceVndSnapshot`: finite integer in `0..2_147_483_647`;
- `quantity`: integer in `1..MAX_QUANTITY_PER_VARIANT`;
- root version: literal `1` only;
- duplicate `variantId` lines: invalid, because persisted state must already obey line identity.

Malformed JSON, the wrong/unknown version, invalid UUIDs, blank or invalid labels, invalid image shape, invalid price, invalid quantity, duplicate variant lines, and unexpected fields all invalidate the entire persisted payload. Initial hydration then adopts an empty cart and removes the invalid key when storage access permits. It never partially salvages or reinterprets malformed data.

Browser storage access and writes are guarded because privacy/security settings can throw. Such failures do not crash rendering; the in-memory cart continues for the session.

## 5. Shared quantity limit

The existing value `MAX_QUANTITY_PER_VARIANT = 20` moves, with no behavioral change, to browser-safe `src/contracts/commerce-limits.ts` and is re-exported by `src/contracts/index.ts`.

The checkout Zod schema imports the shared constant and continues to export it if current server imports require compatibility. Checkout normalization, cart schema, reducer, and disabled UI states all consume the one canonical value. No second literal `20` is introduced.

Minimum cart quantity is `1`.

## 6. Reducer actions and exact semantics

The reducer is pure and independent of React and localStorage.

| Action | Semantics |
|---|---|
| `replace` | Replace all lines with an already validated item array. Used for hydration and accepted external storage state. |
| `add` | If `variantId` is new, append the supplied snapshot with quantity `1`. If it exists, replace every presentation snapshot field with the newly supplied values and increase the existing quantity by one, clamped to the canonical maximum. |
| `increment` | Increase the matching line by one, clamped at the canonical maximum. Unknown IDs are a no-op. |
| `decrement` | Decrease the matching line by one, but never below `1`. Quantity `1` stays `1`; removal is never implicit. Unknown IDs are a no-op. |
| `remove` | Remove the matching `variantId`. Unknown IDs are a no-op. |
| `clear` | Return an empty item array. |

The public F3 API does not expose arbitrary direct quantity entry, so no `setQuantity` action is required. All user mutations are blocked until hydration, as defined below.

## 7. Derived selectors

Selectors derive values rather than duplicating them in React state:

- `selectCartItemCount(items)`: sum of all quantities, used by `CartLink`;
- `selectCartLineTotalVnd(item)`: `BigInt(unitPriceVndSnapshot) * BigInt(quantity)`;
- `selectCartSubtotalVnd(items)`: BigInt sum of line totals;
- `selectCheckoutItems(items)`: `{ variantId, quantity }[]`, defining the future F4 trust-boundary projection without invoking checkout.

Line totals and subtotal use `bigint` internally even though each unit snapshot is bounded to a PostgreSQL integer. The browser-safe VND formatter is extended to accept `number | bigint`; it performs formatting only and does not turn snapshots into authoritative money.

## 8. Hydration state machine and early-action guard

The provider state has two externally meaningful phases:

```text
UNHYDRATED
  SSR and first client render: items=[], isHydrated=false
  cart controls disabled; provider mutation methods no-op
       |
       | mount: read + parse + validate exact storage key
       v
HYDRATED
  valid v1 payload -> adopt its items
  absent/invalid/unreadable payload -> adopt []
  isHydrated=true
  controls and persistence enabled
```

F3 uses both layers of protection: interactive cart controls are disabled while `isHydrated` is false, and provider mutation methods independently no-op before hydration. This makes a programmatic or unusually early event harmless.

Hydration performs the state replacement and readiness transition before persistence is allowed. A regression test preloads a valid cart, triggers an attempted add before hydration completes, and proves that neither the in-memory early mutation nor an empty storage write occurs; after hydration, the saved cart is present and actions work.

The cart page renders a neutral, layout-stable loading treatment before hydration. It does not flash the hydrated empty-cart state.

## 9. Persistence timing and write suppression

`lastSerializedRef` tracks the storage representation already known to be current.

On mount:

1. read `delivn.cart.v1`;
2. if absent, record the canonical serialized empty v1 payload;
3. if valid, normalize to the canonical serialization and adopt it;
4. if invalid, remove it when possible and record canonical empty serialization;
5. set provider state from the result, then mark hydration complete.

The persistence effect is inert before hydration. After hydration, it serializes current items into canonical v1 JSON and writes only when that string differs from `lastSerializedRef`. It updates the ref alongside a successful write. Storage exceptions are swallowed at this infrastructure edge without discarding the in-memory cart.

This ordering guarantees that the initial empty SSR/client snapshot cannot overwrite an existing saved cart.

## 10. Cross-tab storage-event protocol

The provider listens for `storage` events only after mounting and acts only when `event.storageArea === window.localStorage` (when supplied) and `event.key === "delivn.cart.v1"`.

- `newValue === null`: adopt an empty cart as an external clear and set `lastSerializedRef` to the canonical empty payload before/adjoining the state replacement.
- Valid v1 `newValue`: validate it, canonicalize it, update `lastSerializedRef` to that canonical serialized value, then/adjoining replace state.
- Unrelated key, malformed JSON, invalid payload, or unknown version: ignore it and keep current state.

Because the ref is updated before the replacement causes the persistence effect to run, the receiving tab recognizes the adopted value as current and does not write it back. This prevents storage-event ping-pong. Browser `storage` events do not fire in the tab that performed the write, so local state already remains authoritative for that tab.

## 11. PDP integration

`ProductPurchasePanel` becomes a focused Client Component that receives the canonical `ProductDTO`. Its existing variant selection remains unchanged in meaning: first in-stock variant by default, otherwise the first variant.

The pure snapshot builder uses only:

- `product.id`, `slug`, and `name`;
- `product.media[0]` as `{ url, alt }`, or `null` when media is absent;
- selected variant `id`, `label`, and `priceVnd`.

It never copies SKU, compare-at price, inventory quantity, or reserved quantity.

For an in-stock selected variant, `THÊM VÀO GIỎ` is enabled only after hydration and adds exactly one unit. Repeated clicks merge through reducer identity rules. For an unavailable selected variant, the button is disabled and clearly reads `TẠM HẾT HÀNG`. With zero variants, no purchase action renders.

After a successful add, an `aria-live="polite"` region announces `ĐÃ THÊM VÀO GIỎ`. F3 uses no `alert()`, automatic navigation, drawer, modal, PDP quantity control, or fake checkout behavior.

## 12. Header cart count

`CartLink` becomes a small Client Component that consumes `useCart()`. It displays `GIỎ HÀNG (0)` for SSR and the first client render, then displays the sum of quantities after hydration. The text footprint remains stable where practical.

The count is quantity-based, not line-based: quantities `2` and `4` render `GIỎ HÀNG (6)`. The header does not know about localStorage or reducer implementation details.

## 13. `/gio-hang` behavior

The Server Component route renders a focused Client `CartPage` under the shared provider.

- Before hydration: neutral, non-empty-state loading treatment.
- Hydrated empty: branded `GIỎ HÀNG CỦA BẠN ĐANG TRỐNG` state and `KHÁM PHÁ SẢN PHẨM` link to `/san-pham`.
- Hydrated with lines: editorial intro (`GIỎ HÀNG`, `LỰA CHỌN CỦA BẠN.`), responsive item list, and restrained summary.

Each line shows its optional snapshot image (or intentional no-image treatment), product name, variant label, snapshot unit price, decrement/increment controls, BigInt-derived snapshot line total, and descriptive `XÓA` action. Product image/name may link to `/san-pham/{productSlug}` without refreshing data from the database.

Decrement at `1` remains at `1`. Increment at the canonical maximum is disabled. Removal is explicit. `XÓA GIỎ HÀNG` is a secondary clear-all control.

The summary shows only `TẠM TÍNH` from snapshot arithmetic and the message that price and availability will be reconfirmed at checkout. It does not show shipping, final total, discounts, taxes, promotion codes, or an unfinished checkout button. The only primary onward CTA is `TIẾP TỤC CHỌN CÀ PHÊ` to `/san-pham`.

F3 never calls `POST /api/checkout`.

## 14. Accessibility

- Quantity changes and removal use native buttons with line-specific accessible labels.
- Disabled pre-hydration, unavailable, minimum, and maximum states use semantic `disabled` where applicable.
- PDP confirmation uses `aria-live="polite"`; price/availability updates remain understandable without color alone.
- Product images use snapshot alt text; intentional no-image treatments are non-misleading.
- All links and buttons retain visible `focus-visible` styles and comfortable tap targets.
- Heading hierarchy is semantic; the cart page has one `h1`.
- Motion is limited to existing CSS transitions and respects `prefers-reduced-motion` through `motion-reduce` utilities.

## 15. Responsive behavior

- At 1440/1280px, the cart uses a spacious editorial item list with a clearly separated summary column.
- At 1024/768px, columns rebalance or stack before content becomes cramped.
- At 390px, image/content and summary stack; quantity controls remain easy to tap; labels and totals wrap without horizontal overflow.
- No desktop HTML table is used, avoiding an unusable mobile table layout.

## 16. Test matrix

Global Vitest remains Node. Only DOM/localStorage component/provider tests declare `// @vitest-environment jsdom`.

### Pure cart domain

- add first line;
- same variant merges, increments, clamps, and refreshes all presentation snapshot fields;
- different variants remain separate;
- increment/decrement, lower bound `1`, upper bound canonical `20`;
- remove, clear, unknown-ID no-ops;
- item count sums quantities;
- BigInt line total and subtotal;
- future checkout projection contains only `variantId` and `quantity`;
- snapshot builder uses primary media or `null` and omits forbidden fields.

### Storage

- missing key;
- valid strict v1 payload;
- malformed JSON;
- wrong/unknown version;
- invalid/duplicate UUIDs, blank labels, invalid image, NaN-like/non-finite encodings where applicable, negative/fractional/overflow price, invalid quantity, unexpected fields;
- invalid initial storage becomes empty and is removed;
- storage exceptions do not crash;
- serialization round trip.

### Provider and cross-tab

- SSR/client initial snapshot is empty and unhydrated;
- valid persisted cart hydrates;
- persistence starts only after hydration;
- explicit early-action race cannot overwrite or replace valid persisted data;
- subsequent actions persist;
- exact-key valid storage event adopts without write-back;
- external key removal clears;
- unrelated/malformed/unknown-version events are ignored.

### PDP, header, and cart page

- in-stock selection enables add after hydration;
- unavailable selection disables add;
- zero variants render no action;
- add emits correct ProductDTO snapshot and accessible confirmation;
- repeated add merges through provider state;
- no inventory quantity is rendered;
- header counts `1`, `3`, and `2 + 4 = 6`;
- cart page avoids empty flash before hydration, renders hydrated empty and persisted-item states, and supports increment/decrement/remove/clear;
- subtotal is correct, product navigation targets the stored slug, and no shipping/final-authoritative total, checkout API call, or checkout button exists.

Existing backend, F1, and F2 suites remain green.

## 17. Backend/client trust boundary

The browser cart is a UX cache, not a ledger. Product names, labels, images, and unit prices are untrusted presentation snapshots. BigInt arithmetic improves deterministic display but does not make client totals authoritative.

F4 may derive only:

```ts
cart.items.map(({ variantId, quantity }) => ({ variantId, quantity }))
```

The server remains authoritative for current price, product/variant active status, stock, subtotal, shipping fee, and total. CheckoutInput is not expanded with client names, prices, or totals.

## 18. Protected scope

F3 does not modify homepage Screens 01–05, Three.js/R3F/Drei, GLBs, homepage motion, footer visual design, brand assets, F1 catalog design, ProductDTO, CheckoutInput shape, checkout route/service, inventory behavior, database schema/migrations, or `src/data/products.ts`.

The only backend-adjacent edit is the approved zero-behavior-change move of the existing quantity constant into a browser-safe contract module, followed by imports from the existing server validation path.

## 19. Deferred to F4 or later

- `/thanh-toan` and checkout navigation;
- customer form and COD/bank-transfer UI;
- any call to `POST /api/checkout`;
- server repricing, stock confirmation, shipping, and final totals in UI;
- order-success page;
- reconciliation of stale presentation snapshots before checkout;
- admin, authentication, accounts, and server-side saved carts.

## 20. Self-review record

The specification was checked against the approved clarifications with these results:

- early mutation is blocked twice (disabled controls plus provider no-op), and persistence is explicitly gated by hydration;
- external storage adoption updates `lastSerializedRef` before the state-driven persistence effect, preventing ping-pong;
- initial invalid storage becomes empty, while malformed external events are ignored as required;
- snapshot prices are strictly bounded integers and all aggregate arithmetic is BigInt;
- media URL validation matches the canonical ProductMediaDTO string contract, including relative public paths, while rejecting empty values and malformed snapshot shapes;
- one shared quantity constant preserves the server's existing limit;
- server/client import direction remains one-way and browser-safe;
- no runtime fixture, database seed, checkout UI/API usage, or protected-scope redesign is included.
