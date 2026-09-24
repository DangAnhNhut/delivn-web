import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ProductDTO } from "@/contracts";

import { ProductCatalog } from "./ProductCatalog";

const productFixture: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "san-pham-thu-nghiem",
  name: "SẢN PHẨM THỬ NGHIỆM",
  shortName: "Thử nghiệm",
  description: "Nội dung fixture chỉ dùng trong kiểm thử giao diện.",
  category: "espresso",
  featured: false,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      type: "image",
      url: "/fixture-product.png",
      alt: "Ảnh sản phẩm thử nghiệm",
      sortOrder: 0,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      sku: "FIXTURE-250",
      label: "250g",
      weightGrams: 250,
      priceVnd: 100_000,
      compareAtPriceVnd: null,
      inStock: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      sku: "FIXTURE-500",
      label: "500g",
      weightGrams: 500,
      priceVnd: 150_000,
      compareAtPriceVnd: null,
      inStock: false,
    },
  ],
};

describe("ProductCatalog", () => {
  it("renders the branded commercial empty state for a successful empty result", () => {
    const html = renderToStaticMarkup(
      createElement(ProductCatalog, { products: [] }),
    );

    expect(html).toContain("SẢN PHẨM ĐANG ĐƯỢC CẬP NHẬT");
    expect(html).toContain("DELIVN đang hoàn thiện thông tin sản phẩm.");
    expect(html).toContain('href="/"');
  });

  it("renders DTO media, variants, derived price, stock state, and future PDP link", () => {
    const html = renderToStaticMarkup(
      createElement(ProductCatalog, { products: [productFixture] }),
    );

    expect(html).toContain('src="/fixture-product.png"');
    expect(html).toContain("250g");
    expect(html).toContain("500g");
    expect(html).toContain("Từ 100.000 ₫");
    expect(html).toContain("TẠM HẾT HÀNG");
    expect(html).toContain('href="/san-pham/san-pham-thu-nghiem"');
  });
});
