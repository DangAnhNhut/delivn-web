// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { CART_STORAGE_KEY } from "./cart-types";
import {
  parseCartStorage,
  readCartStorage,
  serializeCart,
  writeCartStorage,
} from "./cart-storage";

const item = {
  productId: "00000000-0000-4000-8000-000000000001",
  productSlug: "ca-phe-delivn",
  productName: "Cà phê DELIVN",
  variantId: "00000000-0000-4000-8000-000000000002",
  variantLabel: "250g",
  image: { url: "/products/delivn.png", alt: "Gói cà phê DELIVN" },
  unitPriceVndSnapshot: 125_000,
  quantity: 2,
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("cart storage parsing", () => {
  it("parses and canonicalizes a valid v1 payload", () => {
    const raw = JSON.stringify({ version: 1, items: [item] }, null, 2);

    expect(parseCartStorage(raw)).toEqual({
      ok: true,
      payload: { version: 1, items: [item] },
      serialized: JSON.stringify({ version: 1, items: [item] }),
    });
  });

  it.each([
    ["malformed JSON", "{"],
    ["unknown version", JSON.stringify({ version: 2, items: [] })],
    ["invalid item", JSON.stringify({ version: 1, items: [{ ...item, variantId: "bad" }] })],
    ["invalid quantity", JSON.stringify({ version: 1, items: [{ ...item, quantity: 0 }] })],
    ["corrupt price", JSON.stringify({ version: 1, items: [{ ...item, unitPriceVndSnapshot: -1 }] })],
    ["unexpected field", JSON.stringify({ version: 1, items: [{ ...item, price: 1 }] })],
  ])("rejects %s without side effects", (_label, raw) => {
    localStorage.setItem(CART_STORAGE_KEY, "preserve");

    expect(parseCartStorage(raw)).toEqual({ ok: false });
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBe("preserve");
  });
});

describe("initial cart storage reading", () => {
  it("returns the canonical empty payload when the key is absent", () => {
    expect(readCartStorage(localStorage)).toEqual({
      payload: { version: 1, items: [] },
      serialized: JSON.stringify({ version: 1, items: [] }),
    });
  });

  it("returns a valid stored payload", () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items: [item] }));

    expect(readCartStorage(localStorage).payload.items).toEqual([item]);
  });

  it("removes invalid initial storage and returns empty", () => {
    localStorage.setItem(CART_STORAGE_KEY, "not-json");

    expect(readCartStorage(localStorage).payload.items).toEqual([]);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it("survives unavailable browser storage", () => {
    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new DOMException("denied");
      }),
    } as unknown as Storage;

    expect(readCartStorage(unavailableStorage).payload.items).toEqual([]);
  });
});

describe("cart storage writing", () => {
  it("serializes a strict v1 payload and writes the exact cart key", () => {
    const serialized = serializeCart([item]);

    expect(writeCartStorage(localStorage, serialized)).toBe(true);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBe(serialized);
  });

  it("reports a blocked write without throwing", () => {
    const unavailableStorage = {
      setItem: vi.fn(() => {
        throw new DOMException("denied");
      }),
    } as unknown as Storage;

    expect(writeCartStorage(unavailableStorage, serializeCart([]))).toBe(false);
  });
});
