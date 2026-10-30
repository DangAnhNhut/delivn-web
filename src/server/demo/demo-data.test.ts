import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { DEMO_MEDIA, DEMO_PRODUCTS, DEMO_STOCK, DEMO_VARIANTS } from "./demo-data";

describe("development demo fixtures", () => {
  it("defines development products with current provided prices and synthetic stock", () => {
    expect(DEMO_PRODUCTS).toEqual([
      expect.objectContaining({
        id: "d3110000-0000-4000-8000-000000000001",
        slug: "dev-demo-delivn-espresso",
        name: "DELIVN ESPRESSO — DEMO PHÁT TRIỂN",
        category: "espresso",
        status: "active",
      }),
      expect.objectContaining({
        id: "d3110000-0000-4000-8000-000000000002",
        slug: "dev-demo-delivn-rang-xay",
        name: "DELIVN RANG XAY — DEMO PHÁT TRIỂN",
        category: "rang_xay",
        status: "active",
      }),
    ]);
    expect(DEMO_VARIANTS.map(({ sku, label, priceVnd, active }) => ({
      sku,
      label,
      priceVnd,
      active,
    }))).toEqual([
      { sku: "DEV-DEMO-ESPRESSO-250", label: "250g", priceVnd: 173_000, active: true },
      { sku: "DEV-DEMO-ESPRESSO-500", label: "500g", priceVnd: 345_000, active: true },
      { sku: "DEV-DEMO-RANG-XAY-250", label: "250g", priceVnd: 168_000, active: true },
      { sku: "DEV-DEMO-RANG-XAY-500", label: "500g", priceVnd: 335_000, active: true },
    ]);
    expect(DEMO_VARIANTS.every((variant) => variant.compareAtPriceVnd === null)).toBe(true);
    expect(DEMO_STOCK.every((entry) => entry.quantity === 100 && entry.reservedQuantity === 0)).toBe(true);
  });

  it("uses unique deterministic identities", () => {
    const ids = [
      ...DEMO_PRODUCTS.map((item) => item.id),
      ...DEMO_VARIANTS.map((item) => item.id),
      ...DEMO_MEDIA.map((item) => item.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(DEMO_PRODUCTS.map((item) => item.slug)).size).toBe(DEMO_PRODUCTS.length);
    expect(new Set(DEMO_VARIANTS.map((item) => item.sku)).size).toBe(DEMO_VARIANTS.length);
  });

  it("references only existing approved local media", () => {
    expect(DEMO_MEDIA.map((item) => item.url)).toEqual([
      "/products/black/front.png",
      "/products/black/three-quarter.png",
      "/products/sand/front.png",
      "/products/sand/three-quarter.png",
    ]);
    for (const media of DEMO_MEDIA) {
      expect(fs.existsSync(path.join(process.cwd(), "public", media.url))).toBe(true);
    }
  });
});
