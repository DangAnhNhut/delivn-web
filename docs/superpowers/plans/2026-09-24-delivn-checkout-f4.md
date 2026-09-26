# DELIVN Frontend F4 Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hydration-safe `/thanh-toan` experience that validates the canonical checkout contract, submits the real cart to `POST /api/checkout`, shows only confirmed server results, and reconciles submitted quantities without losing concurrent cart additions.

**Architecture:** Keep the route and storefront layout as Server Components and place all browser interaction in a focused `CheckoutClient`. Share the existing pure Zod checkout schema through browser-safe contract scope, isolate request/response validation in `src/lib/checkout`, and extend the F3 cart with one pure post-success reconciliation action. The existing backend remains the sole authority for prices, availability, inventory, shipping, and totals.

**Tech Stack:** Next.js 16.3.5 App Router, React 19, TypeScript, Zod 4, Tailwind CSS 4, Vitest 3, file-scoped jsdom, native React DOM test primitives.

**Spec:** `docs/superpowers/specs/2026-09-24-delivn-checkout-f4-design.md`

## Global constraints

- Work only on `feature/checkout`; do not switch branch, commit, push, or merge automatically.
- Read the current Next.js guides under `node_modules/next/dist/docs/` before changing App Router code.
- Keep `src/app/(storefront)/layout.tsx` a Server Component and reuse its existing `CartProvider` boundary.
- Submit only canonical customer/payment fields and `{ variantId, quantity }` cart items.
- Never send cart names, images, product IDs, snapshot prices, subtotal, shipping fee, total, or stock state.
- Treat success only as HTTP `201` plus a runtime-valid `OrderDTO`.
- Never clear or reconcile the cart before confirmed success; every failure preserves it.
- Do not automatically retry `POST /api/checkout`; no backend idempotency protocol exists.
- Keep customer PII in React memory only; never use localStorage, sessionStorage, URL parameters, console logging, or analytics for it.
- Preserve the global Vitest Node environment. Add `// @vitest-environment jsdom` only to DOM/browser test files.
- Add no state, form, request, animation, or testing dependency.
- Do not change checkout transactions, inventory behavior, shipping behavior, database schema/migrations, ProductDTO, CheckoutInput semantics, or the API error envelope.
- Preserve homepage Screens 01–05, Three.js/R3F/Drei, GLBs, homepage GSAP, Footer design, brand assets, F1/F2 layouts, and `src/data/products.ts`.

## Review focus

1. A response with status `201` but malformed JSON/body must be uncertain failure, preserve cart, and never display success.
2. Two submit events in the same React tick must produce exactly one fetch, using a synchronous ref guard rather than state alone.
3. A storage event that adds quantity while POST is pending must survive confirmed-success reconciliation.
4. Optional blank email/note must be omitted after canonical preprocessing, while invalid nonblank values must prevent fetch.
5. Network ambiguity must preserve cart and input, disable immediate resubmission for the mounted instance, and never auto-retry.

---

## Proposed file map

```text
src/app/(storefront)/thanh-toan/
  page.tsx

src/components/checkout/
  CheckoutClient.tsx
  CheckoutClient.test.ts
  CheckoutForm.tsx
  CheckoutSummary.tsx

src/lib/checkout/
  checkout-input.ts
  checkout-input.test.ts
  checkout-http.ts
  checkout-http.test.ts
  checkout-errors.ts
  checkout-errors.test.ts

src/contracts/
  checkout-schema.ts
  index.ts                         # modify

src/server/validation/
  checkout.schema.ts              # compatibility re-export
  checkout.schema.test.ts         # preserve/add parity assertion only

src/lib/cart/
  cart-reducer.ts                 # modify
  cart-reducer.test.ts            # modify

src/components/cart/
  CartProvider.tsx                # modify
  CartProvider.test.ts            # modify
  CartPage.tsx                    # modify
  CartPage.test.ts                # modify
```

## F4.0 — Reconfirm audit baseline

**Files:** Read-only inspection of all files listed in the spec audit plus the installed Next.js documentation.

**Dependencies:** None.

**Behavior/invariants:** Begin only from a clean `feature/checkout` worktree or stop and report unrelated changes. Confirm contract and response/error behavior have not changed since the design was approved.

- [ ] Run the repository-state checks.

```powershell
git branch --show-current
git status --short
git diff --stat
```

Expected: `feature/checkout`; only the approved F4 spec/plan may be uncommitted before implementation.

- [ ] Re-read the canonical files and installed Next.js component-boundary guidance.

```powershell
Get-Content -Raw 'src/contracts/checkout.ts'
Get-Content -Raw 'src/contracts/order.ts'
Get-Content -Raw 'src/contracts/api-error.ts'
Get-Content -Raw 'src/app/api/checkout/route.ts'
Get-Content -Raw 'src/server/validation/checkout.schema.ts'
Get-Content -Raw 'src/server/validation/checkout-normalization.ts'
Get-Content -Raw 'src/server/services/checkout.service.ts'
Get-Content -Raw 'src/server/services/shipping.service.ts'
Get-Content -Raw 'src/components/cart/CartProvider.tsx'
Get-Content -Raw 'src/lib/cart/cart-selectors.ts'
Get-Content -Raw 'node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md'
```

- [ ] Run the current full baseline before editing.

```powershell
npm run test:run
npm run lint
npm run build
```

Expected: all non-environment-dependent checks pass. If PostgreSQL alone is unavailable, record it separately and continue without changing DB configuration.

## F4.1 — Move the canonical checkout schema to browser-safe shared scope

**Files:**

- Create: `src/contracts/checkout-schema.ts`
- Modify: `src/contracts/index.ts`
- Modify: `src/server/validation/checkout.schema.ts`
- Test: `src/server/validation/checkout.schema.test.ts`

**Dependencies:** Existing `CheckoutInput`, `MAX_QUANTITY_PER_VARIANT`, Zod 4.

**Produces:**

```ts
export const MAX_CHECKOUT_ITEMS = 50;
export const checkoutSchema: z.ZodType<CheckoutInput>;
```

The server compatibility path continues exporting both constants/schema.

**Behavior/invariants:** This is a zero-behavior refactor. Preserve exact trimming, optional blank preprocessing, email lowercase transform, phone normalization, field bounds, enum values, UUID validation, item count, and quantity maximum. Do not import server modules into the shared file.

- [ ] Add a failing import-parity test to the existing server schema test.

The test imports `checkoutSchema` from `@/contracts/checkout-schema` and the compatibility path, parses the same fixture with both, and expects identical normalized output/errors. Also assert blank email/note omission and `20` accepted/`21` rejected.

- [ ] Run the focused test and confirm RED because the shared module does not exist.

```powershell
npm run test:run -- src/server/validation/checkout.schema.test.ts
```

- [ ] Create the shared module by moving the current schema implementation verbatim, then type-check its output against `CheckoutInput`.

```ts
import { z } from "zod";
import type { CheckoutInput } from "./checkout";
import { MAX_QUANTITY_PER_VARIANT } from "./commerce-limits";

export const MAX_CHECKOUT_ITEMS = 50;

const optionalEmailSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .max(254)
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
);

const optionalNoteSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(1_000).optional(),
);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s().-]+$/)
  .transform((value) => value.replace(/[\s().-]/g, ""))
  .refine(
    (value) => /^\+?\d{8,16}$/.test(value),
    "Phone must contain 8 to 16 digits.",
  );

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: phoneSchema,
    email: optionalEmailSchema,
    address: z.string().trim().min(5).max(500),
    note: optionalNoteSchema,
  }),
  paymentMethod: z.enum(["cod", "bank_transfer"]),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z
          .number()
          .int()
          .positive()
          .max(MAX_QUANTITY_PER_VARIANT),
      }),
    )
    .min(1)
    .max(MAX_CHECKOUT_ITEMS),
});

checkoutSchema satisfies z.ZodType<CheckoutInput>;
```

- [ ] Replace the server file with compatibility exports and export the shared schema from the contracts barrel.

```ts
export {
  checkoutSchema,
  MAX_CHECKOUT_ITEMS,
} from "@/contracts/checkout-schema";
export { MAX_QUANTITY_PER_VARIANT } from "@/contracts/commerce-limits";
```

- [ ] Run focused schema/normalization tests and the build.

```powershell
npm run test:run -- src/server/validation/checkout.schema.test.ts src/server/validation/checkout-normalization.test.ts
npm run build
```

Expected: exact existing behavior and imports pass; no server runtime enters client scope.

## F4.2 — Build canonical checkout input from the cart and form

**Files:**

- Create: `src/lib/checkout/checkout-input.ts`
- Create: `src/lib/checkout/checkout-input.test.ts`
- Reuse: `src/lib/cart/cart-selectors.ts`

**Dependencies:** Shared `checkoutSchema`, canonical types, `selectCheckoutItems`, browser-safe `CartItem` type.

**Produces:**

```ts
export type CheckoutFormValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  paymentMethod: PaymentMethod | "";
};

export type CheckoutFieldName =
  | "name"
  | "phone"
  | "email"
  | "address"
  | "note"
  | "paymentMethod";

export type CheckoutInputResult =
  | { ok: true; input: CheckoutInput }
  | { ok: false; fieldErrors: Partial<Record<CheckoutFieldName, string>>; summary: string };

export function createCheckoutInput(
  values: CheckoutFormValues,
  items: readonly CartItem[],
): CheckoutInputResult;
```

**Behavior/invariants:** The function constructs an unknown candidate, projects items with `selectCheckoutItems`, parses it with the shared schema, returns normalized output on success, and maps known issue paths to localized field messages. It does not fetch, persist, or import server code.

- [ ] Write failing pure tests for:
  - output contains normalized customer fields, selected payment method, and exact quantities;
  - only `variantId` and `quantity` exist in each item;
  - blank email/note are absent from parsed output;
  - empty cart fails;
  - invalid required fields and unselected payment map to the correct visible fields;
  - product name/image/price/subtotal/total never appear in serialized output.

- [ ] Run and confirm RED.

```powershell
npm run test:run -- src/lib/checkout/checkout-input.test.ts
```

- [ ] Implement the minimal pure builder and issue-path mapper.

Candidate construction must be exactly:

```ts
const candidate = {
  customer: {
    name: values.name,
    phone: values.phone,
    email: values.email,
    address: values.address,
    note: values.note,
  },
  paymentMethod: values.paymentMethod,
  items: selectCheckoutItems(items),
};
```

Do not manually normalize strings; return `checkoutSchema.safeParse(candidate).data` on success.

- [ ] Run the focused tests.

```powershell
npm run test:run -- src/lib/checkout/checkout-input.test.ts src/lib/cart/cart-selectors.test.ts
```

## F4.3 — Implement the browser checkout HTTP boundary and error taxonomy

**Files:**

- Create: `src/lib/checkout/checkout-http.ts`
- Create: `src/lib/checkout/checkout-http.test.ts`
- Create: `src/lib/checkout/checkout-errors.ts`
- Create: `src/lib/checkout/checkout-errors.test.ts`

**Dependencies:** Canonical `CheckoutInput`, `OrderDTO`, `ApiErrorResponse`, Zod 4, browser `fetch`.

**Produces:**

```ts
export type CheckoutHttpResult =
  | { ok: true; order: OrderDTO }
  | { ok: false; kind: "api"; status: number; code: string }
  | { ok: false; kind: "uncertain"; reason: "network" | "malformed_response" };

export async function postCheckout(
  input: CheckoutInput,
  fetcher?: typeof fetch,
): Promise<CheckoutHttpResult>;

export type CheckoutErrorPresentation = {
  message: string;
  canRetry: boolean;
  cartActionRecommended: boolean;
};

export function presentCheckoutError(
  failure: Exclude<CheckoutHttpResult, { ok: true }>,
): CheckoutErrorPresentation;
```

**Behavior/invariants:** Request exactly `/api/checkout` with POST and JSON. Parse only `201 + valid OrderDTO` as success. Parse documented error envelopes without displaying raw message/details. Treat network rejection or any response matching neither contract as uncertain. Never retry internally.

- [ ] Write failing HTTP tests covering:
  - exact URL/method/header/body and one fetch call;
  - `201 + valid OrderDTO` success;
  - status `201` with malformed JSON/body is uncertain;
  - a valid error envelope produces `kind: "api"` with status/code;
  - unknown HTML/JSON response is uncertain;
  - rejected fetch is uncertain and called once;
  - authoritative `totalVnd`, order number, method, and statuses are returned unchanged.

- [ ] Write failing mapping tests for every audited code: `INVALID_JSON`, `VALIDATION_ERROR`, `ITEM_UNAVAILABLE`, `INSUFFICIENT_INVENTORY`, `ORDER_VALUE_LIMIT_EXCEEDED`, `SERVER_CONFIGURATION_ERROR`, `INTERNAL_ERROR`, an unknown code, and both uncertain reasons.

- [ ] Run and confirm RED.

```powershell
npm run test:run -- src/lib/checkout/checkout-http.test.ts src/lib/checkout/checkout-errors.test.ts
```

- [ ] Implement strict response validators and one-shot fetch.

The success validator must cover the exact `OrderDTO` keys and enums, with UUID ID, non-empty order number, non-negative safe-integer total, and ISO datetime. The API-error validator covers only the stable envelope. Neither validator imports server code.

- [ ] Implement localized mapping. Set `cartActionRecommended: true` only for unavailable, inventory, and order-value errors. Set `canRetry: false` for uncertain outcomes; deterministic API failures may be retried manually after correction or later.

- [ ] Run focused tests.

```powershell
npm run test:run -- src/lib/checkout/checkout-http.test.ts src/lib/checkout/checkout-errors.test.ts
```

## F4.4 — Add pure post-success cart reconciliation

**Files:**

- Modify: `src/lib/cart/cart-reducer.ts`
- Modify: `src/lib/cart/cart-reducer.test.ts`
- Modify: `src/components/cart/CartProvider.tsx`
- Modify: `src/components/cart/CartProvider.test.ts`

**Dependencies:** `CheckoutInput["items"]`, existing reducer/provider hydration and persistence protocol.

**Produces:**

```ts
// CartAction member
{ type: "reconcileSubmitted"; items: CheckoutInput["items"] }

// Context method
reconcileSubmittedItems(items: readonly { variantId: string; quantity: number }[]): void;
```

**Behavior/invariants:** Aggregate submitted quantities by variant ID, subtract them from current cart state, remove zero/negative remainders, preserve positive remainders with current snapshots, and leave unsubmitted variants untouched. Provider method no-ops before hydration. Existing persistence and storage-event logic remains unchanged.

- [ ] Add failing reducer tests:
  - submitted `X×2` removes current `X×2`;
  - submitted `X×2` from current `X×3` leaves `X×1`;
  - new `Y` remains;
  - current line absent is a no-op;
  - submitted quantity above current never creates a negative line;
  - duplicate submitted IDs are aggregated defensively.

- [ ] Run reducer tests and confirm RED.

```powershell
npm run test:run -- src/lib/cart/cart-reducer.test.ts
```

- [ ] Implement the reducer action with a quantity map and `flatMap`/equivalent immutable transformation.

- [ ] Add failing provider tests for pre-hydration no-op, post-hydration persistence, and this race:
  1. hydrate `X×2`;
  2. adopt a valid storage event containing `X×3` and new `Y×1`;
  3. reconcile submitted `X×2`;
  4. expect `X×1`, `Y×1`, and exactly one legitimate persistence write for the reconciliation.

- [ ] Implement the guarded context method using `isHydratedRef` and dispatch. Do not read localStorage directly in checkout code.

- [ ] Run all cart tests.

```powershell
npm run test:run -- src/lib/cart src/components/cart/CartProvider.test.ts
```

## F4.5 — Build accessible form and snapshot summary components

**Files:**

- Create: `src/components/checkout/CheckoutForm.tsx`
- Create: `src/components/checkout/CheckoutSummary.tsx`
- Initial test coverage in: `src/components/checkout/CheckoutClient.test.ts`

**Dependencies:** `CheckoutFormValues`, field error types, CartItem, existing `formatVnd`, BigInt cart selectors.

**Interfaces:**

```ts
type CheckoutFormProps = {
  values: CheckoutFormValues;
  fieldErrors: Partial<Record<CheckoutFieldName, string>>;
  isSubmitting: boolean;
  submitBlocked: boolean;
  onChange: (field: CheckoutFieldName, value: string) => void;
};

type CheckoutSummaryProps = {
  items: readonly CartItem[];
};
```

`CheckoutForm` renders inside the orchestration component's semantic form or owns the form element via an `onSubmit` prop; choose one ownership pattern and keep a single `<form>`.

**Behavior/invariants:** Render exactly the audited fields. Payment starts unselected. Every input has visible label, stable error ID, required/optional wording, appropriate autocomplete/type/inputMode/maxLength, focus-visible styling, and at least comfortable touch targets. Summary displays presentation snapshots only, `BigInt` line/subtotal values, and provisional copy; no shipping/final promise.

- [ ] Create a file-scoped jsdom test harness in `CheckoutClient.test.ts` using existing `createRoot`, `act`, and `CartProvider` patterns—no React Testing Library.

- [ ] Add failing render/accessibility tests asserting:
  - all canonical labels and no invented fields;
  - `name`, `tel`, `email`, and `street-address` autocomplete values;
  - required semantics for name/phone/address/payment only;
  - exactly COD and bank-transfer radios;
  - provisional summary lines, quantity, BigInt subtotal, and warning copy;
  - absence of shipping claims, gateway/card controls, and client final total.

- [ ] Implement the form and summary with DELIVN tokens and responsive list/grid classes. Do not create a desktop table.

- [ ] Run the component test.

```powershell
npm run test:run -- src/components/checkout/CheckoutClient.test.ts
```

Expected at this phase: presentational tests pass; submit lifecycle tests are added next.

## F4.6 — Implement CheckoutClient hydration and submit lifecycle

**Files:**

- Create/complete: `src/components/checkout/CheckoutClient.tsx`
- Modify: `src/components/checkout/CheckoutClient.test.ts`

**Dependencies:** `useCart`, input builder, HTTP client, error mapper, form, summary, reconciliation method.

**State model:**

```ts
type SubmissionState =
  | { status: "idle" }
  | { status: "submitting"; submittedItems: CartItem[] }
  | { status: "error"; message: string; cartActionRecommended: boolean }
  | { status: "uncertain"; message: string }
  | { status: "success"; order: OrderDTO };
```

Use controlled `CheckoutFormValues`, field errors, a `submittingRef`, error/success focus refs, and frozen full cart snapshots during the request.

**Behavior/invariants:** No empty state before hydration. No submit with an empty cart. Set the synchronous guard before validation/fetch. One submission captures both display items and projected items. Deterministic failure releases the guard; uncertain failure does not permit immediate resubmit. PII remains component state only.

- [ ] Add failing hydration tests:
  - server/static render contains neutral loading and no empty conclusion/form submit;
  - empty persisted cart shows branded empty state after hydration;
  - populated persisted cart shows form and summary after hydration.

- [ ] Add failing validation tests:
  - empty/invalid canonical fields prevent fetch;
  - errors are associated via `aria-describedby` and error summary receives focus;
  - corrected values plus selected method yield exact normalized payload.

- [ ] Add failing double-submit tests using a deferred fetch promise. Dispatch two submit events without resolving and expect exactly one call, disabled submit, busy text, and `aria-busy`.

- [ ] Implement hydration branches, controlled values, shared validation, synchronous guard, frozen snapshot, and one POST call.

- [ ] Run the focused component tests.

```powershell
npm run test:run -- src/components/checkout/CheckoutClient.test.ts
```

## F4.7 — Complete confirmed-success and failure UX

**Files:**

- Modify: `src/components/checkout/CheckoutClient.tsx`
- Modify: `src/components/checkout/CheckoutClient.test.ts`

**Dependencies:** Validated `CheckoutHttpResult`, `presentCheckoutError`, provider reconciliation.

**Behavior/invariants:** Only valid success reconciles. Success uses returned order number/total/method and receives focus. Every failure preserves the cart and form. Deterministic errors allow a deliberate later submit; uncertain errors block immediate retry. No automatic retry or `alert()`.

- [ ] Add failing success tests:
  - valid `201 + OrderDTO` displays `ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN`, returned order number, and returned authoritative total;
  - reconciliation occurs after response validation, not before;
  - a same-variant addition and new variant introduced while fetch is pending survive as remainders;
  - submitting state clears and success heading receives focus;
  - navigation links target `/` and `/san-pham`.

- [ ] Add failing error tests for client validation, both 409 codes, 422, both 500 codes, unknown API code, network rejection, and malformed `201` body. For each, assert cart contents and controlled values are preserved.

- [ ] Add explicit uncertain-outcome assertions: one fetch only, no reconciliation, no success copy, no automatic retry, and submit remains disabled for the mounted instance.

- [ ] Implement the result transitions and focus effects. Never render raw server `message` or `details`.

- [ ] Run checkout component and library tests together.

```powershell
npm run test:run -- src/components/checkout src/lib/checkout src/lib/cart src/components/cart/CartProvider.test.ts
```

## F4.8 — Add route and cart-to-checkout navigation

**Files:**

- Create: `src/app/(storefront)/thanh-toan/page.tsx`
- Modify: `src/components/cart/CartPage.tsx`
- Modify: `src/components/cart/CartPage.test.ts`

**Dependencies:** Completed CheckoutClient; existing storefront route group and cart hydration behavior.

**Behavior/invariants:** The route is a minimal Server Component and performs no database request. A non-empty hydrated cart gains `TIẾN HÀNH THANH TOÁN` linking to `/thanh-toan`; loading/empty states expose no checkout link. Existing continue-shopping link and editorial design remain.

- [ ] Add failing CartPage tests for link gating:
  - unhydrated SSR has no `/thanh-toan` link;
  - hydrated empty cart has no `/thanh-toan` link;
  - hydrated non-empty cart has exactly one checkout link with approved copy;
  - existing quantity/remove/clear and snapshot-warning assertions remain.

- [ ] Run and confirm RED.

```powershell
npm run test:run -- src/components/cart/CartPage.test.ts
```

- [ ] Create the route:

```tsx
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default function ThanhToanPage() {
  return <CheckoutClient />;
}
```

- [ ] Add the cart link with existing DELIVN button language and accessible focus/touch sizing.

- [ ] Run cart and checkout component tests.

```powershell
npm run test:run -- src/components/cart/CartPage.test.ts src/components/checkout/CheckoutClient.test.ts
```

## F4.9 — Focused boundary and regression tests

**Files:** All F4 tests plus existing F1–F3/backend tests; no new framework files.

**Dependencies:** Completed implementation.

**Behavior/invariants:** Exercise trust boundaries and client/server imports explicitly rather than relying only on render behavior.

- [ ] Run the focused checkout/cart/validation suite.

```powershell
npm run test:run -- src/lib/checkout src/components/checkout src/lib/cart src/components/cart src/server/validation/checkout.schema.test.ts src/server/validation/checkout-normalization.test.ts src/server/http/api-errors.test.ts src/server/services/checkout.service.test.ts
```

- [ ] Inspect client dependency boundaries.

```powershell
rg -n "server-only|@/server|drizzle|from ['\"]pg['\"]" src/components/checkout src/lib/checkout
```

Expected: no matches.

- [ ] Inspect the request projection and PII persistence boundaries.

```powershell
rg -n "unitPriceVndSnapshot|subtotal|shippingFee|totalVnd|productName|localStorage|sessionStorage|console\." src/lib/checkout src/components/checkout
```

Expected: snapshot names/prices appear only in `CheckoutSummary`; request construction contains none; no PII storage/logging exists. `totalVnd` appears only in validated success handling.

- [ ] Confirm global Vitest remains Node and jsdom stays file-scoped.

```powershell
Get-Content -Raw 'vitest.config.ts'
rg -n "@vitest-environment" src --glob "*.test.ts"
```

## F4.10 — Database and live integration

**Files:** No database/schema/data changes.

**Dependencies:** Configured PostgreSQL if available; explicitly approved disposable data for any real browser checkout.

**Behavior/invariants:** Do not seed. Do not alter `DATABASE_URL`. Do not POST against unknown commercial data merely to demonstrate the UI. Existing integration is rollback-safe and remains the default DB verification.

- [ ] Run the guarded database integration test.

```powershell
npm run test:run -- src/server/db/database.integration.test.ts
```

If PostgreSQL is offline, report `ECONNREFUSED` separately. Do not hide it.

- [ ] If the database already contains an explicitly disposable active product/variant/inventory setup, perform one controlled browser checkout and verify `201 + OrderDTO`, reconciliation, and success UX. Otherwise report `VALID_CHECKOUT_BROWSER_QA_DEFERRED_NO_APPROVED_ACTIVE_PRODUCT`.

- [ ] Never run `npm run db:seed` for F4 validation.

## F4.11 — Full regression, build, and visual QA

**Files:** Read-only validation and final diff review.

**Dependencies:** All prior phases green except a separately reported offline DB integration.

- [ ] Run full automated validation.

```powershell
npm run test:run
npm run lint
npm run build
git diff --check
```

Expected build routes include static `/gio-hang` and `/thanh-toan`; product DB routes retain their established request-time classification. Build must not require PostgreSQL for checkout page prerendering.

- [ ] If browser tooling is available, inspect `/thanh-toan` at 1440, 1280, 1024, 768, and 390 widths. Verify hydration, form labels/errors, radio/keyboard behavior, pending lock, error/success focus, summary wrapping, cart navigation, and no overflow. If unavailable, report `MANUAL_BROWSER_VISUAL_CHECK_REQUIRED` without repeated retries.

- [ ] Review changed paths and protected scope.

```powershell
git diff --name-only
git diff --stat
git status --short
git diff
```

Expected: only the approved F4 files plus the zero-behavior shared schema and narrow cart reconciliation/navigation changes.

- [ ] Scan explicitly for forbidden scope and behavior.

```powershell
rg -n "Stripe|VNPay|MoMo|ZaloPay|idempotency|sessionStorage|api/checkout" src/components/checkout src/lib/checkout src/app/(storefront)/thanh-toan
```

Expected: only the intentional `/api/checkout` browser call; no gateway, fabricated idempotency, or PII persistence.

```powershell
git diff --name-only | rg "src/data/products|components/home|components/three|\.glb$|Footer|migrations|drizzle|checkout\.service|inventory\.repository|shipping\.service|db/schema"
```

Expected: no matches.

## Completion evidence

The implementation handoff must report:

- exact canonical form fields and shared validation behavior;
- exact request and `201 + OrderDTO` success condition;
- stable backend error mapping and uncertain-network behavior;
- synchronous double-submit protection;
- submitted-quantity reconciliation and cross-tab preservation;
- authoritative server-total display and provisional snapshot labeling;
- absence of PII persistence, automatic retry, gateway/payment simulation, and F5 scope;
- focused/full tests, lint, build, diff check, DB integration, browser QA, branch, status, and stat;
- protected-scope and backend-behavior confirmation.

Stop after F4. Do not implement a durable success route, GET order lookup, payment gateway, production shipping policy, admin, or authentication.
