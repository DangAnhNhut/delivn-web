import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth/LogoutButton", () => ({ LogoutButton: () => createElement("button", null, "ĐĂNG XUẤT") }));

import { AccountDashboard } from "./AccountDashboard";
import { OrderList } from "./OrderList";
import { OrderDetail } from "./OrderDetail";

const summary = { orderNumber: "DLV-1", totalVnd: 100000, paymentMethod: "cod" as const, paymentStatus: "unpaid" as const, orderStatus: "pending" as const, createdAt: "2026-11-06T00:00:00.000Z", itemCount: 2 };

describe("account presentation", () => {
  it("shows identity and order navigation without internal ids", () => {
    const html = renderToStaticMarkup(createElement(AccountDashboard, { name: "Khach Hang", email: "customer@example.com" }));
    expect(html).toContain("Khach Hang"); expect(html).toContain("/tai-khoan/don-hang"); expect(html).not.toContain("userId");
  });
  it("handles empty and populated order lists", () => {
    expect(renderToStaticMarkup(createElement(OrderList, { orders: [] }))).toContain("CHƯA CÓ ĐƠN HÀNG");
    const html = renderToStaticMarkup(createElement(OrderList, { orders: [summary] }));
    expect(html).toContain("DLV-1");
    expect(html).toContain("cod");
    expect(html).toContain("unpaid");
    expect(html).toContain("pending");
  });
  it("renders authoritative detail snapshots without auth/inventory internals", () => {
    const html = renderToStaticMarkup(createElement(OrderDetail, { order: { ...summary, customer: { name: "A", phone: "0912345678", email: null, address: "Dia chi", note: "Giao buoi sang" }, subtotalVnd: 100000, shippingFeeVnd: 0, items: [{ productName: "Coffee", variantName: "250g", unitPriceVnd: 100000, quantity: 1, lineTotalVnd: 100000 }], statusHistory: [{ fromStatus: null, toStatus: "pending", note: "Order created", createdAt: "2026-11-06T00:00:00.000Z" }] } }));
    expect(html).toContain("Coffee");
    expect(html).toContain("100.000");
    expect(html).toContain("Giao buoi sang");
    expect(html).toContain("Order created");
    expect(html).toContain("cod");
    expect(html).toContain("06/11/2026");
    expect(html).not.toMatch(/reserved|password|token|userId/i);
  });
});
