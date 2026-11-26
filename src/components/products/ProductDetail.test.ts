import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ProductDTO } from "@/contracts";
import { CartProvider } from "@/components/cart/CartProvider";

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
  function renderProduct(product: ProductDTO) {
    return renderToStaticMarkup(
      createElement(
        CartProvider,
        null,
        createElement(ProductDetail, { product }),
      ),
    );
  }

  it("renders canonical product content, DTO media, and variant labels", () => {
    const html = renderProduct(productFixture);

    expect(html).toContain("SẢN PHẨM THỬ NGHIỆM");
    expect(html).toContain("Nội dung fixture chỉ dùng trong kiểm thử giao diện chi tiết.");
    expect(html).toContain('src="/fixture-detail.png"');
    expect(html).toContain('alt="Ảnh chi tiết sản phẩm thử nghiệm"');
    expect(html).toContain("Tùy chọn A");
    expect(html).toContain('href="/san-pham"');
  });

  it("renders an intentional no-media treatment without fabricating an image", () => {
    const html = renderProduct({ ...productFixture, media: [] });

    expect(html).toContain("HÌNH ẢNH SẢN PHẨM ĐANG ĐƯỢC CẬP NHẬT");
    expect(html).not.toContain("fixture-detail.png");
  });

  it("exposes the hydration-safe cart action without inventory quantities", () => {
    const html = renderProduct(productFixture);

    expect(html.toLowerCase()).not.toContain("reservedquantity");
    expect(html.toLowerCase()).not.toContain("quantity");
    expect(html).toContain("THÊM VÀO GIỎ");
    expect(html).toContain("disabled");
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

describe("ProductDetail official DELIVN variants & specifications", () => {
  const espressoProduct: ProductDTO = {
    id: "d3120000-0000-4000-8000-000000000001",
    slug: "dev-local-delivn-espresso",
    name: "CÀ PHÊ HẠT RANG ESPRESSO",
    shortName: "Hạt Rang",
    description: "Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ.",
    category: "espresso",
    featured: false,
    media: [],
    variants: [
      {
        id: "v-esp-250",
        sku: "DELIVN-ESPRESSO-250",
        label: "250g",
        weightGrams: 250,
        priceVnd: 173_000,
        compareAtPriceVnd: null,
        inStock: true,
      },
      {
        id: "v-esp-500",
        sku: "DELIVN-ESPRESSO-500",
        label: "500g",
        weightGrams: 500,
        priceVnd: 345_000,
        compareAtPriceVnd: null,
        inStock: true,
      },
    ],
  };

  const rangXayProduct: ProductDTO = {
    id: "d3120000-0000-4000-8000-000000000002",
    slug: "dev-local-delivn-rang-xay",
    name: "CÀ PHÊ RANG XAY",
    shortName: "Rang Xay",
    description: "Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ.",
    category: "rang_xay",
    featured: false,
    media: [],
    variants: [
      {
        id: "v-rx-250",
        sku: "DELIVN-RANG-XAY-250",
        label: "250g",
        weightGrams: 250,
        priceVnd: 168_000,
        compareAtPriceVnd: null,
        inStock: true,
      },
      {
        id: "v-rx-500",
        sku: "DELIVN-RANG-XAY-500",
        label: "500g",
        weightGrams: 500,
        priceVnd: 335_000,
        compareAtPriceVnd: null,
        inStock: true,
      },
    ],
  };

  it("renders Espresso 250g and 500g with detail webp images, 100% cà phê ratio, green stock dot, and zero DEV-LOCAL SKU", () => {
    const html250 = renderToStaticMarkup(
      createElement(
        CartProvider,
        null,
        createElement(ProductDetail, {
          product: espressoProduct,
          initialVariantId: "v-esp-250",
        }),
      ),
    );
    expect(html250).toContain("CÀ PHÊ PHA MÁY");
    expect(html250).toContain(
      "Cà phê hạt rang Espresso Special Tây Nguyên VietNam",
    );
    expect(html250).toContain('src="/products/detail/espresso-250g-detail.webp"');
    expect(html250).toContain("100% cà phê (70% Robusta - 30% Arabica)");
    expect(html250).toContain("bg-emerald-500");
    expect(html250).not.toContain("DEV-LOCAL");
    expect(html250).not.toContain("DELIVN-ESPRESSO-250");
    expect(html250).not.toContain("CÒN HÀNG");

    const html500 = renderToStaticMarkup(
      createElement(
        CartProvider,
        null,
        createElement(ProductDetail, {
          product: espressoProduct,
          initialVariantId: "v-esp-500",
        }),
      ),
    );
    expect(html500).toContain('src="/products/detail/espresso-500g-detail.webp"');
    expect(html500).toContain("345.000");
    expect(html500).not.toContain("DELIVN-ESPRESSO-500");
  });

  it("renders Rang Xay 250g and 500g with detail webp images, 100% cà phê ratio, 5-step brewing guide, and return link", () => {
    const html250 = renderToStaticMarkup(
      createElement(
        CartProvider,
        null,
        createElement(ProductDetail, {
          product: rangXayProduct,
          initialVariantId: "v-rx-250",
        }),
      ),
    );
    expect(html250).toContain('src="/products/detail/rang-xay-250g-detail.webp"');
    expect(html250).toContain("100% cà phê (90% Robusta - 10% Arabica)");
    expect(html250).not.toContain("DELIVN-RANG-XAY-250");

    const html500 = renderToStaticMarkup(
      createElement(
        CartProvider,
        null,
        createElement(ProductDetail, {
          product: rangXayProduct,
          initialVariantId: "v-rx-500",
        }),
      ),
    );
    expect(html500).toContain("CÀ PHÊ PHA PHIN");
    expect(html500).toContain(
      "Cà phê rang xay pha phin truyền thống Tây Nguyên VietNam",
    );
    expect(html500).toContain('src="/products/detail/rang-xay-500g-detail.webp"');
    expect(html500).toContain("Cho 20g cà phê (khoảng 3 muỗng cà phê) vào phin.");
    expect(html500).toContain("Không sử dụng sản phẩm đã hết hạn.");
    expect(html500).toContain('href="/chinh-sach-doi-tra-hoan-tien"');
    expect(html500).not.toContain("DELIVN-RANG-XAY-500");
  });
});
