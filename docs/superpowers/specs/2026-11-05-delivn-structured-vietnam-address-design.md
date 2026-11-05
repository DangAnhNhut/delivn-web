# DELIVN Structured Vietnam Shipping Address Design

## Intent

Replace the checkout's single free-text shipping-address field with a deterministic two-level Vietnamese administrative address flow. Customers select a canonical province-level unit, select a canonical commune-level unit belonging to that province, and type only the detailed house/street/locality portion.

The result improves delivery-data quality while preserving the existing checkout API and order snapshot: the browser composes one human-readable `customer.address` string before submission.

## Goals

- Use the current post-merger, two-level Vietnamese administrative model.
- Make province and commune values searchable, keyboard accessible, touch friendly, and canonical-code backed.
- Prevent stale or injected province/commune combinations.
- Preserve the existing checkout API, order service, database schema, order snapshot, payment UI, and compliance consent.
- Keep customer PII in component memory only.
- Leave a documented, reviewable provenance trail for the checked-in dataset.

## Non-goals

- No district-level field or district data.
- No database tables, schema changes, or migrations for administrative units.
- No account, authentication, address book, saved address, or default-address feature.
- No runtime third-party address API.
- No geocoding, shipping-rate lookup, postal-code lookup, map, or location tracking.
- No changes to payment semantics, product pricing, inventory, or order-number behavior.

## Authoritative dataset

The checked-in snapshot is derived from:

- Decision 19/2025/QD-TTg of the Prime Minister, issued 30 June 2025 and effective 1 July 2025: <https://vanban.chinhphu.vn/?classid=1&docid=214409&orggroupid=3&pageid=27160>
- Official coded appendices published by the National Statistics Office: <https://www.nso.gov.vn/wp-content/uploads/2025/07/19_2025_qd-ttg_30062025-signed-6-143-da-nen.pdf>

Decision 19 defines two independent code levels: two-digit province-level codes and five-digit commune-level codes. Its appendices contain 34 province-level units and 3,321 commune-level units. The checkout does not model the abolished district level.

The repository will record the snapshot and extraction details in `docs/compliance/address-data-source.md`, including the decision number, issue/effective dates, source URLs, extraction date, transformation rules, expected counts, and the two-level-model note. Future official changes require a deliberate dataset regeneration and test update rather than a runtime fetch.

## Data architecture

### Generated data

Create `src/data/vietnam-administrative-units.generated.json` with this shape:

```json
{
  "metadata": {
    "decisionNumber": "19/2025/QD-TTg",
    "issuedDate": "2025-06-30",
    "effectiveDate": "2025-07-01",
    "provinceCount": 34,
    "communeCount": 3321,
    "sourceUrl": "..."
  },
  "provinces": [
    { "code": "01", "name": "Thành phố Hà Nội", "type": "thành phố" }
  ],
  "communes": [
    {
      "code": "00004",
      "name": "Phường Ba Đình",
      "provinceCode": "01",
      "type": "phường"
    }
  ]
}
```

Codes remain strings so leading zeroes are preserved. Names include their official administrative prefix and are used verbatim in the composed address. Allowed province types are `tỉnh` and `thành phố`; allowed commune types are `phường`, `xã`, and `đặc khu`.

### Typed adapter

Create `src/data/vietnam-administrative-units.ts` as a browser-safe, dependency-free adapter over the generated JSON. It exports:

- `VIETNAM_ADMINISTRATIVE_DATA_METADATA`
- `VIETNAM_PROVINCES`
- `VIETNAM_COMMUNES`
- `getProvinceByCode(code)`
- `getCommuneByCode(code)`
- `getCommunesByProvinceCode(provinceCode)`
- `isCommuneInProvince(communeCode, provinceCode)`
- accent-insensitive search normalization for selector filtering

The adapter imports no server, database, repository, or checkout-service code.

### Dataset invariants

Focused Node-environment tests verify:

- exactly 34 province-level records for this deliberate Decision 19 snapshot;
- exactly 3,321 commune-level records for this deliberate Decision 19 snapshot;
- unique two-digit province codes;
- unique five-digit commune codes;
- every commune references a real province;
- only the approved unit types are present, including all three commune types;
- metadata identifies Decision 19 and its effective date;
- no district collection or `districtCode` property exists.

## Searchable administrative combobox

Create a repository-native `AdministrativeCombobox` Client Component. It uses an actual text input with WAI-ARIA combobox semantics and a listbox popup; it is not a div-only fake select.

Required semantics and behavior:

- associated visible label;
- `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, and `aria-activedescendant` on the input;
- `role="listbox"` and `role="option"` for results;
- Arrow Down/Up changes the active option;
- Home/End moves to the first/last result;
- Enter commits the active canonical option;
- Escape closes without inventing a value;
- pointer/touch selection commits the same canonical option path;
- visible focus and at least comfortable mobile-height controls;
- Vietnamese accent-insensitive, case-insensitive substring search;
- an explicit no-results message;
- a disabled commune control until a province is selected;
- popup width constrained to its field and mobile viewport, with vertical scrolling only.

The displayed query text is not authoritative. A field is valid only after an option commits its official code. Editing a committed label clears its canonical code immediately, so arbitrary typed text can never submit as an administrative selection.

## Checkout form state

Replace the current `address` form value with frontend-only structured state:

```ts
type CheckoutFormValues = {
  name: string;
  phone: string;
  email: string;
  provinceCode: string;
  communeCode: string;
  addressDetail: string;
  note: string;
  paymentMethod: PaymentMethod | "";
};
```

`CheckoutFieldName` gains `provinceCode`, `communeCode`, and `addressDetail` and removes the frontend `address` field. The canonical public `CheckoutInput` remains unchanged.

Province selection is handled as one atomic state transition:

1. set the new canonical `provinceCode`;
2. always clear `communeCode` when the province code changes;
3. clear the province error;
4. clear any stale commune error;
5. require a fresh commune choice from the newly filtered list.

The form passes only communes belonging to the selected province to the commune combobox. Submission still revalidates the relationship independently; UI filtering is not treated as a trust boundary.

## Validation and composition

`createCheckoutInput()` remains the frontend boundary that produces canonical `CheckoutInput`. Before invoking the shared checkout schema it must:

1. resolve `provinceCode` against the checked-in province dataset;
2. resolve `communeCode` against the checked-in commune dataset;
3. verify the commune belongs to the selected province;
4. normalize `addressDetail` by trimming leading/trailing whitespace and collapsing repeated whitespace without changing letter case or punctuation;
5. require meaningful detail content and enforce a frontend limit that leaves room under the backend's existing 500-character composed-address maximum;
6. compose the human-readable address;
7. pass that composed value through the existing browser-safe checkout schema.

Canonical composition:

```text
{addressDetail}, {communeName}, {provinceName}, Việt Nam
```

Example:

```text
148/4 Đường ABC, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam
```

No district name is introduced. Administrative names come directly from the official dataset and are never accepted from free text.

Field errors:

- `provinceCode`: `Vui lòng chọn tỉnh / thành phố.`
- `communeCode`: `Vui lòng chọn phường / xã / đặc khu.`
- `addressDetail`: `Vui lòng nhập địa chỉ chi tiết.`

An unknown province fails the province field. An unknown commune or a commune belonging to another province fails the commune field. A composed address that violates the existing checkout schema remains a client validation failure and is never posted.

## Checkout layout

Keep the existing DELIVN checkout composition and payment work. Within `THÔNG TIN NHẬN HÀNG`:

- name remains full width;
- phone and optional email remain paired on desktop;
- province and commune comboboxes are paired on desktop;
- address detail is full width;
- note remains full width;
- payment cards, the bank-transfer placeholder, and consent block remain unchanged.

At 390 px, province, commune, and detail fields stack in that order. Popups stay within the viewport and controls remain touch friendly. No district field appears at any breakpoint.

## Privacy and trust boundaries

- Structured address state lives only in the checkout component tree.
- No address field is written to localStorage, sessionStorage, cookies, URLs, analytics, or logs.
- Cart persistence remains unchanged and contains no customer address.
- Only the composed human-readable address is sent through the existing checkout POST.
- Server validation, pricing, stock, totals, and order creation remain authoritative.
- The order continues storing the composed address snapshot as text, protecting historical readability if official names change later.

## Error and submission behavior

- Structured-address validation coexists with mandatory consent validation.
- Missing or invalid address state blocks the request and presents field-local errors plus the existing error summary.
- Valid COD and bank-transfer submissions continue using their existing values and request lifecycle.
- Checkout failure preserves all in-memory customer/address selections as today.
- Confirmed success follows the existing order success and cart reconciliation path.

## Test strategy

### Data tests

- metadata, counts, code formats, uniqueness, parent integrity, unit types, and no district model;
- accent-insensitive search behavior;
- province/commune lookup and relationship helpers.

### Pure checkout-input tests

- missing and unknown province;
- missing and unknown commune;
- mismatched province/commune pair;
- missing/whitespace-only detail;
- whitespace normalization while preserving punctuation/case;
- exact composed address;
- no district insertion;
- payload remains canonical `CheckoutInput`.

### Component tests (file-scoped jsdom)

- both comboboxes render with correct ARIA semantics;
- commune is disabled until province selection;
- filtering and keyboard selection;
- changing province clears the commune selection and stale error;
- arbitrary typed administrative text cannot become a valid code;
- field-local errors render;
- existing consent, COD, bank transfer, and POST tests remain green;
- no PII is persisted.

### Playwright

Update the guarded customer journey to select a real province and commune through visible controls, enter address detail, submit COD, receive HTTP 201, and verify the stored order address snapshot exactly equals the composed address. Responsive checkout coverage asserts the 390 px stack and no horizontal overflow. Capture:

- `checkout-address-desktop-1440.png`
- `checkout-address-mobile-390.png`

## Approaches considered

### Selected: repository-native ARIA combobox

Provides canonical option commitment, accent-insensitive search, full keyboard control, and no dependency. It requires more focused interaction tests but best satisfies the requirement that administrative values are selected rather than freely typed.

### Rejected: native `datalist`

Smaller implementation, but permits arbitrary temporary values and has inconsistent mobile and assistive-technology presentation. It weakens the explicit-selection UX.

### Rejected: third-party accessible combobox package

Would reduce bespoke interaction code but expands dependencies and bundle/maintenance scope for two bounded selectors.

## Protected scope

No changes to database schema, migrations, `CheckoutInput`, checkout API semantics, order/inventory services, ProductDTO, CartProvider architecture, prices, product pages, contact page, homepage 3D/motion, authentication, or account features.

## Acceptance criteria

- Decision 19 official codes and names are checked in with provenance.
- Province and commune are canonical selections backed by codes.
- Commune choices are province-dependent and reset on province changes.
- Invalid or injected pairs cannot submit.
- Only detailed address text is free-form.
- The composed address is human-readable, district-free, and compatible with the existing API and stored order snapshot.
- Payment and consent behavior remain intact.
- No customer PII persistence, dependency addition, schema change, migration, commit, push, or merge occurs during implementation.
