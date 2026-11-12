# DELIVN ecommerce compliance audit

**Audit date:** 31/10/2026
**Website:** `delivn.com.vn`
**Status:** technical scaffolding for owner/legal review — **not ready for authority submission or production launch**

This document is an engineering gap analysis, not a legal opinion or a claim of compliance.

## Classification

DELIVN is assessed as a Vietnamese **direct ecommerce platform / website thương mại điện tử bán hàng** operated by the seller of the packaged coffee shown on the site. It is not currently designed as an intermediary marketplace, auction platform, or social-commerce platform.

The primary framework at the audit date is Luật Thương mại điện tử 122/2025/QH15 and Nghị định 248/2026/NĐ-CP, effective 01/07/2026. Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP, and the legacy `online.gov.vn` sales-website notification workflow are recorded only as historical/transition and portal-procedure references.

The owner has not supplied evidence that `delivn.com.vn` was previously notified or confirmed. No grandfathered status, notification status, badge, or authority approval may be displayed.

## Verified owner information

Source provenance: an owner-supplied business-registration certificate, second amendment dated 18/12/2025. The certificate itself is not committed to the repository. Personal identification number, date of birth, private residence, and other private certificate fields are deliberately excluded.

- Legal name: CÔNG TY TNHH CÀ PHÊ DELIVN
- English name: DELIVN COFFEE COMPANY LIMITED
- Abbreviated name: DELIVN COFFEE CO.,LTD
- Enterprise number: 3703119501
- First registration: 07/04/2023
- Latest amendment shown: 18/12/2025
- Registered office: Ô 32, Lô H37, Đường NH15, Khu dân cư Ấp 6, Khu phố 1, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam
- Phone: 0961122226
- Legal representative: ĐẶNG VĂN NAM — Giám đốc
- Registration authority: Phòng Đăng ký kinh doanh, Sở Tài chính Thành phố Hồ Chí Minh

## Official primary sources

| Source | Effective date / purpose | Official URL |
| --- | --- | --- |
| Luật Thương mại điện tử 122/2025/QH15 | Effective 01/07/2026; primary current ecommerce law | https://vanban.chinhphu.vn/?classid=1&docid=216503&pageid=27160&typegroupid=3 |
| Nghị định 248/2026/NĐ-CP | Effective 01/07/2026; implements the current law | https://vanban.chinhphu.vn/?docid=218747&orggroupid=2&pageid=27160 |
| Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 | Effective 01/01/2026; account identity, database sessions, Google sign-in, and account-order linkage now disclosed, while retention and rights operations remain pending business approval | https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup= |
| Nghị định 356/2025/NĐ-CP | Effective 01/01/2026; personal-data implementation | https://vanban.chinhphu.vn/?classid=0&docid=216387&pageid=27160 |
| Nghị định 52/2013/NĐ-CP | Historical ecommerce framework | https://vanban.chinhphu.vn/?classid=1&docid=167457&pageid=27160 |
| Nghị định 85/2021/NĐ-CP | Historical amendment to Nghị định 52 | https://vanban.chinhphu.vn/default.aspx?docid=204191%C2%A0&pageid=27160 |
| Nghị định 146/2025/NĐ-CP | Delegation/administrative-procedure context | https://vanban.chinhphu.vn/?classid=1&docid=213914&pageid=27160&typegroupid=4 |
| Current ecommerce public-service portal | Current portal landing page | https://dichvucong.online.gov.vn/ |
| Sales-website notification workflow | Legacy/currently published process reference; competent authority must confirm post-01/07/2026 use | https://dichvucong.online.gov.vn/Huong-Dan-Sct/QUY-TRINH-THONG-BAO-WEBSITE-TMDT-BAN-HANG-yJkpX0Qpjc?AspxAutoDetectCookieSupport=1 |
| Who must notify | Portal classification reference | https://dichvucong.online.gov.vn/Huong-Dan/Nhung-doi-tuong-nao-phai-tien-hanh-thong-bao-website-mSnQQYbE9l?AspxAutoDetectCookieSupport=1 |
| 2026 transition notice | Explains transition for previously confirmed sites and implementation of the new law | https://dichvucong.online.gov.vn/baiviet/THONG-BAO-Ve-viec-trien-khai-thi-hanh-Luat-Thuong-mai-dien-tu-nam-2025-tR4Gt5n9Al?AspxAutoDetectCookieSupport=1 |

## Current-law requirement matrix

| Current requirement | Repository state after this pass | Evidence route | Blocker / follow-up |
| --- | --- | --- | --- |
| Article 11: clearly publish platform owner, privacy policy, parties' rights/obligations, complaint method, prices, payment, delivery, returns/refunds for an ordering platform | Owner and privacy scaffolding are public; transaction/payment/shipping/return pages are linked. Unconfirmed policies are visibly marked pending. | `/thong-tin-doanh-nghiep`, `/chinh-sach-bao-mat`, `/dieu-khoan-giao-dich`, footer | Approved complaint workflow, shipping and return rules, tax/charge treatment, and bank-transfer operations are missing. |
| Article 12(1): before order, show goods/type/quantity, delivery method/time, promotions, itemized goods/tax/shipping/other costs, and payment method; capture buyer agreement | Product/variant/quantity/payment exist. Cart totals are explicitly non-authoritative. | PDP, `/gio-hang`, `/thanh-toan` | **Blocking:** no approved delivery method/time; no itemized tax, shipping, packaging or other-charge treatment; no business-approved promotions rule. Current checkbox does not cure these omissions. |
| Article 12(2): allow review/edit of specified information before ordering | Cart quantities and customer fields are editable before POST. | `/gio-hang`, `/thanh-toan` | Re-audit once delivery and itemized-cost fields exist. |
| Article 12(3): after order, required contents remain displayed and accessible from the buyer account | Authenticated checkout links each new order to the server-validated account; inline success links to a protected order detail and My Orders retains customer access. Historical orders remain unassigned rather than guessed from PII. | `/thanh-toan`, `/tai-khoan/don-hang`, protected order detail | Retention periods and the final list of legally required displayed fields still require owner/legal approval. |
| Article 13: automated electronic contracting must display Article 12 contents, ensure integrity/traceability/storage, and keep post-order contents accessible from buyer account | Server creates orders transactionally and authenticated customers receive ownership-scoped list/detail access. Foreign and nonexistent orders share the same public not-found behavior. | `POST /api/checkout`, `/tai-khoan/don-hang`, protected order detail | Legal applicability, retention duration, export/evidence operations, and the completeness of displayed contract fields still require owner/legal review. No compliance claim is made here. |
| Article 14: a direct ecommerce platform with online ordering must notify the competent authority before operation | No notification status is represented on the site. | No badge or status rendered | **Blocking:** complete current procedure with the competent authority after all business/technical gaps are closed. |
| Article 15: platform-owner duties include accurate Article 11 publication, periodic online reporting, unlawful-content handling, authority cooperation, and disclosure of ranking criteria if used | Owner disclosures are scaffolded. No recommendation/ranking claim is added. | legal routes/footer | Operational reporting, complaint handling, unlawful-content response, authority liaison, and any future ranking disclosure require an owner-approved operating procedure. |
| Article 16(1): direct-platform product/service quality and label information; retain published product information for at least one year | Catalog/PDP contain ProductDTO content and imagery. | `/san-pham`, `/san-pham/[slug]` | **Parallel-UI handoff:** audit label-mandated fields, product-quality disclosures, image accessibility and one-year publication retention. This branch intentionally does not edit catalog/PDP files. |
| Article 16(2): direct ordering platform keeps contract data accessible (generally three years; specified smaller businesses at least one year) and handles nonconforming/defective-goods return/recall duties | Server orders persist and new authenticated owners can revisit My Orders and protected order detail; approved retention and return/recall operations do not yet exist. | Account order pages; checkout backend; pending return page | **Blocking:** legal applicability/retention, nonconforming-goods return, defective-goods recall and notification processes need approval and likely additional product/backend scope. |
| Personal-data transparency and rights | The privacy page names currently collected checkout fields/purpose and identifies missing retention/processor/security/rights processes. Checkout PII stays in component memory until submitted and is not stored in browser storage/URL. | `/chinh-sach-bao-mat`, `/thanh-toan` | **Blocking:** approve retention, processors/recipients, security operations, rights-request channel, incident handling and any cross-border processing. |

## Checkout consent limitation

The unchecked native checkbox is a UX prerequisite: it prevents the browser from calling `/api/checkout` until the customer accepts the linked terms/policies. It is not persisted and is not sent in `CheckoutInput`, so it is **not durable evidence of historical consent**. If the owner/legal reviewer requires durable evidence, a schema/backend design needs explicit approval and this project must stop with `COMPLIANCE_SCHEMA_CHANGE_REQUIRES_APPROVAL`.

## Handoff to parallel storefront UI work

The parallel storefront branch should review, without this compliance branch editing its files:

- statutory product-label fields actually required for each coffee product;
- quality/product information and evidence source;
- image alt text, keyboard operation, contrast, zoom/readability and other accessibility behavior;
- persistence/retention of published product information;
- no unsupported tasting, origin, certification, discount, stock or shipping claims.

## Conclusion

The routes, owner identity, footer navigation, truthful pending-policy notices and checkout consent gate can be technically reviewed. Authority submission and commercial deployment remain blocked by the items in `business-inputs-required.md` and by the Article 12/13/16 product/backend gaps above.
