import { beforeEach, describe, expect, it, vi } from "vitest";

const notFoundError = new Error("NEXT_NOT_FOUND");
const redirectError = new Error("NEXT_REDIRECT");
const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  findDetail: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/server/auth/session", () => ({ requirePageSession: mocks.requireSession }));
vi.mock("@/server/services/customer-order.service", () => ({
  createCustomerOrderService: () => ({ findDetailByOrderNumberAndUserId: mocks.findDetail }),
}));
vi.mock("@/components/account/OrderDetail", () => ({ OrderDetail: () => null }));

import OrderPage from "./page";

describe("owned order detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notFound.mockImplementation(() => { throw notFoundError; });
    mocks.requireSession.mockResolvedValue({ user: { id: "user-a" } });
  });

  it("renders only an order returned by the user-scoped service", async () => {
    mocks.findDetail.mockResolvedValue({ orderNumber: "DLV-OWNED" });
    await expect(OrderPage({ params: Promise.resolve({ orderNumber: "DLV-OWNED" }) })).resolves.toBeTruthy();
    expect(mocks.findDetail).toHaveBeenCalledWith("DLV-OWNED", "user-a");
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it.each(["DLV-FOREIGN", "DLV-NOT-FOUND"])("uses the identical public not-found branch for %s", async (orderNumber) => {
    mocks.findDetail.mockResolvedValue(null);
    await expect(OrderPage({ params: Promise.resolve({ orderNumber }) })).rejects.toBe(notFoundError);
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("requires authentication before order lookup", async () => {
    mocks.requireSession.mockRejectedValue(redirectError);
    await expect(OrderPage({ params: Promise.resolve({ orderNumber: "DLV-OWNED" }) })).rejects.toBe(redirectError);
    expect(mocks.findDetail).not.toHaveBeenCalled();
  });
});
