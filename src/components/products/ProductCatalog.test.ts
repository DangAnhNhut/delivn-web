// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CartProvider, useCart } from "@/components/cart/CartProvider";
import type { ProductDTO } from "@/contracts";

import { ProductCatalog } from "./ProductCatalog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const productFixture1: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "san-pham-espresso",
  name: "CÀ PHÊ HẠT RANG ESPRESSO",
  shortName: "Espresso",
  description: "Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ.",
  category: "espresso",
  featured: false,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      type: "image",
      url: "/products/black/front.png",
      alt: "Bao bì DELIVN Espresso",
      sortOrder: 0,
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      type: "image",
      url: "/products/black/three-quarter.png",
      alt: "Bao bì DELIVN Espresso góc nghiêng",
      sortOrder: 1,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000004",
      sku: "ESPRESSO-250",
      label: "250g",
      weightGrams: 250,
      priceVnd: 173_000,
      compareAtPriceVnd: null,
      inStock: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000005",
      sku: "ESPRESSO-500",
      label: "500g",
      weightGrams: 500,
      priceVnd: 345_000,
      compareAtPriceVnd: null,
      inStock: true,
    },
  ],
};

const productFixture2: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000011",
  slug: "san-pham-rang-xay",
  name: "CÀ PHÊ RANG XAY",
  shortName: "Rang Xay",
  description: "Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ.",
  category: "rang_xay",
  featured: false,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000012",
      type: "image",
      url: "/products/sand/front.png",
      alt: "Bao bì DELIVN Rang Xay",
      sortOrder: 0,
    },
    {
      id: "00000000-0000-4000-8000-000000000013",
      type: "image",
      url: "/products/sand/three-quarter.png",
      alt: "Bao bì DELIVN Rang Xay góc nghiêng",
      sortOrder: 1,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000014",
      sku: "RANG-XAY-250",
      label: "250g",
      weightGrams: 250,
      priceVnd: 168_000,
      compareAtPriceVnd: null,
      inStock: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000015",
      sku: "RANG-XAY-500",
      label: "500g",
      weightGrams: 500,
      priceVnd: 335_000,
      compareAtPriceVnd: null,
      inStock: true,
    },
  ],
};

function CartCountObserver() {
  const { itemCount } = useCart();
  return createElement("output", { "data-cart-count": true }, String(itemCount));
}

let container: HTMLDivElement;
let root: Root;
let assignMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  assignMock = vi.fn();
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...window.location,
      assign: assignMock,
    },
  });

  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

async function renderCatalog(products: ProductDTO[] = [productFixture1, productFixture2]) {
  await act(async () => {
    root.render(
      createElement(
        CartProvider,
        null,
        createElement(ProductCatalog, { products }),
        createElement(CartCountObserver),
      ),
    );
  });
}

describe("ProductCatalog", () => {
  it("renders the branded commercial empty state for a successful empty result", () => {
    const html = renderToStaticMarkup(
      createElement(
        CartProvider,
        null,
        createElement(ProductCatalog, { products: [] }),
      ),
    );

    expect(html).toContain("SẢN PHẨM ĐANG ĐƯỢC CẬP NHẬT");
    expect(html).toContain("DELIVN đang hoàn thiện thông tin sản phẩm.");
    expect(html).toContain('href="/"');
  });

  it("renders both product cards with exactly one approved reference JPG per product", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(decodeURIComponent(images[0]?.getAttribute("src") ?? "")).toContain(
      "/products/reference/500g_black_reference.jpg",
    );
    expect(decodeURIComponent(images[1]?.getAttribute("src") ?? "")).toContain(
      "/products/reference/500g_sand_reference.jpg",
    );

    expect(container.textContent).toContain("CÀ PHÊ HẠT RANG ESPRESSO");
    expect(container.textContent).toContain("CÀ PHÊ RANG XAY");
    expect(container.textContent).toContain("173.000 ₫");
    expect(container.textContent).toContain("168.000 ₫");
    expect(container.textContent).toContain("CÒN HÀNG");
  });

  it("has no carousel previous/next controls, dots, or thumbnails", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    expect(container.querySelector('button[aria-label*="tiếp theo"]')).toBeNull();
    expect(container.querySelector('button[aria-label*="trước"]')).toBeNull();
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll(".gallery-dot, [data-slide-dot]")).toHaveLength(0);
  });

  it("does not render PDP links or XEM CHI TIẾT on catalog cards", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    expect(container.textContent).not.toContain("Xem chi tiết");
    expect(container.textContent).not.toContain("XEM CHI TIẾT");

    const links = container.querySelectorAll<HTMLAnchorElement>("a");
    for (const link of links) {
      expect(link.getAttribute("href")).not.toContain("/san-pham/");
    }
  });

  it("does not render development copy and displays neutral factual copy without unverified claims", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    expect(container.textContent).not.toContain("phát triển cục bộ");
    expect(container.textContent).not.toContain("Dữ liệu sản phẩm");
    expect(container.textContent).not.toContain("Tây Nguyên");
    expect(container.textContent).toContain("Cà phê hạt rang — lựa chọn 250g hoặc 500g.");
    expect(container.textContent).toContain("Cà phê rang xay — lựa chọn 250g hoặc 500g.");
  });

  it("updates displayed price immediately when 250g / 500g variant is selected", async () => {
    await renderCatalog([productFixture1]);

    expect(container.textContent).toContain("173.000 ₫");

    const radios = container.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.textContent).toContain("250g");
    expect(radios[1]?.textContent).toContain("500g");

    // Click 500g variant
    await act(async () => radios[1]?.click());

    expect(container.textContent).toContain("345.000 ₫");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");

    // Click back to 250g
    await act(async () => radios[0]?.click());
    expect(container.textContent).toContain("173.000 ₫");
  });

  it("handles MUA NGAY by adding selected variant to cart and navigating directly to /thanh-toan", async () => {
    await renderCatalog([productFixture1]);

    const buyNowBtn = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent?.trim() === "MUA NGAY",
    );
    expect(buyNowBtn).toBeDefined();

    await act(async () => buyNowBtn?.click());

    // Cart updated
    expect(container.querySelector("[data-cart-count]")?.textContent).toBe("1");
    // Direct navigation to /thanh-toan
    expect(assignMock).toHaveBeenCalledWith("/thanh-toan");
  });

  it("handles THÊM VÀO GIỎ by adding selected variant to cart, remaining on catalog, and updating cart state", async () => {
    await renderCatalog([productFixture1]);

    const addToCartBtn = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent?.trim() === "THÊM VÀO GIỎ",
    );
    expect(addToCartBtn).toBeDefined();

    await act(async () => addToCartBtn?.click());

    // Cart count updated
    expect(container.querySelector("[data-cart-count]")?.textContent).toBe("1");
    // Remained on catalog (no navigation)
    expect(assignMock).not.toHaveBeenCalled();
    // Feedback displayed
    expect(container.textContent).toContain("ĐÃ THÊM VÀO GIỎ");
  });

  it("disables purchase actions when selected variant is out of stock", async () => {
    const outOfStockProduct: ProductDTO = {
      ...productFixture1,
      variants: [
        {
          ...productFixture1.variants[0]!,
          inStock: false,
        },
      ],
    };

    await renderCatalog([outOfStockProduct]);

    const buttons = container.querySelectorAll<HTMLButtonElement>("button");
    const outOfStockButtons = [...buttons].filter((b) =>
      b.textContent?.includes("TẠM HẾT HÀNG"),
    );
    expect(outOfStockButtons.length).toBeGreaterThanOrEqual(1);
    for (const btn of outOfStockButtons) {
      expect(btn.disabled).toBe(true);
    }
  });
});
