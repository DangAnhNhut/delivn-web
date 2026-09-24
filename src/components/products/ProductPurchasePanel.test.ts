// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { MAX_QUANTITY_PER_VARIANT, type ProductDTO } from "@/contracts";
import { CART_STORAGE_KEY } from "@/lib/cart/cart-types";

import { ProductPurchasePanel } from "./ProductPurchasePanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const product: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "san-pham-fixture",
  name: "Sản phẩm fixture",
  shortName: "Fixture",
  description: "Fixture chỉ dùng trong kiểm thử.",
  category: "espresso",
  featured: false,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      type: "image",
      url: "/fixture-product.png",
      alt: "Ảnh sản phẩm fixture",
      sortOrder: 0,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      sku: "FIXTURE-250",
      label: "Gói nhỏ",
      weightGrams: 250,
      priceVnd: 100_000,
      compareAtPriceVnd: null,
      inStock: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      sku: "FIXTURE-500",
      label: "Gói lớn",
      weightGrams: 500,
      priceVnd: 150_000,
      compareAtPriceVnd: 175_000,
      inStock: true,
    },
  ],
};

function CartObserver() {
  const { items, itemCount } = useCart();
  return createElement(
    "output",
    { "data-cart-state": true },
    `${items[0]?.quantity ?? 0}|${itemCount}`,
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderPanel(productFixture: ProductDTO = product) {
  await act(async () => {
    root.render(
      createElement(
        CartProvider,
        null,
        createElement(ProductPurchasePanel, { product: productFixture }),
        createElement(CartObserver),
      ),
    );
  });
}

function purchaseButton() {
  return [...container.querySelectorAll("button")].find((button) =>
    /THÊM VÀO GIỎ|TẠM HẾT HÀNG|ĐÃ ĐẠT GIỚI HẠN/.test(button.textContent ?? ""),
  );
}

describe("ProductPurchasePanel", () => {
  it("selects the first in-stock variant and enables Add To Cart after hydration", async () => {
    await renderPanel();

    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.checked).toBe(false);
    expect(radios[1]?.checked).toBe(true);
    expect(container.textContent).toContain("150.000 ₫");
    expect(container.textContent).toContain("CÒN HÀNG");
    expect(container.querySelector("del")?.textContent).toContain("175.000 ₫");
    expect(purchaseButton()?.textContent).toContain("THÊM VÀO GIỎ");
    expect(purchaseButton()?.disabled).toBe(false);
  });

  it("server-renders Add To Cart disabled before hydration", () => {
    const html = renderToStaticMarkup(
      createElement(
        CartProvider,
        null,
        createElement(ProductPurchasePanel, { product }),
      ),
    );

    expect(html).toContain("THÊM VÀO GIỎ");
    expect(html).toContain("disabled");
  });

  it("selects the first variant when all are unavailable and disables purchase", async () => {
    await renderPanel({
      ...product,
      variants: product.variants.map((variant) => ({ ...variant, inStock: false })),
    });

    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios[0]?.checked).toBe(true);
    expect(container.textContent).toContain("TẠM HẾT HÀNG");
    expect(purchaseButton()?.disabled).toBe(true);
  });

  it("changes selected price and disables add for an unavailable radio", async () => {
    await renderPanel();
    const unavailableRadio = container.querySelector<HTMLInputElement>(
      `input[value="${product.variants[0]!.id}"]`,
    );

    await act(async () => unavailableRadio?.click());

    expect(unavailableRadio?.checked).toBe(true);
    expect(container.textContent).toContain("100.000 ₫");
    expect(container.textContent).toContain("TẠM HẾT HÀNG");
    expect(container.querySelector("del")).toBeNull();
    expect(purchaseButton()?.disabled).toBe(true);
  });

  it("adds exactly one selected snapshot, merges repeats, and announces success", async () => {
    await renderPanel();
    const button = purchaseButton();

    await act(async () => button?.click());
    expect(container.querySelector("[data-cart-state]")?.textContent).toBe("1|1");
    expect(container.textContent).toContain("ĐÃ THÊM VÀO GIỎ");

    await act(async () => button?.click());
    expect(container.querySelector("[data-cart-state]")?.textContent).toBe("2|2");

    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null");
    expect(stored).toEqual({
      version: 1,
      items: [
        {
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          variantId: product.variants[1]!.id,
          variantLabel: product.variants[1]!.label,
          image: { url: "/fixture-product.png", alt: "Ảnh sản phẩm fixture" },
          unitPriceVndSnapshot: 150_000,
          quantity: 2,
        },
      ],
    });
  });

  it("disables the action instead of claiming success at the canonical maximum", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [
          {
            productId: product.id,
            productSlug: product.slug,
            productName: product.name,
            variantId: product.variants[1]!.id,
            variantLabel: product.variants[1]!.label,
            image: { url: "/fixture-product.png", alt: "Ảnh sản phẩm fixture" },
            unitPriceVndSnapshot: 150_000,
            quantity: MAX_QUANTITY_PER_VARIANT,
          },
        ],
      }),
    );

    await renderPanel();

    expect(purchaseButton()?.disabled).toBe(true);
    expect(purchaseButton()?.textContent).toContain("ĐÃ ĐẠT GIỚI HẠN");
    expect(container.textContent).not.toContain("ĐÃ THÊM VÀO GIỎ");
  });

  it("does not leave stale success feedback after a real add reaches the maximum", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [
          {
            productId: product.id,
            productSlug: product.slug,
            productName: product.name,
            variantId: product.variants[1]!.id,
            variantLabel: product.variants[1]!.label,
            image: { url: "/fixture-product.png", alt: "Ảnh sản phẩm fixture" },
            unitPriceVndSnapshot: 150_000,
            quantity: MAX_QUANTITY_PER_VARIANT - 1,
          },
        ],
      }),
    );

    await renderPanel();
    await act(async () => purchaseButton()?.click());

    expect(container.querySelector("[data-cart-state]")?.textContent).toBe("20|20");
    expect(purchaseButton()?.disabled).toBe(true);
    expect(purchaseButton()?.textContent).toContain("ĐÃ ĐẠT GIỚI HẠN");
    expect(container.textContent).not.toContain("ĐÃ THÊM VÀO GIỎ");
  });

  it("exposes unavailable semantics without inventory quantities", async () => {
    await renderPanel();
    const unavailableRadio = container.querySelector<HTMLInputElement>(
      `input[value="${product.variants[0]!.id}"]`,
    );
    const describedBy = unavailableRadio?.getAttribute("aria-describedby");

    expect(describedBy).toBeTruthy();
    expect(container.querySelector(`#${describedBy}`)?.textContent).toContain(
      "Tạm hết hàng",
    );
    expect(container.textContent?.toLowerCase()).not.toContain("quantity");
    expect(container.textContent?.toLowerCase()).not.toContain("reserved");
  });

  it("renders a pending state with no price or purchase action for zero variants", async () => {
    await renderPanel({ ...product, variants: [] });

    expect(container.textContent).toContain("ĐANG CẬP NHẬT");
    expect(container.querySelector('input[type="radio"]')).toBeNull();
    expect(container.textContent).not.toContain("₫");
    expect(purchaseButton()).toBeUndefined();
  });
});
