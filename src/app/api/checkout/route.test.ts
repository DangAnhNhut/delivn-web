import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createOrder: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({ getSessionFromHeaders: mocks.getSession }));
vi.mock("@/server/services/checkout.service", () => ({
  createCheckoutService: () => ({ createOrder: mocks.createOrder }),
}));

import { POST } from "./route";

const payload = {
  customer: { name: "Nguyen Van A", phone: "0912345678", address: "1 Duong Ca Phe" },
  paymentMethod: "cod",
  items: [{ variantId: "00000000-0000-4000-8000-000000000001", quantity: 1 }],
  userId: "00000000-0000-4000-8000-000000000999",
};

describe("POST /api/checkout ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects anonymous requests before parsing or commerce work", async () => {
    mocks.getSession.mockResolvedValue(null);
    const request = new Request("http://local/api/checkout", { method: "POST", body: "not-json" });
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "AUTHENTICATION_REQUIRED" } });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("uses only the validated session user for ownership", async () => {
    const userId = "00000000-0000-4000-8000-000000000077";
    mocks.getSession.mockResolvedValue({ user: { id: userId } });
    mocks.createOrder.mockResolvedValue({ id: userId });
    const response = await POST(new Request("http://local/api/checkout", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    }));
    expect(response.status).toBe(201);
    expect(mocks.createOrder).toHaveBeenCalledWith(expect.not.objectContaining({ userId: payload.userId }), { userId });
  });
});
