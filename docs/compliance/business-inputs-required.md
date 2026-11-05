# DELIVN business inputs required

**Status:** owner decisions required. No value below has been inferred or invented.

## Required before authority submission

| Input/decision required | Why it is needed | Affected surface |
| --- | --- | --- |
| Delivery methods and carrier/fulfilment model | A buyer must be told and agree how goods will be delivered. | Transaction terms, shipping policy, checkout |
| Service geography and delivery restrictions | Defines where an order can be fulfilled. | Shipping policy, checkout |
| Processing and estimated delivery times, including delay/cancellation handling | Needed for a meaningful delivery agreement. | Shipping policy, checkout |
| Shipping fee calculation and when the fee is shown | Current server value is a temporary development policy and must not be marketed as free shipping. | Checkout totals, shipping policy |
| Whether product price includes tax; how tax, packaging and every other charge are itemized | Required to explain the full amount before the buyer orders. | PDP/cart/checkout/terms |
| Promotions policy, if promotions will be used | The current-law order disclosure includes applicable promotion form. | PDP/cart/checkout/terms |
| Return/exchange eligibility, reasons, window, product condition and evidence | Required for a usable goods-return policy. | Return/refund policy, terms |
| Return method, return shipping responsibility and dispute path | Defines how an accepted return operates. | Return/refund policy, contact |
| Refund method and timing | Prevents an invented or misleading refund promise. | Return/refund/payment policy |
| Defective-product recall and direct buyer-notification process | Supports current direct-platform duties for defective goods. | Return/refund policy, operations |
| Complaint/request intake and resolution procedure | Article 11 calls for a disclosed method; a phone number alone is not the process. | Contact, terms, privacy |
| Bank-transfer operating decision | Either provide approved beneficiary/account/reference/reconciliation instructions or remove `bank_transfer` from the commercial launch choices. No QR or account is currently approved. | Payment policy, checkout |
| Invoice policy and request process | Must match business/tax operations and total presentation. | Terms, payment/contact |
| Privacy retention periods | The site cannot state how long customer/order data is kept without owner approval. | Privacy policy, backend operations |
| Data processors/recipients and storage locations | Needed to describe who handles checkout/order data. | Privacy policy, vendor register |
| Data security, incident and deletion procedures | Needed for truthful operational privacy disclosure. | Privacy policy, internal process |
| Data-subject rights channel and response procedure | Customers need an approved contact/process for requests. | Privacy/contact pages |
| Current ecommerce notification authority/procedure confirmation | The portal exposes a legacy sales-website workflow while the 2026 framework is now effective. Confirm the competent authority and current filing steps. | Submission file |
| Product-label and product-quality disclosure set | Current-law direct-platform responsibilities must be mapped to each real packaged product. | Catalog/PDP handoff |

## Required before production launch

| Input/decision required | Why it is needed | Affected surface |
| --- | --- | --- |
| Buyer account or durable order-access strategy | Current checkout has only an inline success state; buyers cannot revisit the required order contents from an account. | Backend/API/account/order UI |
| Contract/order-data retention and accessibility period | Current law specifies access/retention duties with business-size-dependent rules. Legal review must determine the applicable period. | Backend/data policy |
| Durable consent-evidence decision | The current checkbox is a UX gate only. Persisting evidence would require separately approved schema/backend work. | Checkout/backend/schema |
| Periodic ecommerce reporting owner and procedure | A named operational owner must handle any applicable online reporting. | Internal compliance operations |
| Authority request, unlawful-content and recall response owners | Source code cannot substitute for operating procedures. | Internal compliance operations |
| Production support staffing/hours and escalation | Customers need a real response process for orders, complaints, privacy and recalls. | Contact and internal runbook |
| TikTok Shop public storefront URL (`TIKTOK_SHOP_URL`) | The contact hub reserves a non-interactive channel card. Publish a link only after the real storefront URL and product availability are approved. | Contact hub, production launch |
| Shopee public storefront URL (`SHOPEE_STORE_URL`) | The contact hub reserves a non-interactive channel card. Publish a link only after the real storefront URL and product availability are approved. | Contact hub, production launch |

## Optional / later operational input

| Input/decision | Notes |
| --- | --- |
| Public support email (`BUSINESS_INPUT_REQUIRED_CONTACT_EMAIL`) | Do not publish an address until the mailbox exists and is monitored. Phone remains the only verified public channel. |
| Marketing communications | If introduced later, design separate purpose/consent/withdrawal handling; do not reuse checkout consent. |
| Analytics, advertising and cookie tooling | Re-audit privacy disclosures and consent before adding tools. None is asserted by this pass. |
| Additional payment gateways | Requires a separately approved backend and operational integration. No card, QR, VNPay, MoMo or ZaloPay behavior is implied. |

## Decisions that require a separate engineering approval

- Database/schema change for durable consent evidence.
- Account/authentication or order-lookup API.
- Shipping-provider/rate integration or a change to shipping calculation.
- ProductDTO/schema changes for label or quality fields.
- Payment gateway or bank-transfer workflow changes.
