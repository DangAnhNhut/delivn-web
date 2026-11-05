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
    for (const route of expectedRoutes) expect(html).toContain(`href="${route}"`);
    expect(html).not.toContain("Bình Dương");
    expect(html).not.toContain("Đã thông báo Bộ Công Thương");
    expect(html).not.toMatch(/CMND|CCCD|ngày sinh/i);
    expect(html).not.toContain("support@delivn.com.vn");
  });

  it("marks unconfirmed operational policies as pending owner approval", () => {
    for (const route of [
      "/chinh-sach-thanh-toan",
      "/chinh-sach-van-chuyen",
      "/chinh-sach-doi-tra-hoan-tien",
    ] as const) {
      const html = renderToStaticMarkup(
        createElement(LegalPage, { page: LEGAL_PAGES[route] }),
      );
      expect(html).toContain("THÔNG TIN ĐANG CHỜ DOANH NGHIỆP XÁC NHẬN");
      expect(html).not.toContain("Miễn phí vận chuyển");
      expect(html).not.toContain("hoàn tiền trong 7 ngày");
      expect(html).not.toContain("mã QR");
    }
  });
});
