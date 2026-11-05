# DELIVN Ecommerce Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add truthful, accessible owner/policy scaffolding and an explicit checkout terms UX prerequisite for owner/legal review, while documenting why DELIVN is not yet ready for notification submission or production launch.

**Architecture:** Static App Router Server Component pages consume one browser-safe legal content module and one shared editorial page shell. The existing client checkout gains a local, non-persisted consent prerequisite; canonical checkout payload, backend commerce logic, and database schema remain unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, jsdom file-scoped tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-31-delivn-ecommerce-compliance-design.md`

## Global Constraints

- Vietnamese, consumer-readable content only; never claim final legal compliance or authority acceptance.
- Use only the supplied public company information and exclude all sensitive certificate data.
- Do not invent shipping, tax, packaging, return/refund, banking, email, warranty, invoice, retention, processor, analytics, marketing, or cross-border facts.
- Never show a Bộ Công Thương notification/approval badge before real confirmation.
- Use Luật Thương mại điện tử 122/2025/QH15 and Nghị định 248/2026/NĐ-CP as the primary current framework; treat Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP, and legacy portal guidance as historical/transition references.
- Treat the consent checkbox as a client UX gate, not durable legal evidence. Stop for schema approval if durable evidence is required.
- Record current-law blockers for shipping agreement/timing, itemized tax/shipping/other costs, buyer account/order access, and catalog/PDP product-label, quality-information, and accessibility review.
- Consent is unchecked by default, local component memory only, required before POST, and excluded from `CheckoutInput` and persistence.
- No database schema/migration, backend checkout, inventory, order, ProductDTO, price, cart-persistence, F5 isolation, Three/GLB/GSAP-homepage, or catalog/PDP visual changes.
- Keep the footer’s established visual language and make only the compliance navigation/data refinement.
- Do not commit, push, merge, or tag compliance work.
- Work only in the isolated `feature/ecommerce-legal-compliance` worktree; do not modify the parallel storefront UI checkout.

## Review Focus

- An unchecked terms control, including rapid Enter submission, must never call `/api/checkout`; Task 3 tests it at the component boundary.
- Acceptance must not leak into request JSON or browser storage; Task 3 asserts the exact payload and storage/URL absence.
- Long Vietnamese company/policy copy at 390px must not create horizontal overflow; Task 5 covers responsive routes.
- Policy content must not imply zero development shipping is free shipping or invent banking/return terms; Tasks 1 and 4 use forbidden-claim assertions.
- Footer/legal content must not publish certificate personal identifiers or a fake authority badge; Tasks 1 and 2 assert absence.
- Policy pages must visibly distinguish owner-confirmed facts from pending business inputs; neutral prose must not masquerade as a complete operative policy.

---

### Task 1: Verified legal content and seven public routes

**Files:**
- Create: `src/data/legal.ts`
- Create: `src/components/legal/LegalPage.tsx`
- Create: `src/components/legal/LegalPage.test.tsx`
- Create: `src/app/(storefront)/lien-he/page.tsx`
- Create: `src/app/(storefront)/thong-tin-doanh-nghiep/page.tsx`
- Create: `src/app/(storefront)/dieu-khoan-giao-dich/page.tsx`
- Create: `src/app/(storefront)/chinh-sach-bao-mat/page.tsx`
- Create: `src/app/(storefront)/chinh-sach-thanh-toan/page.tsx`
- Create: `src/app/(storefront)/chinh-sach-van-chuyen/page.tsx`
- Create: `src/app/(storefront)/chinh-sach-doi-tra-hoan-tien/page.tsx`

**Interfaces:**
- Produces: `COMPANY_INFORMATION`, `LEGAL_ROUTE_LINKS`, `LEGAL_PAGES`, `type LegalPageDefinition` in `src/data/legal.ts`.
- Produces: `LegalPage({ page }: { page: LegalPageDefinition }): React.JSX.Element`.
- Consumed by: footer in Task 2 and checkout policy links in Task 3.

- [ ] Write failing rendering tests that assert all seven definitions/routes, verified legal name, enterprise number `3703119501`, current Hồ Chí Minh City office, phone, registration dates, English/abbreviated names, representative/title, policy navigation, and absence of `Bình Dương`, fake email, personal ID labels, and `Đã thông báo Bộ Công Thương`.
- [ ] Run `npm run test:run -- src/components/legal/LegalPage.test.tsx`; expect missing-module/route failures.
- [ ] Implement the pure content module, shared semantic editorial shell, and seven static pages with route-specific `Metadata`.
- [ ] Keep unknown business rules explicitly pending rather than manufacturing promises; shipping, returns/refunds, tax/charges, and bank-transfer pages must display a prominent owner-confirmation notice.
- [ ] Re-run the focused test; expect all assertions to pass.

### Task 2: Footer owner identity and legal navigation

**Files:**
- Create: `src/components/layout/Footer.test.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/data/content/home.ts`

**Interfaces:**
- Consumes: `COMPANY_INFORMATION` and `LEGAL_ROUTE_LINKS` from Task 1.
- Produces: homepage-visible legal identity and all policy links on every storefront page.

- [ ] Write failing server-render tests for legal name, enterprise number, current address, phone, `/thong-tin-doanh-nghiep`, `/lien-he`, and all five policy links; assert no old address, sensitive identifier, or authority badge.
- [ ] Run `npm run test:run -- src/components/layout/Footer.test.tsx`; expect missing policy links.
- [ ] Refactor footer content to reuse verified company constants and render compact `THÔNG TIN` and `CHÍNH SÁCH` groups without changing its GSAP behavior or overall visual structure.
- [ ] Re-run the focused test; expect pass.

### Task 3: Explicit checkout terms consent

**Files:**
- Modify: `src/components/checkout/CheckoutClient.tsx`
- Modify: `src/components/checkout/CheckoutForm.tsx`
- Modify: `src/components/checkout/CheckoutClient.test.ts`

**Interfaces:**
- Extends `CheckoutFormProps` with `termsAccepted: boolean`, `termsError?: string`, and `onTermsChange(accepted: boolean): void`.
- `CheckoutClient` owns consent state only; `createCheckoutInput(values, items)` remains unchanged.
- Consumes legal route paths from Task 1 for visible links.

- [ ] Add failing jsdom tests: consent checkbox exists and is unchecked; submit with otherwise-valid data makes zero fetch calls and shows/focuses a linked error; checking through the DOM enables the normal POST; payload remains exactly canonical and excludes consent; localStorage/sessionStorage/URL contain no consent or PII.
- [ ] Run `npm run test:run -- src/components/checkout/CheckoutClient.test.ts`; expect failures because consent UI/guard is absent.
- [ ] Add local consent/error state and block `handleSubmit` before payload creation/POST when unchecked while preserving the synchronous in-flight guard and all existing error/success/reconciliation behavior. Release the submitting ref on this blocked path, focus the error summary, and only then allow a later accepted submission to create `CheckoutInput`.
- [ ] Render a native required checkbox with label, visible focus, `aria-invalid`, `aria-describedby`, and links to transaction/privacy/payment/shipping/return policies.
- [ ] Re-run the focused test; expect all checkout tests pass.

### Task 4: Compliance audit and operational blockers

**Files:**
- Create: `docs/compliance/ecommerce-compliance-audit.md`
- Create: `docs/compliance/business-inputs-required.md`
- Create: `docs/compliance/notification-screenshot-checklist.md`
- Modify: `src/components/checkout/CheckoutSummary.tsx`
- Test: extend `src/components/checkout/CheckoutClient.test.ts`

**Interfaces:**
- Consumes official-source URLs and evidence routes from Task 1.
- Produces the owner/developer submission checklist and explicit authority/production blocker register.

- [ ] Add a failing checkout-summary assertion for truthful snapshot/server-confirmation wording and absence of “Miễn phí vận chuyển”.
- [ ] Run the checkout focused test and observe the wording failure.
- [ ] Update summary copy minimally; do not state tax, packaging, shipping, or total facts that are not established.
- [ ] Write the audit matrix with official source title/URL, current state, implementation, blocker, and evidence route. Organize it around current-law Articles 11–16; keep the older decrees and legacy notification workflow as historical/transition references only.
- [ ] Record the owner-supplied certificate as a sanitized provenance source (second amendment, 18/12/2025) without committing the certificate or private fields.
- [ ] Record explicit blockers for delivery-method/time agreement, itemized product/tax/shipping/other costs, post-purchase account/order access, and a parallel-UI handoff for product-label, quality-information, and accessibility review.
- [ ] Record each unknown business fact with question, reason, affected route, and classification: authority-submission blocker, production-launch blocker, or optional later input.
- [ ] Write a screenshot checklist covering homepage/footer, catalog/PDP, policies, checkout consent, contact, and company information; do not create submission evidence.
- [ ] Re-run focused checkout/legal/footer tests; expect pass.

### Task 5: Customer journey and responsive compliance QA

**Files:**
- Modify: `e2e/support/commerce-flow.ts`
- Create: `e2e/compliance.spec.ts`

**Interfaces:**
- Consumes: accessible terms link and checkbox from Task 3.
- Produces: user-level proof that consent is read/opened and checked before the existing real checkout request.

- [ ] Update the E2E helper to check the terms checkbox through its accessible label after filling canonical customer/payment fields.
- [ ] Add a dedicated compliance journey that opens the transaction-terms link, asserts the terms heading, returns, checks consent, and submits through the existing guarded checkout path.
- [ ] In the same dedicated spec, add responsive assertions at 1440, 768, and 390 for `/lien-he`, one representative policy page, footer legal links, and checkout consent with no horizontal overflow.
- [ ] Run `npm run test:e2e -- e2e/compliance.spec.ts`; expect the HTTP 201 journey and responsive checks to pass against guarded `delivn_e2e` when valid commercial data exists.

### Task 6: Full regression, static audit, and review

**Files:**
- Modify only files required by verified Critical/Important review findings, using RED→GREEN tests.

**Interfaces:**
- Consumes all prior tasks.
- Produces a review-ready uncommitted compliance branch.

- [ ] Run focused compliance tests and record exact counts.
- [ ] Run `npm run test:run`; expect all existing and new Vitest tests pass.
- [ ] Run `npx tsc --noEmit`; expect exit 0.
- [ ] Run `npm run lint`; expect zero warnings/errors.
- [ ] Run `npm run build`; expect exit 0 and static legal routes in the route table.
- [ ] Run `git diff --check`; expect exit 0.
- [ ] Search rendered/source content for the old Bình Dương address, sensitive personal identifiers, fake email/bank/QR/free-shipping/return promises, and unapproved Bộ Công Thương status; expect none.
- [ ] Run an independent whole-branch review against the spec/plan and address only Critical/Important findings with tests.
- [ ] Return `git status --short` and `git diff --stat`; do not commit compliance work.

## Self-review

- Spec coverage: seven routes, footer, consent, price/checkout disclosure, official-source audit, blockers, screenshot checklist, E2E, responsiveness, privacy, and protected scope each map to a task.
- Type consistency: Task 1 owns legal data/interfaces; Tasks 2–3 consume them without server imports. Consent never extends `CheckoutFormValues`, `CheckoutInput`, or schema types.
- TDD: every product-code change has a focused failing test before implementation; documentation is verified through content/static audits.
- Proportion: the plan fixes interfaces, assertions, and commands without transcribing component bodies.
- User override: compliance work remains uncommitted despite the generic planning workflow’s usual per-task commit step.

---

## 2026-11-01 approved continuation: storefront sync and contact/social hub

The original Tasks 1–6 were implemented on the former base and preserved during the approved fast-forward to `e48d30d6181a1b50628a231674453ae799223dbc`. The following tasks complete the post-sync requirements. They remain uncommitted for owner review.

### Task 7: Mandatory consent in the direct primary journey

**Files:**
- Modify: `e2e/support/commerce-flow.ts`
- Modify: `e2e/customer-sales-journey.spec.ts`
- Modify: `src/components/checkout/CheckoutClient.test.ts`

**Dependencies:** Existing consent UI, direct catalog purchase flow, guarded E2E database.

**Behavior and invariants:**
- Split canonical checkout field filling from explicit consent acceptance while retaining a convenience helper for other specs.
- Primary journey proves checkbox presence, visibility and unchecked default; an unchecked submit sends zero checkout POSTs; explicit acceptance then permits exactly the normal request and HTTP 201 success.
- Rapid unchecked click/Enter-equivalent submissions remain request-free. Consent stays outside `CheckoutInput`, storage and URL state.

**TDD / verification:**
- Add the rapid-unchecked component regression and direct-journey assertions before helper changes.
- Run `npm run test:run -- src/components/checkout/CheckoutClient.test.ts`.
- Run the guarded primary Playwright spec after unit tests and E2E setup are available.

### Task 8: Typed contact data, exact brand assets and contact hub

**Files:**
- Create: `src/data/contact.ts`
- Create: `src/components/contact/ContactHub.tsx`
- Create: `src/components/contact/ContactHub.test.ts`
- Create: `public/brands/social/youtube.png`
- Create: `public/brands/social/instagram.svg`
- Create: `public/brands/social/facebook.png`
- Create: `public/brands/social/tiktok.png`
- Create: `public/brands/social/shopee.png`
- Create: `docs/compliance/social-brand-assets.md`
- Modify: `src/app/(storefront)/lien-he/page.tsx`

**Dependencies:** `COMPANY_INFORMATION`, `LEGAL_ROUTE_LINKS`, platform-owned asset packs/CDN files.

**Behavior and invariants:**
- A discriminated active/pending channel configuration is the only source of social/shop URLs and mark paths.
- Exact approved YouTube, Instagram and Facebook URLs render as safe external links.
- TikTok Shop and Shopee render as polished, non-interactive `ĐANG CẬP NHẬT` cards with no `href`, pointer affordance or official-store claim.
- Company facts come from `COMPANY_INFORMATION`; no email, old Bình Dương address, certificate personal identifiers or contact form appears.
- Assets retain official geometry/aspect ratio and have documented source provenance; no icon dependency or improvised glyph is added.

**TDD / verification:**
- Write and run the contact rendering/config test first; expect missing modules.
- Implement the smallest typed config, Server Component and page composition.
- Run `npm run test:run -- src/components/contact/ContactHub.test.ts`.

### Task 9: Metadata and business-input register

**Files:**
- Create: `src/components/legal/LegalMetadata.test.ts`
- Modify: all seven compliance route `page.tsx` metadata exports
- Modify: `docs/compliance/business-inputs-required.md`

**Dependencies:** Root `%s | DELIVN` template and the compliance route metadata.

**Behavior and invariants:**
- Composing each route title with the root template yields one, and only one, DELIVN suffix.
- Keep `BUSINESS_INPUT_REQUIRED_CONTACT_EMAIL`; add pending `TIKTOK_SHOP_URL` and `SHOPEE_STORE_URL` as production-launch inputs without invented values.

**TDD / verification:**
- Add the metadata composition test first and observe the duplicate-title failure.
- Remove only manual `| DELIVN` suffixes from compliance routes.
- Run `npm run test:run -- src/components/legal/LegalMetadata.test.ts` and static document checks.

### Task 10: Responsive contact/E2E coverage, regression and final review

**Files:**
- Modify: `e2e/compliance.spec.ts`
- Modify only files required by verified Critical/Important findings, each through RED→GREEN coverage.

**Dependencies:** Tasks 7–9 and the existing guarded Playwright environment.

**Behavior and invariants:**
- Validate contact content, exact active links, pending non-links, footer and no horizontal overflow at 1440, 1024, 768 and 390.
- Save ignored review artifacts `test-results/contact-desktop-1440.png` and `test-results/contact-mobile-390.png`.
- Preserve direct catalog purchase and mandatory consent in `customer-sales-journey.spec.ts`; run `storefront-product-ux.spec.ts` to guard the approved product UI.

**Verification commands:**
- focused legal/contact/checkout Vitest files;
- `npm run test:run`;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`;
- `git diff --check`;
- guarded Playwright: `e2e/compliance.spec.ts`, `e2e/customer-sales-journey.spec.ts`, `e2e/storefront-product-ux.spec.ts`;
- independent whole-branch review, then a single RED→GREEN fix pass only for Critical/Important findings.

## Addendum self-review

- The direct no-PDP storefront flow remains the primary journey.
- Mandatory consent is proven at component and browser boundaries; no conditional skip remains.
- Active and pending channel types prevent accidental placeholder links.
- Platform marks come from platform-owned sources and do not add a dependency.
- Root metadata composition is tested rather than inspected informally.
- Contact email, marketplace URLs and all existing operational blockers remain explicit inputs instead of fabricated facts.
- No database, backend commerce, product UI, product price, homepage visual or F5 isolation work is introduced.
