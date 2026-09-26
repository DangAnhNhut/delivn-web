import { describe, expect, it, vi } from "vitest";

import type { CheckoutInput, OrderDTO } from "@/contracts";

import { postCheckout } from "./checkout-http";

const input: CheckoutInput = {
  customer: {
    name: "Nguyễn Văn A",
    phone: "+84912345678",
    email: "customer@example.com",
    address: "123 Đường Cà Phê",
    note: "Giao buổi sáng",
  },
  paymentMethod: "cod",
  items: [
    {
      variantId: "00000000-0000-4000-8000-000000000001",
      quantity: 2,
    },
  ],
};

const order: OrderDTO = {
  id: "00000000-0000-4000-8000-000000000099",
  orderNumber: "DLV-20260924-000042",
  totalVnd: 470_000,
  paymentMethod: "cod",
  orderStatus: "pending",
  paymentStatus: "unpaid",
  createdAt: "2026-09-24T09:00:00.000Z",
};

describe("postCheckout", () => {
  it("posts the canonical input once and accepts the real serialized OrderDTO", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(order, { status: 201 }),
    );

    await expect(postCheckout(input, fetcher)).resolves.toEqual({ ok: true, order });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it.each([
    ["invalid id", { ...order, id: "not-a-uuid" }],
    ["invalid payment method", { ...order, paymentMethod: "card" }],
    ["invalid order status", { ...order, orderStatus: "unknown" }],
    ["invalid payment status", { ...order, paymentStatus: "unknown" }],
    ["negative total", { ...order, totalVnd: -1 }],
    ["fractional total", { ...order, totalVnd: 1.5 }],
    ["invalid createdAt", { ...order, createdAt: "24/09/2026" }],
  ])("treats a 201 %s body as uncertain", async (_label, body) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(body, { status: 201 }),
    );

    await expect(postCheckout(input, fetcher)).resolves.toEqual({
      ok: false,
      kind: "uncertain",
      reason: "malformed_response",
    });
  });

  it("treats invalid JSON at 201 as uncertain", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("not-json", { status: 201 }),
    );

    await expect(postCheckout(input, fetcher)).resolves.toEqual({
      ok: false,
      kind: "uncertain",
      reason: "malformed_response",
    });
  });

  it("returns a known API error without exposing its message or details", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          error: {
            code: "INSUFFICIENT_INVENTORY",
            message: "Internal English message",
            details: { secret: "must-not-propagate" },
          },
        },
        { status: 409 },
      ),
    );

    await expect(postCheckout(input, fetcher)).resolves.toEqual({
      ok: false,
      kind: "api",
      status: 409,
      code: "INSUFFICIENT_INVENTORY",
    });
  });

  it("treats an undocumented response envelope as uncertain", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ message: "unknown" }, { status: 500 }),
    );

    await expect(postCheckout(input, fetcher)).resolves.toEqual({
      ok: false,
      kind: "uncertain",
      reason: "malformed_response",
    });
  });

  it("does not retry a rejected request", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("network"));

    await expect(postCheckout(input, fetcher)).resolves.toEqual({
      ok: false,
      kind: "uncertain",
      reason: "network",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
