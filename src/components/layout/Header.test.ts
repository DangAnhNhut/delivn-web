// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CartProvider } from "@/components/cart/CartProvider";

import { Header } from "./Header";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

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

async function renderHeader() {
  await act(async () => {
    root.render(createElement(CartProvider, null, createElement(Header)));
  });
}

describe("Header navigation", () => {
  it("renders the two-tier header with brand strip, centered logo, search, and cart", async () => {
    await renderHeader();

    expect(container.textContent).toContain("DELIVN");
    expect(container.textContent).toContain("Modern delicious Vietnam coffee.");
    expect(container.querySelector('a[aria-label="DELIVN — Trang chủ"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Mở menu"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Tìm kiếm"]')).not.toBeNull();
    expect(container.querySelector('a[href="/gio-hang"]')).not.toBeNull();
  });

  it("opens the navigation drawer with commerce-first links", async () => {
    await renderHeader();
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Mở menu"]')?.click();
    });

    const drawerNav = container.querySelector('nav[aria-label="Menu điều hướng"]');
    expect(drawerNav?.querySelector('a[href="/"]')?.textContent).toBe("TRANG CHỦ");
    expect(drawerNav?.querySelector('a[href="/san-pham"]')?.textContent).toBe("SẢN PHẨM");
    expect(drawerNav?.querySelector('a[href="/lien-he"]')?.textContent).toBe("LIÊN HỆ");
    expect(drawerNav?.querySelector('a[href="/gio-hang"]')?.textContent).toContain("GIỎ HÀNG");
    expect(drawerNav?.querySelector('a[href="/cau-chuyen"]')).toBeNull();
    expect(drawerNav?.querySelector('a[href="/cach-pha"]')).toBeNull();
  });
});
