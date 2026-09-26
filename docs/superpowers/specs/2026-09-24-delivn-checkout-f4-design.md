# DELIVN Frontend F4 Checkout Design

**Date:** 2026-09-24
**Status:** Proposed for approval
**Scope:** `/thanh-toan`, canonical checkout form validation, real browser `POST /api/checkout`, confirmed-success UX, and post-success cart reconciliation. No payment gateway, order lookup, admin, authentication, or shipping-provider integration.

## 1. Intent and success criteria

F4 is the first storefront phase that creates an order. It must let a customer submit the existing local cart through the existing transactional checkout backend without treating browser snapshots as commercial truth.

The phase succeeds when:

- `/thanh-toan` renders a hydration-safe, accessible checkout experience in the existing DELIVN visual language;
- the form contains only fields supported by the canonical `CheckoutInput`;
- the request sends customer data, a supported payment method, and only `variantId` plus `quantity` for cart lines;
- `POST /api/checkout` is called once per submission and is never automatically retried;
- the UI treats only HTTP `201` plus a runtime-valid `OrderDTO` as success;
- validation, inventory, infrastructure, network, and malformed-response failures keep the cart intact;
- confirmed success reconciles submitted quantities while preserving concurrent cart additions;
- no customer PII is stored in localStorage or logged; and
- backend checkout, inventory, database, shipping, and error-envelope behavior remain unchanged.

## 2. Audited current state

### 2.1 Storefront and cart

The storefront layout is a Server Component. It wraps the existing `Header`, route content, and `Footer` in the focused client-side `CartProvider`. The provider exposes hydrated cart items, a quantity-sum count, and add/increment/decrement/remove/clear operations. It validates and persists the versioned `delivn.cart.v1` payload after hydration and handles exact-key storage events without ping-pong.

Cart lines contain presentation snapshots (`productName`, `variantLabel`, image, and `unitPriceVndSnapshot`) plus the authoritative request identifiers `variantId` and `quantity`. `selectCheckoutItems()` already projects a cart to `{ variantId, quantity }[]`. Snapshot line totals and subtotal use `BigInt`.

`/gio-hang` is a client-backed editorial cart page. It currently has no checkout navigation and explicitly labels its subtotal as provisional.

### 2.2 Canonical CheckoutInput

The canonical contract is:

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

The actual server schema and proposed form controls are:

| API field | Required | Server rules and normalization | Proposed visible control |
| --- | --- | --- | --- |
| `customer.name` | Yes | String; trim; 2–100 characters | Text input, `Họ và tên`, `autoComplete="name"`, required |
| `customer.phone` | Yes | String; trim; initial characters limited to digits, spaces, `+`, parentheses, period, and hyphen; remove spaces/parentheses/period/hyphen; final value is optional leading `+` plus 8–16 digits | Telephone input, `Số điện thoại`, `type="tel"`, `inputMode="tel"`, `autoComplete="tel"`, required |
| `customer.email` | No | Blank/whitespace becomes `undefined`; otherwise trim, maximum 254, valid email, lowercase | Email input, `Email (không bắt buộc)`, `type="email"`, `autoComplete="email"` |
| `customer.address` | Yes | String; trim; 5–500 characters | Textarea, `Địa chỉ nhận hàng`, `autoComplete="street-address"`, required |
| `customer.note` | No | Blank/whitespace becomes `undefined`; otherwise trim, maximum 1,000 | Textarea, `Ghi chú (không bắt buộc)` |
| `paymentMethod` | Yes | Exactly `cod` or `bank_transfer` | Required radio group with localized labels |
| `items` | Yes | Array of 1–50 entries | Derived from hydrated cart; no customer-editable field |
| `items[].variantId` | Yes | UUID | Derived from cart line identity |
| `items[].quantity` | Yes | Positive integer, maximum `MAX_QUANTITY_PER_VARIANT` (20) | Derived from cart quantity |

Before database access, server normalization groups duplicate variant IDs, rejects a grouped quantity above 20, sorts variant IDs ascending, and preserves normalized customer/payment data. F3 already keeps cart variant IDs unique, but the backend remains authoritative.

No company, district/province structure, shipping method, promotion code, tax field, or client total exists in `CheckoutInput`; F4 will not invent them.

### 2.3 Payment methods

The only supported methods are:

- `cod` — visible label `THANH TOÁN KHI NHẬN HÀNG`;
- `bank_transfer` — visible label `CHUYỂN KHOẢN NGÂN HÀNG`.

The customer must explicitly select one; there is no uncommunicated default. The backend records the choice only. It creates COD orders with payment status `unpaid` and bank-transfer orders with payment status `pending`. F4 does not add bank details, QR codes, gateway processing, card entry, or payment confirmation behavior.

### 2.4 Shipping behavior

`calculateShippingFeeVnd()` is explicitly marked `TEMPORARY V1 DEVELOPMENT POLICY` and currently returns `0` regardless of subtotal/address. The client never supplies shipping money. `OrderDTO` exposes only final `totalVnd`, not subtotal or shipping fee.

F4 will not advertise free shipping or render a client-authored shipping row. Before submission it will show only the cart snapshot subtotal and the statement `Giá và tình trạng sản phẩm sẽ được xác nhận lại khi đặt hàng.` After success it will show the server-confirmed `totalVnd`. The temporary shipping policy remains a documented backend limitation, not marketing copy.

### 2.5 POST /api/checkout success contract

The route runs in the Node.js runtime and performs: JSON parsing → Zod validation → duplicate normalization → transactional checkout service → direct `OrderDTO` response.

Successful response:

- HTTP status: `201 Created`;
- body: `OrderDTO` directly, with no wrapper.

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

For newly created orders, `orderStatus` is `pending`; payment status is `unpaid` for COD and `pending` for bank transfer. `totalVnd` is the server-authoritative total calculated from locked product/variant prices plus the server shipping policy.

No GET order endpoint exists. No idempotency key/header/table or duplicate-request protocol exists.

### 2.6 Stable backend errors

All documented API errors use:

```ts
type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

| HTTP | Code | Actual cause | Vietnamese presentation | Retry/cart behavior |
| --- | --- | --- | --- | --- |
| 400 | `INVALID_JSON` | Request body is not JSON | `Không thể gửi thông tin đặt hàng. Vui lòng kiểm tra và thử lại.` | No automatic retry; cart intact |
| 400 | `VALIDATION_ERROR` | Zod validation or grouped quantity failure | `Thông tin đặt hàng chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.` | Correct input/cart, then manual retry; cart intact |
| 409 | `ITEM_UNAVAILABLE` | Missing/inactive product or variant, missing inventory, or relationship changed | `Một hoặc nhiều sản phẩm không còn khả dụng. Vui lòng kiểm tra lại giỏ hàng.` | Manual cart correction; cart intact |
| 409 | `INSUFFICIENT_INVENTORY` | Available inventory is below requested quantity | `Số lượng sản phẩm hiện không còn đủ. Vui lòng điều chỉnh giỏ hàng.` | Manual quantity correction; cart intact |
| 422 | `ORDER_VALUE_LIMIT_EXCEEDED` | Checked integer money calculation exceeded supported limits | `Giá trị đơn hàng vượt giới hạn hỗ trợ. Vui lòng điều chỉnh giỏ hàng.` | Manual cart correction; cart intact |
| 500 | `SERVER_CONFIGURATION_ERROR` | Required server configuration unavailable | `Hệ thống đặt hàng tạm thời chưa sẵn sàng. Vui lòng thử lại sau.` | Manual retry later; cart intact |
| 500 | `INTERNAL_ERROR` | Unknown server/infrastructure error | `Không thể hoàn tất đơn hàng lúc này. Vui lòng thử lại sau.` | Manual retry later; cart intact |

The UI maps only stable codes. It never renders backend messages/details, SQL, stack traces, connection strings, or unknown internal identifiers. Unknown codes receive the same safe generic server-error copy.

Network failures and malformed/unexpected responses are client-side `uncertain` outcomes, not invented backend codes.

## 3. Design decisions considered

### 3.1 Validation approaches

1. **Recommended: extract the existing pure Zod schema to a browser-safe contract module.** This gives server and client one normalization/validation implementation with no server imports. The old server module becomes a compatibility re-export. Behavior does not change.
2. Native constraints plus a hand-written client validator. This avoids moving a file but duplicates phone/email/length rules and will drift.
3. Server-only validation. This avoids client code but gives poor field feedback and makes obvious invalid submissions unnecessarily reach the API.

F4 chooses option 1. The audited schema imports only Zod and the browser-safe quantity constant, so extraction is a zero-behavior shared refactor. The server remains authoritative and validates every request again.

### 3.2 Success destination

1. **Recommended: inline confirmed-success state on `/thanh-toan`.** It can safely use the returned `OrderDTO` without exposing data in a URL or requiring a missing read endpoint.
2. Separate success route with query data. It would be non-durable, risk leaking identifiers, and break on refresh.
3. New GET order endpoint. This is backend/F5 scope and would require an access-control/privacy design.

F4 chooses option 1. Refreshing after success will hydrate the reconciled cart; normally it shows the empty checkout state. The confirmation itself is intentionally not durable across refresh. Durable receipt/order lookup is deferred.

### 3.3 Cart clearing approaches

1. Clear the whole cart after success. Simple, but it can delete additions made in another tab while the request is in flight.
2. **Recommended: reconcile the submitted quantities from the current cart.** This is a small pure reducer action and preserves post-submit additions and new variants.

F4 chooses option 2.

## 4. Frontend architecture and module boundaries

```text
Server Component route
  /thanh-toan/page.tsx
    CheckoutClient (client boundary)
      useCart()
      CheckoutForm
      CheckoutSummary
      browser-safe checkout input/HTTP/error modules
        POST /api/checkout
          existing route/schema/service/transaction
```

- `src/app/(storefront)/thanh-toan/page.tsx` remains a small Server Component and renders the client checkout boundary. It does not query PostgreSQL and needs no dynamic-rendering escape hatch.
- `CheckoutClient` owns hydration branching, controlled form values, submission state, a synchronous in-flight guard, the frozen submitted cart capture, error/success state, focus management, and reconciliation after valid success.
- `CheckoutForm` renders only canonical fields and receives values, field errors, busy state, and callbacks. It does not fetch or access storage.
- `CheckoutSummary` renders cart snapshots and `BigInt` snapshot totals with explicit provisional labeling. It has no commercial logic.
- `src/lib/checkout` contains pure/browser-safe input construction, HTTP response validation, and error presentation. It imports no server service, repository, database, Drizzle, `pg`, or `server-only` module.
- The storefront layout remains a Server Component; its existing `CartProvider` is reused.

## 5. Shared canonical validation

Create `src/contracts/checkout-schema.ts` containing the current `checkoutSchema` and `MAX_CHECKOUT_ITEMS`, importing only Zod, `CheckoutInput`, and `MAX_QUANTITY_PER_VARIANT`. It must preserve every current preprocessing, transform, bound, enum, UUID, array, and quantity behavior exactly. A compile-time `z.ZodType<CheckoutInput>` compatibility check keeps the runtime output aligned with the canonical type.

`src/server/validation/checkout.schema.ts` becomes a compatibility re-export so existing backend imports/tests remain valid. The route may continue importing the compatibility path. No server behavior changes.

The browser builds an unknown candidate from controlled form values plus the cart projection and calls the shared schema. On success it sends the schema's normalized output (trimmed strings, normalized phone, lowercased optional email, blank optionals omitted). On failure it maps issue paths to localized field messages and does not call `fetch`.

Native HTML attributes (`required`, `type`, `maxLength`, autocomplete, input mode) provide immediate semantics, but the shared schema is the client UX validation authority and the route is the commercial/security authority.

## 6. Cart projection and trust boundary

F4 reuses the existing `selectCheckoutItems(items)` projection:

```ts
items.map(({ variantId, quantity }) => ({ variantId, quantity }))
```

The request never includes cart `productId`, names, labels, media, snapshot prices, subtotal, shipping fee, total, or stock state. Those fields remain presentation-only.

The payload consists only of:

```ts
{
  customer: {
    name,
    phone,
    ...(email ? { email } : {}),
    address,
    ...(note ? { note } : {}),
  },
  paymentMethod,
  items: selectCheckoutItems(cartItems),
}
```

The server revalidates availability and stock under locks and calculates all authoritative money.

## 7. Hydration state machine

`CheckoutClient` uses these explicit states:

1. **Unhydrated:** neutral editorial loading treatment with `aria-busy="true"`; no empty conclusion, form, or submit action.
2. **Hydrated empty:** branded empty state; no form/submission; CTA to `/san-pham` and optional return to `/gio-hang`.
3. **Hydrated with items / idle:** form and snapshot summary are available.
4. **Client validation failure:** no request; localized errors; cart and controlled values preserved; error summary focused.
5. **Submitting:** capture form input, full cart snapshots, and projected lines; set a synchronous submission ref before awaiting; disable form submission and expose busy text.
6. **Deterministic API failure:** cart and form values preserved; submission guard released; relevant correction/manual retry allowed.
7. **Uncertain network/response failure:** cart and form values preserved; no automatic retry; submit remains disabled for the mounted checkout instance, with explicit ambiguity guidance.
8. **Confirmed success:** reconcile captured quantities, then render the inline success state from validated `OrderDTO`.

While a request is pending, summary presentation uses the frozen submitted cart snapshot so cross-tab changes do not rewrite what the pending request represents. Provider state can still receive storage events and is used later as the reconciliation base.

## 8. POST lifecycle and double-submit protection

The submit handler follows this exact order:

1. Return unless the cart is hydrated, non-empty, and no request is in flight.
2. Set a synchronous `submittingRef` guard before validation/fetch work; React state alone is not sufficient against two same-tick submissions.
3. Capture current full cart items and `selectCheckoutItems()` output.
4. Validate/normalize the canonical candidate with the shared schema.
5. If validation fails, release the guard, show/focus localized errors, and do not fetch.
6. Set submitting UI and call `fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })` exactly once.
7. Parse the response defensively.
8. Treat success only as status `201` plus a runtime-valid `OrderDTO`.
9. On valid success, reconcile exactly the captured submitted quantities and show authoritative confirmation.
10. On a recognized error envelope, preserve cart/form and allow correction or deliberate retry.
11. On network failure or malformed/unexpected response, preserve cart/form, enter `uncertain`, do not retry automatically, and do not clear/reconcile.

The form has semantic `<form>` behavior, so keyboard Enter uses the same guarded handler. Submit is disabled and exposes `aria-disabled`/busy copy while pending.

## 9. Runtime response validation

No browser-safe response validator currently exists. `src/lib/checkout/checkout-http.ts` will define small strict Zod validators aligned to `OrderDTO` and `ApiErrorResponse`:

- success validator: UUID `id`, non-empty `orderNumber`, non-negative safe-integer `totalVnd`, exact payment/order/payment-status enums, and ISO datetime string;
- error validator: `{ error: { code: string, message: string, details?: unknown } }`.

The success schema is explicitly typed against `OrderDTO`; the error schema is typed against `ApiErrorResponse`. This is runtime boundary validation, not a second business schema.

Non-201 responses with a valid error envelope become deterministic API failures. A response that does not match either the documented `201 + OrderDTO` success or a valid error envelope becomes uncertain. Arbitrary JSON can never trigger cart reconciliation.

## 10. Idempotency and network ambiguity

The backend has no idempotency protocol. F4 will not invent an unsupported header or client-generated key.

Consequences:

- no automatic POST retry;
- a network exception may mean the order was never received or was committed without the response reaching the browser;
- uncertain outcomes keep cart and PII-in-memory form values intact;
- the current checkout instance blocks another submission after an uncertain outcome and explains that the order could not be confirmed, avoiding an immediate duplicate;
- refreshing the page can make manual resubmission possible, which remains an unavoidable limitation until backend idempotency/order lookup exists.

Idempotency and durable order-status lookup are deferred rather than silently simulated.

## 11. Confirmed-success reconciliation

Add a browser-safe cart reducer action and provider method conceptually named:

```ts
reconcileSubmittedItems(
  submitted: readonly { variantId: string; quantity: number }[],
): void
```

For each current cart line:

- subtract the submitted quantity for the same `variantId`;
- remove the line when the remainder is zero or negative;
- retain the current line and its current presentation snapshot when a positive remainder exists;
- leave variants absent from the submitted capture untouched;
- never create negative quantities.

Example: submitted `X ×2`; a storage event changes current cart to `X ×3` while awaiting the server; confirmed success leaves `X ×1`. A new variant added during the request remains. If another tab already removed a submitted line, reconciliation leaves it absent.

Reconciliation runs only after valid `201 + OrderDTO`. Its state change persists through the existing post-hydration storage effect and propagates normally to other tabs. No pre-success optimistic cart mutation occurs.

## 12. Checkout page UX

### 12.1 Page structure

1. Editorial header:
   - eyebrow `THANH TOÁN`;
   - headline `HOÀN TẤT ĐƠN HÀNG.`;
   - concise copy explaining that availability and price are confirmed on submission.
2. Desktop two-column composition:
   - left: customer information and payment method form;
   - right: sticky, provisional order snapshot summary.
3. Mobile/tablet: image-light single-column form followed by summary and submit action with comfortable touch targets.

`/gio-hang` gains a real `TIẾN HÀNH THANH TOÁN` link to `/thanh-toan` only when the hydrated cart contains items. Its existing continue-shopping CTA remains secondary.

### 12.2 Summary

Each line shows snapshot product name, variant label, quantity, and snapshot line total. Images may be omitted from the checkout summary if space is better used for form clarity; if shown, only the existing snapshot image is used. The summary labels its subtotal `TẠM TÍNH THAM KHẢO` and repeats the server-confirmation notice. It does not show SKU, shipping, discounts, taxes, or a promised final total.

### 12.3 Success

The inline success state shows:

- `ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN`;
- server-returned `orderNumber`;
- server-authoritative formatted `totalVnd`;
- localized payment method;
- navigation to `/` and `/san-pham`.

It does not show cart snapshot totals as final, expose customer PII, or invent bank-transfer instructions. Refresh does not reconstruct the success receipt; it displays the state appropriate to the reconciled cart.

## 13. Error and field presentation

- Client validation errors are associated with inputs through stable IDs and `aria-describedby`; the summary uses `role="alert"` or an assertive live region and receives focus.
- API errors use the stable code mapping in section 2.6. Unknown messages/details are ignored.
- Inventory/unavailable errors direct the customer back to `/gio-hang` to adjust the cart; F4 does not auto-refresh products or mutate quantities.
- Deterministic failures release the request lock and re-enable submission where retry can be deliberate.
- Uncertain outcomes keep submission blocked for the mounted component and use a distinct safe message.
- Success and top-level failure states receive focus without stealing focus during ordinary typing.
- `alert()` and console logging are not used.

## 14. Accessibility

- Semantic `<form>`, `<fieldset>`, `<legend>`, `<label>`, required attributes, and native radio controls.
- Visible labels; placeholders are supplementary only.
- `autoComplete="name"`, `tel`, `email`, and `street-address`; appropriate `type` and `inputMode`.
- Error summary plus per-field error association; selected payment state is not conveyed by color alone.
- Minimum comfortable touch targets, visible focus indicators, sufficient existing token contrast, and keyboard submission.
- Pending submit uses disabled semantics and `aria-busy`; status/error/success announcements use appropriate live regions.
- Focus moves to validation/API error summary or confirmed-success heading.
- Motion is limited to existing CSS transitions and respects reduced motion.

## 15. Responsive behavior

- **1440/1280:** spacious form/summary split, approximately 7/5 or 8/4 columns; summary may be sticky below the header.
- **1024:** balanced two-column layout with reduced gap and no compressed fields.
- **768:** intentional single-column flow or wide stacked sections; no narrow side-by-side form controls.
- **390:** all controls stack, radios remain easy to tap, long names and errors wrap, summary uses list layout rather than a table, and no horizontal overflow occurs.

The page uses the existing cream/surface/charcoal/accent tokens, Be Vietnam Pro/Playfair hierarchy, borders, and generous whitespace. It adds no animation or form dependency.

## 16. Privacy and storage

Customer name, phone, email, address, note, payment choice, API errors, and `OrderDTO` stay in React component memory only. They are not written to localStorage, sessionStorage, URLs, console output, analytics, or third-party tooling.

The existing cart remains the only persisted checkout-related browser state. Tests use obviously synthetic PII.

## 17. Test matrix

### Shared schema and projection (Node)

- extracted schema preserves every current normalization and boundary;
- cart projection returns only `variantId` and `quantity`, preserves quantity, and rejects an empty cart through canonical schema validation;
- no snapshot name, media, product ID, price, subtotal, shipping, or total enters the request.

### HTTP client and error mapping (Node)

- exact URL `/api/checkout`, `POST`, JSON content type, and canonical body;
- only `201 + valid OrderDTO` succeeds;
- authoritative server total/status values survive parsing;
- every real error code/status maps to safe Vietnamese copy;
- unknown code, invalid JSON response, malformed success, and network rejection are safe and do not expose raw details;
- no automatic retry.

### Cart reconciliation (Node and scoped jsdom)

- submitted quantity is removed;
- extra same-variant quantity remains;
- new variants remain;
- already-removed lines remain absent;
- subtraction never creates negative quantities;
- provider blocks reconciliation before hydration and persists only the confirmed reconciliation afterward;
- cross-tab additions adopted during a pending request form the base for reconciliation.

### Checkout UI (`// @vitest-environment jsdom`)

- SSR/first render is hydration-neutral and submit is absent/disabled;
- hydrated empty cart shows branded empty state only after hydration;
- persisted cart renders snapshot summary and provisional language;
- every canonical field/label/autocomplete and both supported payment methods render;
- client validation prevents fetch and associates errors;
- exact canonical normalized payload is posted;
- repeated click/Enter while pending produces one request;
- success uses returned order number and authoritative total and reconciles only after response validation;
- validation, unavailable, stock, money-limit, server, network, and malformed-response failures preserve the cart and input;
- uncertain failure does not automatically retry or re-enable immediate submission;
- error and success focus/live-region behavior works;
- no customer PII is persisted;
- no payment gateway, shipping claim, or client total is sent.

### Cart page navigation

- non-empty hydrated cart links to `/thanh-toan`;
- empty/unhydrated cart does not expose checkout navigation;
- existing quantity/remove/clear behavior remains green.

### Regression and live validation

- all backend, F1, F2, and F3 tests remain green;
- global Vitest environment stays Node and DOM tests opt into jsdom per file;
- lint, Next.js production build, and `git diff --check` pass;
- existing rollback-safe PostgreSQL integration runs when the configured database is available;
- no automatic seed or commercial-data mutation is performed;
- end-to-end order creation is attempted only against explicitly disposable/approved data. If no active product exists, live browser checkout is reported as deferred rather than filled with runtime fixtures.

## 18. Proposed file scope

```text
src/app/(storefront)/thanh-toan/
  page.tsx                                  # create: Server Component route

src/components/checkout/
  CheckoutClient.tsx                       # create: hydration/submission/success orchestration
  CheckoutClient.test.ts                   # create: file-scoped jsdom integration tests
  CheckoutForm.tsx                         # create: canonical fields and accessible controls
  CheckoutSummary.tsx                      # create: provisional snapshot summary

src/lib/checkout/
  checkout-input.ts                        # create: candidate construction + shared validation mapping
  checkout-input.test.ts                   # create: projection/normalization tests
  checkout-http.ts                         # create: POST and runtime response validation
  checkout-http.test.ts                    # create: request/response tests
  checkout-errors.ts                       # create: stable-code Vietnamese presentation
  checkout-errors.test.ts                  # create: taxonomy tests

src/contracts/
  checkout-schema.ts                       # create: browser-safe canonical Zod schema
  index.ts                                 # modify: shared exports

src/server/validation/
  checkout.schema.ts                       # modify: compatibility re-export only
  checkout.schema.test.ts                  # modify only if import-parity coverage is needed

src/lib/cart/
  cart-reducer.ts                          # modify: pure submitted-quantity reconciliation
  cart-reducer.test.ts                     # modify: reconciliation cases

src/components/cart/
  CartProvider.tsx                         # modify: expose guarded reconciliation action
  CartProvider.test.ts                     # modify: hydration/persistence/cross-tab reconciliation tests
  CartPage.tsx                             # modify: real checkout navigation
  CartPage.test.ts                         # modify: navigation gating tests
```

No package dependency is required.

## 19. Protected scope and backend boundary

F4 does not modify homepage Screens 01–05, Three.js/R3F/Drei, GLBs, homepage GSAP, Footer design, brand/story assets, F1 catalog layout, F2 PDP layout, `src/data/products.ts`, ProductDTO, CheckoutInput semantics, database schema/migrations, checkout transaction/order-number/inventory behavior, shipping calculation, API error envelope, admin, or authentication.

The only server-path change is a compatibility re-export after moving the already-pure checkout schema to browser-safe shared scope. This is a zero-behavior refactor. No backend foundation change is required.

## 20. Explicitly deferred work

- Backend idempotency keys and duplicate-order protection across ambiguous retries.
- Durable success/receipt route and GET order/detail endpoint.
- Order lookup/history, accounts, authentication, admin, and status management.
- Production shipping policy and shipping-provider integration.
- Bank-transfer instructions, QR generation, reconciliation, or payment confirmation.
- Card, VNPay, MoMo, ZaloPay, Stripe, or other gateway processing.
- Customer PII persistence/autofill beyond standard browser autocomplete.
- Promotions, discounts, tax calculation, address APIs, analytics, and email/SMS notifications.

## 21. Design self-review

- No CheckoutInput field, payment method, shipping claim, response wrapper, or backend error code is invented.
- Cart snapshots are displayed but never posted as commercial data.
- Cart mutation occurs only after `201 + runtime-valid OrderDTO`.
- Network ambiguity has no automatic retry and does not clear the cart.
- Concurrent cart changes are handled by submitted-quantity reconciliation rather than whole-cart clearing.
- Customer PII stays in memory and never enters browser storage or logs.
- The Server Component layout and backend checkout architecture remain intact.
- The proposal contains no F5 gateway, durable receipt, order lookup, admin, or auth scope.
