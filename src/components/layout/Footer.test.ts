import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

describe("Footer compliance navigation", () => {
  it("renders verified company identity and every public legal route", () => {
    const html = renderToStaticMarkup(createElement(Footer));

    expect(html).toContain("CÔNG TY TNHH CÀ PHÊ DELIVN");
    expect(html).toContain("3703119501");
    expect(html).toContain("Thành phố Hồ Chí Minh");
    expect(html).toContain("0961122226");
    expect(html).toContain("Vietnamdelicoffee@gmail.com");
    for (const href of [
      "/lien-he",
      "/thong-tin-doanh-nghiep",
      "/dieu-khoan-giao-dich",
      "/chinh-sach-bao-mat",
      "/chinh-sach-thanh-toan",
      "/chinh-sach-van-chuyen",
      "/chinh-sach-doi-tra-hoan-tien",
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it("does not publish stale, sensitive, or unconfirmed authority information", () => {
    const html = renderToStaticMarkup(createElement(Footer));

    expect(html).not.toContain("Bình Dương");
    expect(html).not.toMatch(/CMND|CCCD|ngày sinh/i);
    expect(html).not.toContain("Đã thông báo Bộ Công Thương");
  });

  it("keeps useful and legal navigation without dead story or brewing links", () => {
    const html = renderToStaticMarkup(createElement(Footer));

    for (const href of ["/", "/san-pham", "/lien-he", "/thong-tin-doanh-nghiep"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).not.toContain('href="/cau-chuyen"');
    expect(html).not.toContain('href="/cach-pha"');
  });
});
