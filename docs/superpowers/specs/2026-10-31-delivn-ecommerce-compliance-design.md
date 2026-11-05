# DELIVN ecommerce legal/compliance design

**Date:** 2026-10-31
**Status:** Approved execution brief; implementation for compliance review, not a legal-compliance certification

## Intent

Prepare `delivn.com.vn`, a website where CÔNG TY TNHH CÀ PHÊ DELIVN sells its own packaged coffee, for Vietnamese sales-ecommerce website notification and pre-deployment review. Customers and reviewers must be able to identify the seller, find contact information and policies, understand the current ordering/payment flow, and explicitly accept transaction terms before an order request is sent.

## Classification and current legal baseline

DELIVN is a **website thương mại điện tử bán hàng** operated by the seller of the goods, not an intermediary marketplace, auction site, or ecommerce-service platform. The primary current framework is Luật Thương mại điện tử 122/2025/QH15 and Nghị định 248/2026/NĐ-CP, both effective 2026-07-01. The implementation and audit matrix are organized around the current-law duties relevant to DELIVN, especially Articles 11–16. Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP, and the existing `online.gov.vn` notification materials are retained only as historical/transition and portal-procedure references, not as the controlling disclosure checklist.

The current `online.gov.vn` transition notice says previously confirmed websites continue under their existing files until 2027-06-30, while new activity is governed by the 2026 framework. DELIVN has not supplied an existing confirmation, so this pass must not imply grandfathered status or completed notification.

Personal-data disclosures are reviewed against Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 and Nghị định 356/2025/NĐ-CP, effective 2026-01-01. This code pass is **non-deployed technical scaffolding for owner/legal review**. It does not establish notification readiness, final legal acceptance, or production-launch readiness.

## Verified public company information

- Vietnamese legal name: CÔNG TY TNHH CÀ PHÊ DELIVN
- English name: DELIVN COFFEE COMPANY LIMITED
- Abbreviated name: DELIVN COFFEE CO.,LTD
- Enterprise number: 3703119501
- First registration: 07/04/2023
- Latest certificate amendment: 18/12/2025 (second amendment)
- Registered office: Ô 32, Lô H37, Đường NH15, Khu dân cư Ấp 6, Khu phố 1, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam
- Phone: 0961122226
- Legal representative: ĐẶNG VĂN NAM — Giám đốc
- Registration authority: Phòng Đăng ký kinh doanh, Sở Tài chính Thành phố Hồ Chí Minh

Personal identification numbers, birth dates, private residence/contact details, and any other private certificate data are excluded.

Source provenance recorded in the audit: owner-supplied business-registration certificate, second amendment dated 18/12/2025. The certificate file itself and its private fields are not added to the repository.

## Current repository findings

- `/lien-he` and all proposed policy routes are absent.
- Header and footer already link to `/lien-he`, so the link currently returns 404.
- The footer already contains the current Hồ Chí Minh City registered office, company name, enterprise number, and phone, but lacks policy navigation and registration dates/authority context.
- Checkout collects name, phone, optional email, address, optional note, and a supported payment method (`cod` or `bank_transfer`). It has no transaction-terms consent.
- `CheckoutInput` contains only customer fields, payment method, and `{ variantId, quantity }` items. Consent must remain a client prerequisite and must not alter that canonical contract.
- Shipping pricing is explicitly marked `TEMPORARY V1 DEVELOPMENT POLICY` and returns zero. That is not authority to advertise free shipping.
- The current checkout does not let a customer agree to a shipping method or delivery time, does not itemize tax, shipping, and other costs, and the product does not provide a buyer account/order lookup after purchase. These are current-law readiness blockers; they are not solved by neutral copy.
- Product label/quality disclosures and accessibility under the current direct-commerce-platform duties require catalog/PDP review. Those files belong to the parallel storefront UI scope, so this branch records a handoff and does not edit them.
- The product/catalog, checkout, cart, database schema, and transaction service already establish the commercial trust boundary and must remain unchanged except for narrowly scoped compliance copy/navigation and the consent prerequisite.

## Approaches considered

### 1. Dedicated static routes with shared content and a shared page shell — selected

Each legal/customer-service URL has its own static Server Component and metadata. A browser-safe data module owns verified company facts, route definitions, and policy content; a shared `LegalPage` component owns the editorial layout. This gives clean URLs, route-specific metadata, printable/revisitable pages, compact tests, and minimal duplication.

### 2. One dynamic legal route

This reduces files but weakens route-specific typing/metadata, makes accidental slug exposure easier, and is less transparent to authority screenshot review. Rejected.

### 3. Independent hardcoded pages

This is straightforward but duplicates company facts, navigation, visual structure, and policy wording. It increases drift risk when certificate or business information changes. Rejected.

## Frontend architecture

Create:

- `src/data/legal.ts` — pure verified company data, legal route definitions, and conservative Vietnamese policy content.
- `src/components/legal/LegalPage.tsx` — reusable Server Component layout with semantic headings and related-policy navigation.
- Seven route pages under `src/app/(storefront)/`:
  - `/lien-he`
  - `/thong-tin-doanh-nghiep`
  - `/dieu-khoan-giao-dich`
  - `/chinh-sach-bao-mat`
  - `/chinh-sach-thanh-toan`
  - `/chinh-sach-van-chuyen`
  - `/chinh-sach-doi-tra-hoan-tien`

Each page exports static metadata. Pages are Server Components and introduce no animation framework.

Update the existing footer minimally: retain its visual structure and motion behavior, replace its single navigation column with compact information/policy link groups, and continue showing verified owner information directly in homepage HTML. No Bộ Công Thương badge or notification claim is rendered.

## Content boundaries

Pages distinguish verified facts from unresolved operations.

- Contact and company pages contain only supplied public business facts. No email is invented.
- Payment policy lists only COD and bank transfer. It states no bank account, QR, beneficiary, or completion claim; missing operational bank instructions are a blocker.
- Shipping policy does not call the current zero development calculation “free shipping” and makes no carrier, geographic, fee, or timing promise. It prominently identifies the missing owner-approved shipping method, area, fee, and timing as information pending confirmation, not as a complete policy.
- Return/refund policy publishes no acceptance window, eligible reason, return-fee allocation, refund timing, or warranty promise without business confirmation. It prominently identifies these items as pending and must not be treated as launch-ready policy content.
- Privacy policy accurately names checkout data and order-processing purpose. It does not claim marketing, analytics, cloud vendors, cross-border transfers, outside recipients, or retention periods. Unknown retention, processor/recipient, security-operation, and rights-response details are blockers.
- Transaction terms describe the existing cart → checkout → server-validation → order-receipt flow, the authoritative server total, supported payment choices, and truthful order/payment status. Unknown tax, packaging/additional-charge, invoice, cancellation, support, shipping, and return facts remain blockers.

## Checkout consent

`CheckoutClient` owns a `termsAccepted` boolean initialized to `false` and a separate validation error. `CheckoutForm` receives it through props and renders an actual required checkbox with an associated label and links to transaction terms and relevant policies.

Submission behavior:

1. Hydration and cart guards remain first.
2. The synchronous in-flight guard remains authoritative for double-submit protection.
3. If consent is false, no `CheckoutInput` is created and no POST occurs; an accessible visible error is shown and focus moves to the error summary.
4. Checking the box clears its error.
5. Consent is not stored in localStorage/sessionStorage/URL, not sent as a hidden field, and not added to `CheckoutInput`.
6. Existing success/error/uncertain/cart-reconciliation semantics remain unchanged.

This checkbox is a client-side UX prerequisite only; it is not durable legal evidence of consent. Durable consent evidence would require separately approved backend/schema design. If the owner or legal reviewer requires that evidence, implementation must stop with `COMPLIANCE_SCHEMA_CHANGE_REQUIRES_APPROVAL`; this pass does not add it.

## Price and order disclosures

Checkout summary copy will explicitly identify displayed item arithmetic as a cart snapshot and state that server-confirmed product availability and total govern the order. It will not advertise free shipping or claim tax/packaging treatment. The unresolved tax, packaging, shipping, invoice, and additional-charge wording is documented as a production/submission blocker rather than guessed.

The confirmation state continues to say the order was received, uses authoritative returned totals and payment status, and does not claim payment completion or confirmed shipping.

## Documentation

Create:

- `docs/compliance/ecommerce-compliance-audit.md` — official sources, requirement/state/implementation/blocker/evidence route matrix, website classification, and current notification-process notes.
- `docs/compliance/business-inputs-required.md` — each missing business fact, why it matters, affected routes, and whether it blocks authority submission or production.
- `docs/compliance/notification-screenshot-checklist.md` — truthful capture checklist; no fake evidence.

The audit will include official URLs for the governing instruments and `online.gov.vn` guidance and will state “technical scaffolding for compliance review,” never “fully compliant,” “notification ready,” or “production ready.” It will map current-law Articles 11–16, including explicit blockers for delivery agreement/itemized costs/account access and a catalog/PDP handoff for product-label, quality-information, and accessibility review.

## Accessibility and responsive behavior

- Semantic `main` content from the storefront layout, page `h1`, ordered heading hierarchy, readable lists, and real links.
- Legal pages use the existing cream/sand/charcoal/red tokens and editorial spacing, with no Three.js or GSAP-heavy behavior.
- Consent uses a native checkbox, visible focus, explicit label, `required`, `aria-invalid`, `aria-describedby`, and an error message.
- Footer groups wrap into responsive columns.
- Validate at 1440, 768, and 390 pixels with no horizontal overflow.

## Testing

- Static route/page rendering tests cover all seven routes, company identity, enterprise number, current address, metadata-relevant headings, policy links, absence of sensitive identifiers and fake Bộ Công Thương approval.
- Footer tests cover verified current company information and all legal links.
- Checkout component tests cover unchecked default, blocked POST with visible error, successful POST after user acceptance, canonical payload unchanged, and no consent persistence.
- A dedicated compliance Playwright spec opens transaction terms, checks the consent control like a user, receives HTTP 201 through the existing guarded E2E flow, and checks responsive legal/footer/checkout surfaces at 1440, 768, and 390. The shared checkout-filling helper is updated to accept consent; the parallel customer-journey and storefront-responsive specs are otherwise left untouched.

## Protected scope

No database schema/migration, checkout service, inventory reservation, order-number/payment-status semantics, ProductDTO, prices, cart persistence, F5 isolation, homepage art/Three/GLB/GSAP, or catalog/PDP visual redesign. The parallel storefront UI branch and worktree remain untouched.

## Completion status rule

Because shipping, returns/refunds, tax/additional-charge treatment, bank-transfer operations, support email, privacy retention/processors, and related business facts are unconfirmed, implementation can be ready for technical review but final authority submission/production remains `DELIVN_ECOMMERCE_COMPLIANCE_BLOCKED_BUSINESS_INPUT` until the owner supplies and approves those facts.

## 2026-11-01 storefront-sync and contact-hub addendum

This addendum records the approved continuation after the storefront product UI was merged to `main` at `e48d30d6181a1b50628a231674453ae799223dbc`. It supplements rather than replaces the reviewed compliance design above.

### Integration baseline and primary journey

- The compliance branch is fast-forwarded to `e48d30d`; the approved compact `/san-pham` design and direct `MUA NGAY` path remain authoritative.
- The primary journey is homepage → `/san-pham` → product and variant selection → `MUA NGAY` → `/thanh-toan`. No PDP step is restored.
- Checkout consent is mandatory in the primary customer E2E: the checkbox must exist, be visible and initially unchecked; an attempted submit without acceptance must send no `/api/checkout` request; only an explicit check may precede the successful HTTP 201 flow.

### Contact and social hub

`/lien-he` becomes a dedicated Server Component contact hub, while all other reviewed legal routes continue to use `LegalPage`. It consumes `COMPANY_INFORMATION` from `src/data/legal.ts`; company facts are not duplicated into contact JSX.

The hub contains:

1. an editorial `LIÊN HỆ DELIVN` introduction;
2. verified business identity, enterprise number, current Hồ Chí Minh City registered office and `tel:0961122226` hotline;
3. active social cards for the exact approved YouTube, Instagram and Facebook URLs;
4. non-interactive TikTok Shop and Shopee cards labelled `ĐANG CẬP NHẬT` with no invented URL;
5. restrained related legal navigation, without a contact form or invented email address.

Social/shop configuration is a small browser-safe discriminated union. Active entries contain an approved `href` and render as external anchors with `target="_blank"` and `rel="noopener noreferrer"`; pending entries contain no `href` and render as non-interactive content. Accessible names include the platform identity. The layout remains DELIVN cream/sand/charcoal/red, uses a two-column editorial composition at large widths, stacks at mobile widths, and avoids horizontal overflow.

### Platform marks and provenance

No brand-icon dependency is added. Local assets under `public/brands/social/` are selected without geometric modification from current platform-owned sources:

- YouTube Icon asset pack from `brand.youtube` / `www.gstatic.com`;
- Instagram Brand Asset Pack from Meta's Instagram brand-resource page;
- Facebook Brand Asset Pack from Meta's Facebook logo resource page;
- TikTok developer Logo Pack from TikTok's official developer design-guidelines page;
- Shopee marketplace application mark served by Shopee Vietnam's own `shopeemobile.com` CDN.

Asset origin and selected files are documented in `docs/compliance/social-brand-assets.md`. Platform geometry and aspect ratio are preserved; surrounding cards provide DELIVN styling and clear space. The TikTok and Shopee marks identify pending platforms only and do not claim an active or official store.

### Metadata and business-input corrections

The root metadata template remains `%s | DELIVN`. Every compliance route exports a bare route title so the resolved title contains exactly one DELIVN suffix. `docs/compliance/business-inputs-required.md` continues to list `BUSINESS_INPUT_REQUIRED_CONTACT_EMAIL` and adds pending `TIKTOK_SHOP_URL` and `SHOPEE_STORE_URL` as production-launch inputs, not development blockers.

### Addendum verification

- Focused tests cover contact facts, exact active URLs, external-link safety, pending non-links, platform identity/assets, absent email/old address/sensitive certificate data, and composed metadata titles.
- Checkout unit/E2E coverage includes rapid unchecked submission and the primary no-POST-before-consent proof.
- Playwright validates `/lien-he` at 1440, 1024, 768 and 390 pixels and captures `contact-desktop-1440.png` and `contact-mobile-390.png` in ignored test artifacts.
- The protected storefront product UI, product data/prices, backend commerce, schema/migrations, homepage art/motion and F5 isolation remain unchanged.
