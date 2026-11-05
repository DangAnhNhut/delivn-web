# DELIVN notification screenshot checklist

**Use only after every blocker is resolved and the competent authority confirms the current filing process.** This is a capture checklist, not evidence that notification has been completed.

## Pre-capture gates

- [ ] Owner/legal reviewer approved every public policy.
- [ ] Delivery method/time and every tax, shipping, packaging and other cost are agreed and itemized before order submission.
- [ ] Bank-transfer instructions are approved, or the method is removed from launch.
- [ ] Return/refund/recall and complaint procedures are operational.
- [ ] Privacy retention, processors/recipients, security and rights-request process are approved.
- [ ] Buyer order/contract access and applicable retention are implemented.
- [ ] Product label/quality/accessibility handoff is complete.
- [ ] Competent authority/current process confirmed after the 01/07/2026 transition.
- [ ] No page shows a Bộ Công Thương badge or notification claim before confirmation.

## Viewports

Capture the required surfaces at desktop and mobile dimensions that preserve readable URL, page identity and content. Engineering QA targets: 1440, 768 and 390 CSS pixels.

## Public owner and contact evidence

- [ ] Homepage footer: legal name, enterprise number, current Hồ Chí Minh City office, phone, legal/policy links.
- [ ] `/thong-tin-doanh-nghiep`: complete public company information.
- [ ] `/lien-he`: public phone and registered office; no invented email.

## Policy evidence

- [ ] `/dieu-khoan-giao-dich`
- [ ] `/chinh-sach-bao-mat`
- [ ] `/chinh-sach-thanh-toan`
- [ ] `/chinh-sach-van-chuyen`
- [ ] `/chinh-sach-doi-tra-hoan-tien`

Do not use screenshots from the current scaffold while they show “THÔNG TIN ĐANG CHỜ DOANH NGHIỆP XÁC NHẬN”. Those notices correctly prove the business inputs are not complete.

## Product and ordering evidence

- [ ] `/san-pham`: real active products and prices.
- [ ] Each active PDP: product name, label/quality information, media, variants, price and availability.
- [ ] `/gio-hang`: editable quantity, snapshot-price warning and checkout navigation.
- [ ] `/thanh-toan` before submission: customer fields, payment choices, approved delivery information, itemized costs and linked consent checkbox unchecked.
- [ ] Consent validation: submission blocked while unchecked.
- [ ] Accepted checkout: checkbox checked, all order information reviewable, one successful HTTP 201 order.
- [ ] Confirmed success: order number and authoritative server total/status without customer PII exposed in URL.
- [ ] Buyer account/order lookup: submitted contract details remain accessible for the applicable period.

## Capture hygiene

- Use production-like, owner-approved commercial data; never fabricate a policy or authority status for a screenshot.
- Redact test customer phone, email and street address when evidence is shared outside the authorized filing workflow.
- Capture the browser URL and page heading together where practical.
- Record capture date, deployment commit, environment and reviewer in the submission working papers, not in public site code.
- Keep the business-registration certificate and personal fields outside the public repository.
