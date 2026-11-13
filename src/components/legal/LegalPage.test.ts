import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LegalPage } from "./LegalPage";
import {
  COMPANY_INFORMATION,
  LEGAL_PAGES,
  LEGAL_ROUTE_LINKS,
} from "@/data/legal";

const expectedRoutes = [
  "/lien-he",
  "/thong-tin-doanh-nghiep",
  "/dieu-khoan-giao-dich",
  "/chinh-sach-bao-mat",
  "/chinh-sach-thanh-toan",
  "/chinh-sach-van-chuyen",
  "/chinh-sach-doi-tra-hoan-tien",
] as const;

describe("DELIVN legal content", () => {
  it("publishes the seven customer-facing routes from verified company facts", () => {
    expect(Object.keys(LEGAL_PAGES).sort()).toEqual([...expectedRoutes].sort());
    expect(LEGAL_ROUTE_LINKS.map((link) => link.href).sort()).toEqual(
      [...expectedRoutes].sort(),
    );
    expect(COMPANY_INFORMATION).toMatchObject({
      legalName: "CÔNG TY TNHH CÀ PHÊ DELIVN",
      englishName: "DELIVN COFFEE COMPANY LIMITED",
      abbreviatedName: "DELIVN COFFEE CO.,LTD",
      enterpriseNumber: "3703119501",
      firstRegistration: "07/04/2023",
      latestAmendment: "18/12/2025",
      phone: "0961122226",
      email: "Vietnamdelicoffee@gmail.com",
      legalRepresentative: "ĐẶNG VĂN NAM",
      representativeTitle: "Giám đốc",
    });
    expect(COMPANY_INFORMATION.registeredOffice).toContain("Thành phố Hồ Chí Minh");
  });

  it("renders verified identity and related policy navigation without forbidden claims", () => {
    const html = renderToStaticMarkup(
      createElement(LegalPage, { page: LEGAL_PAGES["/thong-tin-doanh-nghiep"] }),
    );

    expect(html).toContain("CÔNG TY TNHH CÀ PHÊ DELIVN");
    expect(html).toContain("3703119501");
    expect(html).toContain("Thành phố Hồ Chí Minh");
    expect(html).toContain("Vietnamdelicoffee@gmail.com");
    for (const route of expectedRoutes) expect(html).toContain(`href="${route}"`);
    expect(html).not.toContain("Bình Dương");
    expect(html).not.toContain("Đã thông báo Bộ Công Thương");
    expect(html).not.toMatch(/CMND|CCCD|ngày sinh/i);
    expect(html).not.toContain("support@delivn.com.vn");
  });

  it("publishes owner-approved operational policies with truthful commercial terms", () => {
    const termsHtml = renderToStaticMarkup(
      createElement(LegalPage, { page: LEGAL_PAGES["/dieu-khoan-giao-dich"] }),
    );
    expect(termsHtml).toContain("đã bao gồm thuế giá trị gia tăng (VAT)");
    expect(termsHtml).toContain("hóa đơn điện tử");
    expect(termsHtml).toContain("GHN");

    const paymentHtml = renderToStaticMarkup(
      createElement(LegalPage, { page: LEGAL_PAGES["/chinh-sach-thanh-toan"] }),
    );
    expect(paymentHtml).toContain("Thanh toán khi nhận hàng (COD)");
    expect(paymentHtml).toContain("Chuyển khoản ngân hàng / Mã QR");
    expect(paymentHtml).not.toContain("mã QR thanh toán");

    const shippingHtml = renderToStaticMarkup(
      createElement(LegalPage, { page: LEGAL_PAGES["/chinh-sach-van-chuyen"] }),
    );
    expect(shippingHtml).toContain("34 tỉnh, thành phố");
    expect(shippingHtml).toContain("biểu phí thực tế của đơn vị vận chuyển");
    expect(shippingHtml).not.toContain("Miễn phí vận chuyển");

    const returnHtml = renderToStaticMarkup(
      createElement(LegalPage, { page: LEGAL_PAGES["/chinh-sach-doi-tra-hoan-tien"] }),
    );
    expect(returnHtml).toContain("07 ngày");
    expect(returnHtml).toContain("48 giờ làm việc");
    expect(returnHtml).toContain("Chuyển khoản ngân hàng");
    expect(returnHtml).toContain("Vietnamdelicoffee@gmail.com");

    for (const route of expectedRoutes) {
      const html = renderToStaticMarkup(createElement(LegalPage, { page: LEGAL_PAGES[route] }));
      expect(html).not.toContain("Đã thông báo Bộ Công Thương");
      expect(html).not.toContain("Bình Dương");
      expect(html).not.toContain("support@delivn.com.vn");
    }
  });
});
