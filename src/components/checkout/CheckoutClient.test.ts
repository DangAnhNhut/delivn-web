// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CartProvider } from "@/components/cart/CartProvider";
import type { OrderDTO } from "@/contracts";
import { CART_STORAGE_KEY, type CartItem } from "@/lib/cart/cart-types";

import { CheckoutClient } from "./CheckoutClient";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const first: CartItem = {
  productId: "00000000-0000-4000-8000-000000000010",
  productSlug: "ca-phe-a",
  productName: "Cà phê A",
  variantId: "00000000-0000-4000-8000-000000000001",
  variantLabel: "250g",
  image: { url: "/products/a.png", alt: "Gói cà phê A" },
  unitPriceVndSnapshot: 125_000,
  quantity: 2,
};

const second: CartItem = {
  productId: "00000000-0000-4000-8000-000000000020",
  productSlug: "ca-phe-b",
  productName: "Cà phê B",
  variantId: "00000000-0000-4000-8000-000000000002",
  variantLabel: "500g",
  image: null,
  unitPriceVndSnapshot: 220_000,
  quantity: 1,
};

const order: OrderDTO = {
  id: "00000000-0000-4000-8000-000000000099",
  orderNumber: "DLV-20260924-000042",
  totalVnd: 510_000,
  paymentMethod: "cod",
  orderStatus: "pending",
  paymentStatus: "unpaid",
  createdAt: "2026-09-24T09:00:00.000Z",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function storeCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items }));
}

async function mount(items: CartItem[] = [first]) {
  storeCart(items);
  await act(async () => {
    root.render(createElement(CartProvider, null, createElement(CheckoutClient)));
  });
}

function setControl(name: string, value: string) {
  const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[name="${name}"]`,
  );
  if (!element) throw new Error(`Missing control ${name}`);
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  act(() => {
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  return element;
}

function fillValidForm() {
  setControl("name", " Nguyễn Văn A ");
  setControl("phone", "+84 (912) 345-678");
  setControl("email", " CUSTOMER@EXAMPLE.COM ");
  setControl("address", " 123 Đường Cà Phê ");
  setControl("note", "  Giao buổi sáng  ");
  const cod = container.querySelector<HTMLInputElement>(
    'input[name="paymentMethod"][value="cod"]',
  );
  act(() => cod?.click());
}

async function submitForm() {
  const form = container.querySelector("form");
  if (!form) throw new Error("Missing checkout form");
  await act(async () => {
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

describe("CheckoutClient hydration and form", () => {
  it("server-renders a neutral hydration state without an empty conclusion or submit", () => {
    const html = renderToStaticMarkup(
      createElement(CartProvider, null, createElement(CheckoutClient)),
    );

    expect(html).toContain("ĐANG TẢI THÔNG TIN THANH TOÁN");
    expect(html).not.toContain("GIỎ HÀNG CỦA BẠN ĐANG TRỐNG");
    expect(html).not.toContain("ĐẶT HÀNG");
  });

  it("shows an intentional empty state only after hydration", async () => {
    await mount([]);

    expect(container.textContent).toContain("GIỎ HÀNG CỦA BẠN ĐANG TRỐNG");
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector('a[href="/san-pham"]')).not.toBeNull();
  });

  it("renders only canonical fields, supported methods, and a provisional summary", async () => {
    await mount([first, second]);

    expect(container.querySelector('input[name="name"]')?.getAttribute("autocomplete")).toBe(
      "name",
    );
    expect(container.querySelector('input[name="phone"]')?.getAttribute("autocomplete")).toBe(
      "tel",
    );
    expect(container.querySelector('input[name="email"]')?.getAttribute("autocomplete")).toBe(
      "email",
    );
    expect(
      container.querySelector('textarea[name="address"]')?.getAttribute("autocomplete"),
    ).toBe("street-address");
    expect(container.querySelectorAll('input[name="paymentMethod"]')).toHaveLength(2);
    expect(container.querySelector('input[value="cod"]')).not.toBeNull();
    expect(container.querySelector('input[value="bank_transfer"]')).not.toBeNull();
    expect(container.textContent).toContain("Cà phê A");
    expect(container.textContent).toContain("Cà phê B");
    expect(container.textContent).toContain("TẠM TÍNH THAM KHẢO");
    expect(container.textContent).toContain("470.000 ₫");
    expect(container.textContent).toContain(
      "Giá và tình trạng sản phẩm sẽ được xác nhận lại khi đặt hàng.",
    );
    expect(container.textContent).not.toContain("MIỄN PHÍ VẬN CHUYỂN");
    expect(container.querySelector('input[name="company"]')).toBeNull();
  });

  it("links validation errors and prevents a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    await mount();

    await submitForm();

    expect(fetcher).not.toHaveBeenCalled();
    const summary = container.querySelector<HTMLElement>("[data-checkout-error]");
    expect(summary?.textContent).toContain("Thông tin đặt hàng chưa hợp lệ");
    expect(document.activeElement).toBe(summary);
    expect(container.querySelector('input[name="name"]')?.getAttribute("aria-describedby")).toContain(
      "checkout-name-error",
    );
    expect(container.querySelector('[role="radiogroup"]')?.getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(
      container.querySelector('[role="radiogroup"]')?.getAttribute("aria-describedby"),
    ).toBe("checkout-paymentMethod-error");
  });

  it("returns focus to the error summary after each invalid submission", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>());
    await mount();

    await submitForm();
    const summary = container.querySelector<HTMLElement>("[data-checkout-error]");
    const name = container.querySelector<HTMLInputElement>('input[name="name"]');
    expect(document.activeElement).toBe(summary);

    name?.focus();
    expect(document.activeElement).toBe(name);
    await submitForm();

    expect(document.activeElement).toBe(summary);
  });
});

describe("CheckoutClient submission", () => {
  it("posts the normalized canonical payload without commercial snapshots", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Request validation failed." } },
        { status: 400 },
      ),
    );
    vi.stubGlobal("fetch", fetcher);
    await mount();
    fillValidForm();

    await submitForm();

    const request = fetcher.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body).toEqual({
      customer: {
        name: "Nguyễn Văn A",
        phone: "+84912345678",
        email: "customer@example.com",
        address: "123 Đường Cà Phê",
        note: "Giao buổi sáng",
      },
      paymentMethod: "cod",
      items: [{ variantId: first.variantId, quantity: 2 }],
    });
    expect(JSON.stringify(body)).not.toContain("unitPriceVndSnapshot");
    expect(JSON.stringify(body)).not.toContain("productName");
  });

  it("blocks rapid click and Enter-equivalent submissions with one request", async () => {
    const pending = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetcher);
    await mount();
    fillValidForm();
    const form = container.querySelector("form")!;

    act(() => {
      form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(form.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(
      true,
    );

    await act(async () => {
      pending.resolve(
        Response.json(
          { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
          { status: 500 },
        ),
      );
      await pending.promise;
    });
  });

  it("uses valid server totals and reconciles against cart changes made while pending", async () => {
    const pending = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockReturnValue(pending.promise));
    await mount();
    fillValidForm();

    const form = container.querySelector("form")!;
    act(() => {
      form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    });
    const refreshed = {
      ...first,
      productName: "Tên mới từ tab khác",
      unitPriceVndSnapshot: 135_000,
      quantity: 3,
    };
    const incoming = JSON.stringify({ version: 1, items: [refreshed, second] });
    localStorage.setItem(CART_STORAGE_KEY, incoming);
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: CART_STORAGE_KEY,
          newValue: incoming,
          storageArea: localStorage,
        }),
      );
      pending.resolve(Response.json(order, { status: 201 }));
      await pending.promise;
    });

    expect(container.textContent).toContain("ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN");
    expect(container.textContent).toContain(order.orderNumber);
    expect(container.textContent).toContain("510.000 ₫");
    expect(document.activeElement?.textContent).toContain("ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN");
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null")).toEqual({
      version: 1,
      items: [{ ...refreshed, quantity: 1 }, second],
    });
  });

  it.each([
    ["INVALID_JSON", 400],
    ["VALIDATION_ERROR", 400],
    ["ITEM_UNAVAILABLE", 409],
    ["INSUFFICIENT_INVENTORY", 409],
    ["ORDER_VALUE_LIMIT_EXCEEDED", 422],
    ["SERVER_CONFIGURATION_ERROR", 500],
    ["INTERNAL_ERROR", 500],
  ])("preserves cart and customer input for %s", async (code, status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({ error: { code, message: "Do not render this" } }, { status }),
      ),
    );
    await mount();
    fillValidForm();

    await submitForm();

    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null").items).toEqual([
      first,
    ]);
    expect(container.querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe(
      " Nguyễn Văn A ",
    );
    expect(container.textContent).not.toContain("Do not render this");
    expect(container.textContent).not.toContain("ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN");
  });

  it.each([
    ["network", () => Promise.reject(new TypeError("network"))],
    [
      "malformed 201",
      () => Promise.resolve(Response.json({ orderNumber: "partial" }, { status: 201 })),
    ],
  ])("keeps the cart and enters uncertain UX for %s", async (_label, response) => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(response);
    vi.stubGlobal("fetch", fetcher);
    await mount();
    fillValidForm();

    await submitForm();

    expect(container.textContent).toContain("CHƯA THỂ XÁC NHẬN ĐƠN HÀNG");
    expect(container.textContent).not.toContain("ĐẶT HÀNG THẤT BẠI");
    expect(container.textContent).not.toContain("ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(
      true,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null").items).toEqual([
      first,
    ]);
    expect(container.querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe(
      " Nguyễn Văn A ",
    );
  });

  it("never persists customer PII to browser storage or a URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Request validation failed." } },
          { status: 400 },
        ),
      ),
    );
    await mount();
    fillValidForm();
    await submitForm();

    expect(localStorage.getItem(CART_STORAGE_KEY)).not.toContain("Nguyễn Văn A");
    expect(JSON.stringify({ ...localStorage })).not.toContain("customer@example.com");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("customer@example.com");
    expect(window.location.search).toBe("");
  });
});
