// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ProductVariantDTO } from "@/contracts";

import { ProductPurchasePanel } from "./ProductPurchasePanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const variants: ProductVariantDTO[] = [
  {
    id: "variant-unavailable",
    sku: "FIXTURE-250",
    label: "Gói nhỏ",
    weightGrams: 250,
    priceVnd: 100_000,
    compareAtPriceVnd: null,
    inStock: false,
  },
  {
    id: "variant-available",
    sku: "FIXTURE-500",
    label: "Gói lớn",
    weightGrams: 500,
    priceVnd: 150_000,
    compareAtPriceVnd: 175_000,
    inStock: true,
  },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderPanel(productVariants: readonly ProductVariantDTO[]) {
  act(() => {
    root.render(
      createElement(ProductPurchasePanel, {
        productName: "Sản phẩm fixture",
        variants: productVariants,
      }),
    );
  });
}

describe("ProductPurchasePanel", () => {
  it("loads in jsdom without server-only dependencies and selects the first in-stock variant", () => {
    renderPanel(variants);

    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.checked).toBe(false);
    expect(radios[1]?.checked).toBe(true);
    expect(container.textContent).toContain("150.000 ₫");
    expect(container.textContent).toContain("CÒN HÀNG");
    expect(container.querySelector("del")?.textContent).toContain("175.000 ₫");
  });

  it("selects the first variant when all are unavailable and states that explicitly", () => {
    renderPanel(variants.map((item) => ({ ...item, inStock: false })));

    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios[0]?.checked).toBe(true);
    expect(container.textContent).toContain("TẠM HẾT HÀNG");
  });

  it("changes the selected price and availability when another radio is chosen", () => {
    renderPanel(variants);

    const unavailableRadio = container.querySelector<HTMLInputElement>(
      'input[value="variant-unavailable"]',
    );
    expect(unavailableRadio).not.toBeNull();

    act(() => unavailableRadio?.click());

    expect(unavailableRadio?.checked).toBe(true);
    expect(container.textContent).toContain("100.000 ₫");
    expect(container.textContent).toContain("TẠM HẾT HÀNG");
    expect(container.querySelector("del")).toBeNull();
  });

  it("exposes unavailable semantics without inventory quantities or fake cart behavior", () => {
    renderPanel(variants);

    const unavailableRadio = container.querySelector<HTMLInputElement>(
      'input[value="variant-unavailable"]',
    );
    const describedBy = unavailableRadio?.getAttribute("aria-describedby");

    expect(describedBy).toBeTruthy();
    expect(container.querySelector(`#${describedBy}`)?.textContent).toContain(
      "Tạm hết hàng",
    );
    expect(container.textContent?.toLowerCase()).not.toContain("quantity");
    expect(container.textContent?.toLowerCase()).not.toContain("reserved");
    expect(container.textContent).not.toContain("Thêm vào giỏ");
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders a restrained pending state with no price when variants are empty", () => {
    renderPanel([]);

    expect(container.textContent).toContain("ĐANG CẬP NHẬT");
    expect(container.querySelector('input[type="radio"]')).toBeNull();
    expect(container.textContent).not.toContain("₫");
  });
});
