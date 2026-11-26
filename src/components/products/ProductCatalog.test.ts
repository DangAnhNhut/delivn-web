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

  it("renders both product cards with official names, buyer labels, and variant-matched 250g images", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(decodeURIComponent(images[0]?.getAttribute("src") ?? "")).toContain(
      "/products/variants/espresso-250g.png",
    );
    expect(decodeURIComponent(images[1]?.getAttribute("src") ?? "")).toContain(
      "/products/variants/rang-xay-250g.png",
    );

    expect(container.textContent).toContain("CÀ PHÊ PHA MÁY");
    expect(container.textContent).toContain("CÀ PHÊ PHA PHIN");
    expect(container.textContent).toContain(
      "Cà phê hạt rang Espresso Special Tây Nguyên VietNam",
    );
    expect(container.textContent).toContain(
      "Cà phê rang xay pha phin truyền thống Tây Nguyên VietNam",
    );
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

  it("links each catalog card to the matching product detail route with selected size", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    const links = [...container.querySelectorAll<HTMLAnchorElement>("a")].map(
      (a) => a.getAttribute("href"),
    );
    expect(links).toContain("/san-pham/san-pham-espresso?size=250");
    expect(links).toContain("/san-pham/san-pham-rang-xay?size=250");
  });

  it("replaces development copy with official factual product summaries and hides technical SKU", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    expect(container.textContent).not.toContain("phát triển cục bộ");
    expect(container.textContent).not.toContain("Dữ liệu sản phẩm");
    expect(container.textContent).not.toContain("ESPRESSO-250");
    expect(container.textContent).not.toContain("RANG-XAY-250");
    expect(container.textContent).toContain(
      "Cà phê hạt rang — 100% cà phê (70% Robusta - 30% Arabica) · Lựa chọn 250g hoặc 500g.",
    );
    expect(container.textContent).toContain(
      "Cà phê rang xay pha phin — 100% cà phê (90% Robusta - 10% Arabica) · Lựa chọn 250g hoặc 500g.",
    );
  });

  it("updates displayed price and image immediately when 250g / 500g variant is selected", async () => {
    await renderCatalog([productFixture1]);

    expect(container.textContent).toContain("173.000 ₫");
    expect(
      decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? ""),
    ).toContain("/products/variants/espresso-250g.png");

    const radios = container.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.textContent).toContain("250g");
    expect(radios[1]?.textContent).toContain("500g");

    // Click 500g variant -> image, price, and detail link update together
    await act(async () => radios[1]?.click());

    expect(container.textContent).toContain("345.000 ₫");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");
    expect(
      decodeURIComponent(
        container
          .querySelector('[data-stage-layer="active"] img')
          ?.getAttribute("src") ?? "",
      ),
    ).toContain("/products/variants/espresso-500g.png");

    // Click back to 250g -> image and price revert cleanly
    await act(async () => radios[0]?.click());
    expect(container.textContent).toContain("173.000 ₫");
    expect(
      decodeURIComponent(
        container
          .querySelector('[data-stage-layer="active"] img')
          ?.getAttribute("src") ?? "",
      ),
    ).toContain("/products/variants/espresso-250g.png");
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

  it("handles rapid switching 250g -> 500g -> 250g -> 500g cleanly and syncs add-to-cart and buy-now to 500g", async () => {
    await renderCatalog([productFixture1, productFixture2]);

    const cards = container.querySelectorAll("article");
    const espRadios = cards[0]!.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    const rxRadios = cards[1]!.querySelectorAll<HTMLButtonElement>('button[role="radio"]');

    // Rapid switching on Espresso
    await act(async () => {
      espRadios[1]?.click(); // 500g
      espRadios[0]?.click(); // 250g
      espRadios[1]?.click(); // 500g
    });

    const espActiveImg = cards[0]!.querySelector('[data-stage-layer="active"] img');
    expect(decodeURIComponent(espActiveImg?.getAttribute("src") ?? "")).toContain(
      "/products/variants/espresso-500g.png",
    );
    expect(cards[0]!.textContent).toContain("345.000 ₫");
    expect(cards[0]!.textContent).not.toContain("ESPRESSO-500");

    // Switch Rang Xay to 500g
    await act(async () => rxRadios[1]?.click());
    const rxActiveImg = cards[1]!.querySelector('[data-stage-layer="active"] img');
    expect(decodeURIComponent(rxActiveImg?.getAttribute("src") ?? "")).toContain(
      "/products/variants/rang-xay-500g.png",
    );
    expect(cards[1]!.textContent).toContain("335.000 ₫");
    expect(cards[1]!.textContent).not.toContain("RANG-XAY-500");

    // Media stages preserve unified aspect-[5/4] class
    expect(
      cards[0]!.querySelector("[data-product-media-stage]")?.className,
    ).toContain("aspect-[5/4]");
    expect(
      cards[1]!.querySelector("[data-product-media-stage]")?.className,
    ).toContain("aspect-[5/4]");

    // Add Espresso 500g to cart and verify stored cart snapshot
    const espAddBtn = [...cards[0]!.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent?.trim() === "THÊM VÀO GIỎ",
    );
    await act(async () => espAddBtn?.click());
    const stored = localStorage.getItem("delivn.cart.v1") ?? "";
    expect(stored).toContain("00000000-0000-4000-8000-000000000005");
    expect(stored).toContain("500g");
    expect(stored).toContain("/products/variants/espresso-500g.png");

    // Buy-now on Rang Xay 500g adds 500g variant and navigates to /thanh-toan
    const rxBuyBtn = [...cards[1]!.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent?.trim() === "MUA NGAY",
    );
    await act(async () => rxBuyBtn?.click());
    expect(assignMock).toHaveBeenCalledWith("/thanh-toan");
    const storedAfterBuy = localStorage.getItem("delivn.cart.v1") ?? "";
    expect(storedAfterBuy).toContain("00000000-0000-4000-8000-000000000015");
  });

  it("swaps immediately without outgoing transition layer under prefers-reduced-motion", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      await renderCatalog([productFixture1]);
      const radios = container.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
      await act(async () => radios[1]?.click());

      expect(container.querySelector('[data-stage-layer="outgoing"]')).toBeNull();
      const activeImg = container.querySelector('[data-stage-layer="active"] img');
      expect(decodeURIComponent(activeImg?.getAttribute("src") ?? "")).toContain(
        "/products/variants/espresso-500g.png",
      );
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
