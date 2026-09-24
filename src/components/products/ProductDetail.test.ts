import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ProductDTO } from "@/contracts";

import { ProductDetail, ProductNotFoundState } from "./ProductDetail";

const productFixture: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "san-pham-thu-nghiem",
  name: "SẢN PHẨM THỬ NGHIỆM",
  shortName: "Thử nghiệm",
  description: "Nội dung fixture chỉ dùng trong kiểm thử giao diện chi tiết.",
  category: "rang_xay",
  featured: false,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      type: "image",
      url: "/fixture-detail.png",
      alt: "Ảnh chi tiết sản phẩm thử nghiệm",
      sortOrder: 0,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      sku: "FIXTURE-OPTION-A",
      label: "Tùy chọn A",
      weightGrams: 250,
      priceVnd: 100_000,
      compareAtPriceVnd: null,
      inStock: true,
    },
  ],
};

describe("ProductDetail", () => {
  it("renders canonical product content, DTO media, and variant labels", () => {
    const html = renderToStaticMarkup(
      createElement(ProductDetail, { product: productFixture }),
    );

    expect(html).toContain("SẢN PHẨM THỬ NGHIỆM");
    expect(html).toContain("Nội dung fixture chỉ dùng trong kiểm thử giao diện chi tiết.");
    expect(html).toContain('src="/fixture-detail.png"');
    expect(html).toContain('alt="Ảnh chi tiết sản phẩm thử nghiệm"');
    expect(html).toContain("Tùy chọn A");
    expect(html).toContain('href="/san-pham"');
  });

  it("renders an intentional no-media treatment without fabricating an image", () => {
    const html = renderToStaticMarkup(
      createElement(ProductDetail, {
        product: { ...productFixture, media: [] },
      }),
    );

    expect(html).toContain("HÌNH ẢNH SẢN PHẨM ĐANG ĐƯỢC CẬP NHẬT");
    expect(html).not.toContain("fixture-detail.png");
  });

  it("does not expose inventory quantities or fake add-to-cart behavior", () => {
    const html = renderToStaticMarkup(
      createElement(ProductDetail, { product: productFixture }),
    );

    expect(html.toLowerCase()).not.toContain("reservedquantity");
    expect(html.toLowerCase()).not.toContain("quantity");
    expect(html).not.toContain("Thêm vào giỏ");
  });
});

describe("ProductNotFoundState", () => {
  it("renders a branded missing-product message and catalog navigation", () => {
    const html = renderToStaticMarkup(createElement(ProductNotFoundState));

    expect(html).toContain("KHÔNG TÌM THẤY SẢN PHẨM");
    expect(html).toContain('href="/san-pham"');
    expect(html).not.toContain("database");
  });
});
