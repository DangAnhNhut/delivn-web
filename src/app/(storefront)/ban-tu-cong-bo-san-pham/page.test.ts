import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ProductSelfDeclarationPage, { metadata } from "./page";
import { PRODUCT_DECLARATION_DOSSIERS } from "@/data/product-declarations";

describe("ProductSelfDeclarationPage", () => {
  it("exports required SEO metadata and canonical URL", () => {
    expect(metadata.title).toEqual({
      absolute: "Bản tự công bố sản phẩm | DELIVN",
    });
    expect(metadata.description).toContain("Bản tự công bố sản phẩm".toLowerCase());
    expect(metadata.alternates?.canonical).toBe(
      "https://delivn.com.vn/ban-tu-cong-bo-san-pham"
    );
  });

  it("renders both dossiers open vertically in order with exact product details and PDF links", () => {
    const html = renderToStaticMarkup(createElement(ProductSelfDeclarationPage));

    expect(html).toContain("<h1");
    expect(html).toContain("BẢN TỰ CÔNG BỐ SẢN PHẨM");
    expect(html).toContain("Trang chủ");

    const idx1 = html.indexOf(PRODUCT_DECLARATION_DOSSIERS[0].title);
    const idx2 = html.indexOf(PRODUCT_DECLARATION_DOSSIERS[1].title);
    expect(idx1).toBeGreaterThan(-1);
    expect(idx2).toBeGreaterThan(idx1);

    for (const dossier of PRODUCT_DECLARATION_DOSSIERS) {
      expect(html).toContain(dossier.declarationNumber);
      expect(html).toContain(dossier.ingredients);
      expect(html).toContain(dossier.pdfUrl);
      expect(html).toContain(`download="${dossier.downloadFileName}"`);
      expect(html).toContain("Mở PDF trong tab mới");
      expect(html).toContain("Tải xuống PDF");
    }
  });
});

