// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";
import { CART_STORAGE_KEY, type CartItem } from "@/lib/cart/cart-types";

import { CartProvider } from "./CartProvider";
import { CartPage } from "./CartPage";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const first: CartItem = {
  productId: "00000000-0000-4000-8000-000000000001",
  productSlug: "dev-local-delivn-espresso",
  productName: "Cà phê hạt rang Espresso",
  variantId: "00000000-0000-4000-8000-000000000002",
  variantLabel: "250g",
  image: { url: "/products/legacy-gray-a.png", alt: "Gói cà phê Espresso cũ" },
  unitPriceVndSnapshot: 125_000,
  quantity: 2,
};

const second: CartItem = {
  productId: "00000000-0000-4000-8000-000000000003",
  productSlug: "dev-local-delivn-rang-xay",
  productName: "Cà phê rang xay",
  variantId: "00000000-0000-4000-8000-000000000004",
  variantLabel: "500g",
  image: { url: "/products/legacy-gray-b.png", alt: "Gói cà phê Rang Xay cũ" },
  unitPriceVndSnapshot: 200_000,
  quantity: 1,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items }));
  await act(async () => {
    root.render(createElement(CartProvider, null, createElement(CartPage)));
  });
}

function button(label: string) {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
}

describe("CartPage", () => {
  it("server-renders a neutral hydration state without flashing the empty cart", () => {
    const html = renderToStaticMarkup(
      createElement(CartProvider, null, createElement(CartPage)),
    );

    expect(html).toContain("ĐANG TẢI GIỎ HÀNG");
    expect(html).not.toContain("GIỎ HÀNG CỦA BẠN ĐANG TRỐNG");
    expect(html).not.toContain('href="/thanh-toan"');
  });

  it("renders the intentional empty state after hydration", async () => {
    await renderCart([]);

    expect(container.textContent).toContain("GIỎ HÀNG CỦA BẠN ĐANG TRỐNG");
    expect(container.querySelector('a[href="/san-pham"]')?.textContent).toContain(
      "KHÁM PHÁ SẢN PHẨM",
    );
    expect(container.querySelector('a[href="/thanh-toan"]')).toBeNull();
  });

  it("renders persisted snapshots, product navigation, line totals, and subtotal", async () => {
    await renderCart([first, second]);

    expect(container.textContent).toContain("LỰA CHỌN CỦA BẠN");
    expect(container.textContent).not.toContain("LỰA CHỌN CỦA BẠN.");
    expect(container.textContent).toContain(
      "3 sản phẩm đang chờ bạn hoàn tất đơn hàng.",
    );
    expect(
      container.querySelector(
        'img[src="/products/reference/500g_black_reference.jpg"]',
      )?.getAttribute("alt"),
    ).toBe("Bao bì DELIVN Espresso");
    expect(
      container.querySelector(
        'img[src="/products/reference/500g_sand_reference.jpg"]',
      )?.getAttribute("alt"),
    ).toBe("Bao bì DELIVN Rang Xay");
    expect(container.querySelector('img[src*="legacy-gray"]')).toBeNull();
    expect(
      container.querySelector('a[href="/san-pham/dev-local-delivn-espresso"]')
        ?.textContent,
    ).toContain(
      "Cà phê hạt rang Espresso",
    );
    expect(
      container.querySelector('a[href="/san-pham/dev-local-delivn-rang-xay"]')
        ?.textContent,
    ).toContain(
      "Cà phê rang xay",
    );
    expect(container.textContent).toContain("250.000 ₫");
    expect(container.textContent).toContain("450.000 ₫");
  });

  it("increments and decrements with explicit minimum and maximum states", async () => {
    await renderCart([first]);
    const decrementLabel = "Giảm số lượng Cà phê hạt rang Espresso – 250g";
    const incrementLabel = "Tăng số lượng Cà phê hạt rang Espresso – 250g";

    await act(async () => button(decrementLabel)?.click());
    expect(container.querySelector("[data-quantity]")?.textContent).toBe("1");
    expect(button(decrementLabel)?.disabled).toBe(true);

    await act(async () => button(incrementLabel)?.click());
    expect(container.querySelector("[data-quantity]")?.textContent).toBe("2");

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [{ ...first, quantity: MAX_QUANTITY_PER_VARIANT }],
      }),
    );
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: CART_STORAGE_KEY,
          newValue: localStorage.getItem(CART_STORAGE_KEY),
          storageArea: localStorage,
        }),
      );
    });

    expect(container.querySelector("[data-quantity]")?.textContent).toBe("20");
    expect(button(incrementLabel)?.disabled).toBe(true);
  });

  it("removes one line and clears the cart through explicit actions", async () => {
    await renderCart([first, second]);

    await act(async () =>
      button("Xóa Cà phê hạt rang Espresso – 250g khỏi giỏ hàng")?.click(),
    );
    expect(container.textContent).not.toContain("Cà phê hạt rang Espresso");
    expect(container.textContent).toContain("Cà phê rang xay");

    await act(async () => button("Xóa giỏ hàng")?.click());
    expect(container.textContent).toContain("GIỎ HÀNG CỦA BẠN ĐANG TRỐNG");
  });

  it("labels totals as snapshots and exposes real checkout navigation without posting", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await renderCart([first]);

    expect(container.textContent).toContain("TẠM TÍNH");
    expect(container.textContent).toContain(
      "Giá và tình trạng sản phẩm sẽ được xác nhận lại khi thanh toán.",
    );
    expect(container.textContent).not.toContain("PHÍ VẬN CHUYỂN");
    expect(container.querySelector('a[href="/thanh-toan"]')?.textContent).toContain(
      "TIẾP TỤC THANH TOÁN",
    );
    expect(container.querySelector('a[href="/san-pham"]')?.textContent).toContain(
      "TIẾP TỤC CHỌN CÀ PHÊ",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
