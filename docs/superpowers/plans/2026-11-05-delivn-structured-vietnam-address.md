# DELIVN Structured Vietnam Shipping Address Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace checkout's free-text shipping address with canonical province/commune selection and a free-text address detail while preserving the existing `CheckoutInput.customer.address` string contract.

**Architecture:** A dependency-free generator converts a checked-in, normalized Decision 19/2025/QD-TTg source snapshot into deterministic JSON. A browser-safe typed adapter and repository-native ARIA comboboxes keep province/commune codes authoritative in React state; `createCheckoutInput()` resolves those codes and composes the existing address string only at submit time.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod 4, Tailwind CSS, Vitest with file-scoped jsdom, Playwright, Node/tsx for deterministic generation.

**Spec:** `docs/superpowers/specs/2026-11-05-delivn-structured-vietnam-address-design.md`

## Global Constraints

- Model exactly two administrative levels: province and commune. Do not add a district field, district data, or district text.
- Use the official Decision 19/2025/QD-TTg snapshot: 34 province-level units and 3,321 commune-level units, effective 2025-07-01.
- Store administrative codes as strings and preserve leading zeroes; codes, not input labels, are canonical form state.
- A canonical code changes only through committing an offered option. Editing a committed label clears its code immediately.
- Changing province clears commune code, commune query, and stale commune validation state before another commune can be selected.
- Keep `CheckoutInput`, `checkoutSchema`, POST `/api/checkout`, order storage, database schema, and migrations unchanged.
- Compose `{addressDetail}, {communeName}, {provinceName}, Việt Nam` only inside the browser-safe checkout-input boundary.
- Add no runtime API and no package dependency. The generated snapshot is checked in and carries official provenance.
- Keep address/customer PII in component memory only; never persist or log it.
- Preserve current consent, payment, bank-transfer placeholder, cart reconciliation, submission, and error behavior.
- Keep Vitest's global environment Node; use `// @vitest-environment jsdom` only in component tests.
- Preserve the dirty worktree and unrelated prior compliance work. Do not commit, push, merge, tag, reset, or clean.

## Review Focus

- A user edits a previously committed label into arbitrary text: the canonical code must clear immediately and submission must fail; Tasks 3 and 5 pin this behavior.
- A user types a matching or no-result string and presses Enter without navigating to an option: no value may commit; Task 3 tests both cases.
- Source rows arrive in a different order or the generator is run on Windows versus CI: generated ordering and LF-serialized bytes remain deterministic; Task 1 verifies shuffled input and checked-in output equality.
- A stale commune code is injected after province changes: UI reset and submit-time relationship validation both reject it; Tasks 4 and 5 cover both boundaries.
- Long official names plus address detail approach the 500-character server limit: the frontend detail cap remains provably safe for every checked-in province/commune pair; Task 4 tests the complete dataset.

---

### Task 1: Deterministic official dataset pipeline and provenance

**Files:**
- Create: `data/official/decision-19-2025-administrative-units.tsv`
- Create: `scripts/generate-vietnam-administrative-units.ts`
- Create: `src/data/vietnam-administrative-units-generation.test.ts`
- Create: `src/data/vietnam-administrative-units.generated.json`
- Create: `docs/compliance/address-data-source.md`
- Create: `.gitattributes`
- Modify: `package.json`

**Interfaces:**
- Source TSV columns: `level`, `code`, `name`, `provinceCode`, `type`; province rows have blank `provinceCode`, commune rows carry their canonical two-digit parent code, and no district rows exist.
- Produces `parseAdministrativeSourceTsv(source: string): AdministrativeSourceRow[]`, `buildAdministrativeDataset(rows: readonly AdministrativeSourceRow[]): VietnamAdministrativeDataset`, and `serializeAdministrativeDataset(dataset: VietnamAdministrativeDataset): string` from the generator module.
- Produces package script `data:generate:vn-address` invoking the generator with `tsx`.
- Produces stable JSON ordered by ascending fixed-width province code, then communes by ascending `provinceCode` and ascending fixed-width commune code, with fixed property order, two-space indentation, and one LF terminator.
- Consumed by Task 2's typed browser adapter.

- [ ] **Step 1: Add failing generator tests.** Use a small shuffled inline TSV fixture to assert strict header/row parsing, leading-zero preservation, rejection of district/unknown levels and malformed rows, identical serialization across repeated runs, and canonical output ordering independent of source row order. Add an assertion that the generated repository JSON exactly equals `serializeAdministrativeDataset(buildAdministrativeDataset(parseAdministrativeSourceTsv(officialTsv)))`.
- [ ] **Step 2: Run `npm run test:run -- src/data/vietnam-administrative-units-generation.test.ts`.** Expect RED because the source, generator, and output do not exist.
- [ ] **Step 3: Implement the dependency-free parser, validator, sorter, serializer, and CLI.** Use Node built-ins only. Reject duplicate codes, invalid fixed-width codes, blank names, invalid types, missing parents, parent mismatches, unexpected columns, and any level other than `province` or `commune`. Do not silently repair source data.
- [ ] **Step 4: Add path-specific `.gitattributes` LF rules for the official TSV and generated JSON, then add `data:generate:vn-address` to `package.json`.** Do not change package dependencies or the lockfile.
- [ ] **Step 5: Transcribe/extract the official coded appendices into the normalized TSV, preserving official names/codes/types, then generate the JSON through the package script.** The full-source validator must require exactly 34 provinces and 3,321 communes for this Decision 19 snapshot.
- [ ] **Step 6: Write `docs/compliance/address-data-source.md`.** Record the Government decision URL, NSO appendix URL, decision/issue/effective dates, extraction date, normalized TSV columns, transformation and ordering rules, expected counts, checksum/regeneration command, review spot checks, and the deliberate absence of districts.
- [ ] **Step 7: Run `npm run data:generate:vn-address` twice and verify `git diff --exit-code -- src/data/vietnam-administrative-units.generated.json` after the first generated result is staged or byte-compared from a temporary copy.** Expect no second-run change.
- [ ] **Step 8: Re-run the focused generator test.** Expect all deterministic-generation, ordering, strictness, and checked-in-output assertions to pass.

### Task 2: Browser-safe typed administrative-data adapter

**Files:**
- Create: `src/data/vietnam-administrative-units.ts`
- Create: `src/data/vietnam-administrative-units.test.ts`

**Interfaces:**
- Produces `type ProvinceAdministrativeUnit`, `type CommuneAdministrativeUnit`, and `type AdministrativeOption = { code: string; name: string }`.
- Produces `VIETNAM_ADMINISTRATIVE_DATA_METADATA`, `VIETNAM_PROVINCES`, and `VIETNAM_COMMUNES` as readonly values.
- Produces `getProvinceByCode(code: string): ProvinceAdministrativeUnit | undefined`, `getCommuneByCode(code: string): CommuneAdministrativeUnit | undefined`, `getCommunesByProvinceCode(provinceCode: string): readonly CommuneAdministrativeUnit[]`, and `isCommuneInProvince(communeCode: string, provinceCode: string): boolean`.
- Produces `normalizeVietnameseSearchText(value: string): string` and `searchAdministrativeOptions(options: readonly AdministrativeOption[], query: string): readonly AdministrativeOption[]`.
- Consumed by Tasks 3–5; imports no Node, server, database, repository, or checkout-service module.

- [ ] **Step 1: Add failing Node tests for the official snapshot.** Assert metadata decision/effective date, exact 34/3,321 counts, two-/five-digit string formats, unique codes, valid parents, allowed types (`tỉnh`, `thành phố`, `phường`, `xã`, `đặc khu`), presence of every allowed type, and absence of `districts`/`districtCode`.
- [ ] **Step 2: Add failing behavior tests.** Assert lookups, province-filtered communes, valid/invalid pair checks, case-insensitive search, accent-insensitive search including `đ`/`d`, whitespace normalization, empty-query full ordering, and no mutation of canonical arrays.
- [ ] **Step 3: Run `npm run test:run -- src/data/vietnam-administrative-units.test.ts`.** Expect RED because the adapter does not exist.
- [ ] **Step 4: Implement the typed adapter over the generated JSON.** Build lookup maps and per-province arrays once at module initialization; expose readonly data and pure search helpers without adding a client/server directive or runtime fetch.
- [ ] **Step 5: Re-run the focused adapter tests.** Expect all dataset and search assertions to pass.

### Task 3: Repository-native ARIA administrative combobox

**Files:**
- Create: `src/components/checkout/AdministrativeCombobox.tsx`
- Create: `src/components/checkout/AdministrativeCombobox.test.ts`

**Interfaces:**
- Consumes `AdministrativeOption` and `searchAdministrativeOptions()` from Task 2.
- Produces `AdministrativeCombobox(props: AdministrativeComboboxProps): React.JSX.Element` where props include `id`, `label`, `value`, `options`, `onValueChange(code: string)`, optional `disabled`, `required`, `placeholder`, and `error`.
- The visible query is component-local presentation state; `value` is the only canonical selection and is always an offered code or `""`.
- Selection commits through one internal option-commit path shared by keyboard and pointer/touch events.

- [ ] **Step 1: Add failing file-scoped jsdom tests for semantics.** Assert a visible associated label; input `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; popup `role="listbox"`; results `role="option"`; linked error semantics; required and disabled states.
- [ ] **Step 2: Add failing interaction tests.** Assert accent-insensitive filtering; ArrowDown/ArrowUp/Home/End active navigation; Enter commits only the active offered option; Escape closes; pointer selection uses the same canonical code; committed `value` updates the displayed official label; externally clearing `value` clears the query.
- [ ] **Step 3: Add the explicit canonicality regressions.** Commit an option, edit one character, and assert `onValueChange("")` fires immediately and the old code is no longer selected. Separately type raw text that matches results but do not navigate, press Enter, and assert no code commits; repeat with a no-result string and assert no code commits and the no-results message remains available.
- [ ] **Step 4: Run `npm run test:run -- src/components/checkout/AdministrativeCombobox.test.ts`.** Expect RED because the component does not exist.
- [ ] **Step 5: Implement the smallest accessible combobox.** Reset active index to `-1` whenever query text changes, so typing plus Enter cannot implicitly choose the first result. Use `useId`/stable IDs, keep the popup within its field and viewport with vertical scrolling, and use existing DELIVN border/focus/touch-target classes with reduced-motion-safe transitions.
- [ ] **Step 6: Re-run the focused component tests.** Expect all semantic, keyboard, pointer, disabled, error, and canonicality assertions to pass.

### Task 4: Structured checkout values and canonical address composition

**Files:**
- Modify: `src/lib/checkout/checkout-input.ts`
- Modify: `src/lib/checkout/checkout-input.test.ts`

**Interfaces:**
- Changes frontend-only `CheckoutFormValues`: remove `address`; add `provinceCode`, `communeCode`, and `addressDetail`.
- Changes `CheckoutFieldName` accordingly while retaining `name`, `phone`, `email`, `note`, and `paymentMethod`.
- Produces `normalizeAddressDetail(value: string): string`, `composeCustomerAddress(addressDetail: string, communeName: string, provinceName: string): string`, and frontend constant `MAX_ADDRESS_DETAIL_LENGTH`.
- `createCheckoutInput(values, items)` continues producing the unchanged canonical `CheckoutInputResult` and invokes the unchanged shared `checkoutSchema` after composition.

- [ ] **Step 1: Convert existing fixtures to canonical codes and add failing validation tests.** Cover missing/unknown province, missing/unknown commune, mismatched commune/province, blank/whitespace-only detail, over-limit detail, and localized errors on `provinceCode`, `communeCode`, and `addressDetail`.
- [ ] **Step 2: Add failing normalization/composition tests.** Assert repeated whitespace collapses, case and punctuation remain, output is exactly `{detail}, {official commune}, {official province}, Việt Nam`, no district text is inserted, optional email/note and phone normalization remain unchanged, and the payload still contains only canonical `CheckoutInput` fields plus cart `variantId`/`quantity`.
- [ ] **Step 3: Add the complete-dataset length proof.** For every commune and its parent, assert `composeCustomerAddress("x".repeat(MAX_ADDRESS_DETAIL_LENGTH), commune.name, province.name).length <= 500`; assert the next character is rejected by frontend validation.
- [ ] **Step 4: Run `npm run test:run -- src/lib/checkout/checkout-input.test.ts`.** Expect RED against the old free-text `address` model.
- [ ] **Step 5: Implement structured validation and composition.** Resolve both codes from Task 2, independently verify their relationship, normalize detail, merge structured errors with existing checkout-schema errors, and map any final `customer.address` schema failure back to `addressDetail`. Keep the shared contract/schema and backend untouched.
- [ ] **Step 6: Re-run the focused checkout-input tests.** Expect all old commercial-trust-boundary tests and new address tests to pass.

### Task 5: Checkout state, atomic province reset, and form integration

**Files:**
- Modify: `src/components/checkout/CheckoutClient.tsx`
- Modify: `src/components/checkout/CheckoutForm.tsx`
- Modify: `src/components/checkout/CheckoutClient.test.ts`

**Interfaces:**
- Consumes Task 2 data/lookups, Task 3 `AdministrativeCombobox`, and Task 4 structured `CheckoutFormValues`.
- `CheckoutClient` remains owner of all customer/address state. Its province transition sets the new province code, clears commune code when the province changes, and clears province/commune errors in one React state transition path.
- `CheckoutForm` receives the existing generic field callback plus explicit canonical province/commune callbacks if needed to keep the reset atomic; it passes only `getCommunesByProvinceCode(values.provinceCode)` to the commune combobox.
- POST payload and `CheckoutInput` remain unchanged except that `customer.address` is now the composed string.

- [ ] **Step 1: Update the jsdom form helper to select official options through keyboard/pointer interaction and enter only `addressDetail`; do not write canonical codes directly in tests intended to prove user behavior.**
- [ ] **Step 2: Add failing render/ARIA tests.** Assert province then commune controls, absence of a district control and old free-text `address`, disabled commune before province selection, official filtered commune choices after selection, full-width detail input, existing payment cards/consent, and no unsupported payment changes.
- [ ] **Step 3: Add failing reset/canonicality tests.** Select province and commune, change province, and assert commune code/query/error clear and the control requires a fresh selection. Commit a province, edit its label, and assert submit is blocked with the province error. Type raw/no-result text and press Enter, and assert submit remains blocked and fetch is never called.
- [ ] **Step 4: Add failing submission/privacy tests.** Assert the exact POST body contains the composed official address and no province/commune code, raw administrative query, district, snapshot commercial data, or consent field. Assert localStorage, sessionStorage, and URL contain no customer/address values.
- [ ] **Step 5: Run `npm run test:run -- src/components/checkout/CheckoutClient.test.ts`.** Expect RED against the old textarea and state model.
- [ ] **Step 6: Implement structured initial state and atomic update handlers in `CheckoutClient`; render the two comboboxes and address-detail textarea in `CheckoutForm`.** Keep name full-width, phone/email paired, province/commune paired from `sm`, and detail/note full-width. Preserve submission guards, focus management, consent, payment UI, success/error flows, and bank-transfer placeholder verbatim.
- [ ] **Step 7: Re-run the focused checkout client tests.** Expect all existing F4/compliance behavior and new structured-address behavior to pass.

### Task 6: Guarded customer journey and responsive checkout QA

**Files:**
- Modify: `e2e/support/commerce-flow.ts`
- Modify: `e2e/commerce-happy-path.spec.ts`
- Modify: `e2e/customer-sales-journey.spec.ts`
- Modify: `e2e/storefront-responsive.spec.ts`
- Modify only if its shared helper expectations require it: `e2e/compliance.spec.ts`

**Interfaces:**
- Changes `E2E_CUSTOMER` to include official `provinceCode`/label, official `communeCode`/label, `addressDetail`, and expected composed `address`; the database assertion continues checking the existing stored text column.
- `fillCheckoutDetails(page, note?)` selects province and commune through visible combobox behavior, fills address detail, and never injects React state or calls a backend address API.
- Produces review artifacts `checkout-address-desktop-1440.png` and `checkout-address-mobile-390.png` under Playwright's ignored test-results output.

- [ ] **Step 1: Update the E2E helper and add assertions that selecting the province enables the commune control, changing province clears commune, and the final chosen official pair is visibly committed before submit.**
- [ ] **Step 2: Update the real checkout journey's expected stored address to the exact composed string and preserve its HTTP 201, authoritative totals, consent, payment, inventory, and runtime-monitor assertions.**
- [ ] **Step 3: Extend responsive coverage at 1440, 1024, 768, and 390.** Assert province/commune/detail order, no district label, touch-usable controls, popup containment, no horizontal overflow, and capture the two named address screenshots at 1440 and 390.
- [ ] **Step 4: Run `npm run test:e2e -- e2e/commerce-happy-path.spec.ts e2e/customer-sales-journey.spec.ts e2e/storefront-responsive.spec.ts e2e/compliance.spec.ts`.** Expect guarded live checkout to return 201 and the database address snapshot to equal the composed address. If the guarded DB/commercial fixture is unavailable, report the environment limitation without adding runtime fallback data.

### Task 7: Full regression, dataset audit, and delivery review

**Files:**
- Modify only files required by verified failures, using a focused RED→GREEN test before each code correction.

**Interfaces:**
- Consumes Tasks 1–6.
- Produces a review-ready, uncommitted structured-address change set with no backend or schema drift.

- [ ] **Step 1: Run all focused tests:** generator, adapter, combobox, checkout-input, and CheckoutClient. Record exact pass counts.
- [ ] **Step 2: Run `npm run data:generate:vn-address` and verify the generated JSON is unchanged.** Reconfirm 34/3,321 counts, unique fixed-width codes, valid parent pairs, deterministic ordering, and no district key/field.
- [ ] **Step 3: Run `npm run test:run`.** Expect all existing Node/backend tests and file-scoped jsdom tests to pass.
- [ ] **Step 4: Run `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check`.** Expect exit 0 for each; confirm Next build does not query PostgreSQL for this static dataset.
- [ ] **Step 5: Run the guarded Playwright command from Task 6 when the approved E2E database is available.** Review desktop/mobile screenshots for popup clipping, label hierarchy, stacking, focus/selected states, and overflow.
- [ ] **Step 6: Perform static boundary searches.** Confirm no `district` field, no new dependency, no runtime address fetch, no server/database import in client code, no changed `CheckoutInput`/schema/migration, no PII persistence/logging, and no modification to payment or commercial semantics.
- [ ] **Step 7: Self-review the full diff against the approved spec and this plan.** Correct only verified issues through focused tests, then return `git status --short`, `git diff --stat`, current spec/plan SHA-256 values, and validation results without committing or cleaning the worktree.

## Self-review

- **Spec coverage:** Official provenance, deterministic data, typed adapter, canonical code-backed comboboxes, atomic province reset, submit-time composition, privacy, accessibility, responsive layout, E2E persistence proof, and protected scope each map to a task.
- **Requested regressions:** Task 3 explicitly proves label editing clears the code and Enter on matching raw/no-result text cannot commit; Task 1 proves deterministic generation and ordering independent of input order and repeated runs.
- **Type consistency:** Task 2 owns administrative unit/option types; Task 3 consumes options; Tasks 4–5 use code strings only; the final boundary still returns the existing `CheckoutInput`.
- **Trust consistency:** The component never trusts labels, filtered UI is not the pair-validation boundary, and the server continues receiving only a composed address string plus its unchanged canonical checkout fields.
- **Review focus coverage:** Each of the five high-risk behaviors has an owning task and explicit test.
- **Proportion:** The plan fixes file ownership, interfaces, assertions, commands, and ordering without transcribing component implementations.
- **User override:** The generic planning workflow's commit steps are omitted because this worktree must remain uncommitted for review.
