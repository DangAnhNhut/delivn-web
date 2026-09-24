// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CartProvider } from "@/components/cart/CartProvider";
import { CART_STORAGE_KEY } from "@/lib/cart/cart-types";

import { CartLink } from "./CartLink";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

function item(variantId: string, quantity: number) {
  return {
    productId: "00000000-0000-4000-8000-000000000001",
    productSlug: "ca-phe-delivn",
    productName: "Cà phê DELIVN",
    variantId,
    variantLabel: "Gói",
    image: null,
    unitPriceVndSnapshot: 125_000,
    quantity,
  };
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

async function renderWith(items: ReturnType<typeof item>[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items }));
  await act(async () => {
    root.render(
      createElement(CartProvider, null, createElement(CartLink)),
    );
  });
}

describe("CartLink", () => {
  it("server-renders count zero for hydration stability", () => {
    const html = renderToStaticMarkup(
      createElement(CartProvider, null, createElement(CartLink)),
    );

    expect(html).toContain("GIỎ HÀNG");
    expect(html).toContain("(0)");
  });

  it.each([
    ["one line quantity one", [item("00000000-0000-4000-8000-000000000002", 1)], 1],
    ["one line quantity three", [item("00000000-0000-4000-8000-000000000002", 3)], 3],
    [
      "two lines sum quantities",
      [
        item("00000000-0000-4000-8000-000000000002", 2),
        item("00000000-0000-4000-8000-000000000003", 4),
      ],
      6,
    ],
  ])("renders %s as GIỎ HÀNG (%i)", async (_label, items, expected) => {
    await renderWith(items);

    const link = container.querySelector("a");
    expect(link?.textContent).toContain(`GIỎ HÀNG (${expected})`);
    expect(link?.getAttribute("aria-label")).toBe(`GIỎ HÀNG (${expected})`);
  });
});
