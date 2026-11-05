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
  it("renders the commerce-first desktop navigation without dead links", async () => {
    await renderHeader();
    const desktopNavigation = container.querySelector('nav[aria-label="Menu chính"]');

    expect(desktopNavigation?.querySelector('a[href="/"]')?.textContent).toBe(
      "TRANG CHỦ",
    );
    expect(
      desktopNavigation?.querySelector('a[href="/san-pham"]')?.textContent,
    ).toBe("SẢN PHẨM");
    expect(desktopNavigation?.querySelector('a[href="/lien-he"]')?.textContent).toBe(
      "LIÊN HỆ",
    );
    expect(desktopNavigation?.querySelector('a[href="/cau-chuyen"]')).toBeNull();
    expect(desktopNavigation?.querySelector('a[href="/cach-pha"]')).toBeNull();
    expect(container.querySelector('a[href="/gio-hang"]')?.textContent).toContain(
      "GIỎ HÀNG",
    );
  });

  it("uses the same commerce-first links in the mobile menu", async () => {
    await renderHeader();
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Mở menu"]')?.click();
    });
    const mobileNavigation = container.querySelector('nav[aria-label="Menu di động"]');

    expect(mobileNavigation?.querySelector('a[href="/"]')?.textContent).toBe(
      "TRANG CHỦ",
    );
    expect(
      mobileNavigation?.querySelector('a[href="/san-pham"]')?.textContent,
    ).toBe("SẢN PHẨM");
    expect(mobileNavigation?.querySelector('a[href="/lien-he"]')?.textContent).toBe(
      "LIÊN HỆ",
    );
    expect(mobileNavigation?.querySelector('a[href="/gio-hang"]')?.textContent).toContain(
      "GIỎ HÀNG",
    );
    expect(mobileNavigation?.querySelector('a[href="/cau-chuyen"]')).toBeNull();
    expect(mobileNavigation?.querySelector('a[href="/cach-pha"]')).toBeNull();
  });
});
