// @vitest-environment jsdom

import {
  act,
  createElement,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CART_STORAGE_KEY, type CartItemSnapshot } from "@/lib/cart/cart-types";

import { CartProvider, useCart } from "./CartProvider";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const snapshot: CartItemSnapshot = {
  productId: "00000000-0000-4000-8000-000000000001",
  productSlug: "ca-phe-delivn",
  productName: "Cà phê DELIVN",
  variantId: "00000000-0000-4000-8000-000000000002",
  variantLabel: "250g",
  image: { url: "/products/delivn.png", alt: "Gói cà phê DELIVN" },
  unitPriceVndSnapshot: 125_000,
};

function serializedCart(quantity: number, name = snapshot.productName) {
  return JSON.stringify({
    version: 1,
    items: [{ ...snapshot, productName: name, quantity }],
  });
}

function CartHarness() {
  const cart = useCart();
  return createElement(
    "div",
    null,
    createElement(
      "output",
      { "data-state": true },
      `${cart.items[0]?.quantity ?? 0}|${cart.itemCount}|${cart.isHydrated}`,
    ),
    createElement("output", { "data-items": true }, JSON.stringify(cart.items)),
    createElement(
      "button",
      { type: "button", onClick: () => cart.addItem(snapshot) },
      "add",
    ),
    createElement(
      "button",
      { type: "button", onClick: () => cart.clearCart() },
      "clear",
    ),
    createElement(
      "button",
      {
        type: "button",
        onClick: () =>
          cart.reconcileSubmittedItems([
            { variantId: snapshot.variantId, quantity: 2 },
          ]),
      },
      "reconcile",
    ),
  );
}

function EarlyMutationProbe() {
  const {
    addItem,
    increment,
    decrement,
    removeItem,
    clearCart,
    reconcileSubmittedItems,
  } = useCart();

  useLayoutEffect(() => {
    addItem(snapshot);
    increment(snapshot.variantId);
    decrement(snapshot.variantId);
    removeItem(snapshot.variantId);
    clearCart();
    reconcileSubmittedItems([{ variantId: snapshot.variantId, quantity: 2 }]);
  }, [
    addItem,
    clearCart,
    decrement,
    increment,
    reconcileSubmittedItems,
    removeItem,
  ]);

  return createElement(CartHarness);
}

function providerWith(children: ReactNode) {
  return createElement(CartProvider, null, children);
}

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

async function mount(children: ReactNode = createElement(CartHarness)) {
  await act(async () => {
    root.render(providerWith(children));
  });
}

function stateText() {
  return container.querySelector("[data-state]")?.textContent;
}

describe("CartProvider hydration", () => {
  it("server-renders the same empty unhydrated snapshot as the first client render", () => {
    expect(renderToStaticMarkup(providerWith(createElement(CartHarness)))).toContain(
      "0|0|false",
    );
  });

  it("hydrates a valid persisted cart without writing it back", async () => {
    localStorage.setItem(CART_STORAGE_KEY, serializedCart(2));
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    await mount();

    expect(stateText()).toBe("2|2|true");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("blocks an early mutation so it cannot overwrite or replace persisted data", async () => {
    localStorage.setItem(CART_STORAGE_KEY, serializedCart(2));
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    await mount(createElement(EarlyMutationProbe));

    expect(stateText()).toBe("2|2|true");
    expect(setItem).not.toHaveBeenCalled();

    const addButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "add",
    );
    await act(async () => addButton?.click());

    expect(stateText()).toBe("3|3|true");
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("hydrates empty and keeps in-memory actions usable when the localStorage getter throws", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    expect(descriptor).toBeDefined();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });

    try {
      await mount();
      expect(stateText()).toBe("0|0|true");

      const addButton = [...container.querySelectorAll("button")].find(
        (button) => button.textContent === "add",
      );
      await act(async () => addButton?.click());

      expect(stateText()).toBe("1|1|true");
    } finally {
      Object.defineProperty(window, "localStorage", descriptor!);
    }
  });
});

describe("CartProvider cross-tab synchronization", () => {
  it("adopts a valid exact-key payload without writing it back", async () => {
    await mount();
    const incoming = serializedCart(4, "Tên mới từ tab khác");
    localStorage.setItem(CART_STORAGE_KEY, incoming);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: CART_STORAGE_KEY,
          newValue: incoming,
          storageArea: localStorage,
        }),
      );
    });

    expect(stateText()).toBe("4|4|true");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("adopts an external key removal without recreating the empty key", async () => {
    localStorage.setItem(CART_STORAGE_KEY, serializedCart(2));
    await mount();
    localStorage.removeItem(CART_STORAGE_KEY);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: CART_STORAGE_KEY,
          newValue: null,
          storageArea: localStorage,
        }),
      );
    });

    expect(stateText()).toBe("0|0|true");
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([
    ["unrelated key", "other.key", serializedCart(6)],
    ["malformed payload", CART_STORAGE_KEY, "{"],
    ["unknown version", CART_STORAGE_KEY, JSON.stringify({ version: 2, items: [] })],
  ])("ignores %s events", async (_label, key, newValue) => {
    localStorage.setItem(CART_STORAGE_KEY, serializedCart(2));
    await mount();

    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
    });

    expect(stateText()).toBe("2|2|true");
  });

  it("ignores the cart key from a different storage area", async () => {
    localStorage.setItem(CART_STORAGE_KEY, serializedCart(2));
    await mount();

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: CART_STORAGE_KEY,
          newValue: serializedCart(6),
          storageArea: sessionStorage,
        }),
      );
    });

    expect(stateText()).toBe("2|2|true");
  });

  it("reconciles against the latest cross-tab cart and persists only the remainder", async () => {
    localStorage.setItem(CART_STORAGE_KEY, serializedCart(2));
    await mount();

    const other = {
      ...snapshot,
      productId: "00000000-0000-4000-8000-000000000010",
      variantId: "00000000-0000-4000-8000-000000000011",
      productName: "Cà phê B",
      quantity: 4,
    };
    const refreshed = {
      ...snapshot,
      productName: "Tên mới từ tab khác",
      unitPriceVndSnapshot: 135_000,
      quantity: 3,
    };
    const incoming = JSON.stringify({ version: 1, items: [refreshed, other] });
    localStorage.setItem(CART_STORAGE_KEY, incoming);

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: CART_STORAGE_KEY,
          newValue: incoming,
          storageArea: localStorage,
        }),
      );
    });

    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const reconcile = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "reconcile",
    );
    await act(async () => reconcile?.click());

    const rendered = JSON.parse(
      container.querySelector("[data-items]")?.textContent ?? "[]",
    );
    expect(rendered).toEqual([{ ...refreshed, quantity: 1 }, other]);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null")).toEqual({
      version: 1,
      items: [{ ...refreshed, quantity: 1 }, other],
    });
    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
