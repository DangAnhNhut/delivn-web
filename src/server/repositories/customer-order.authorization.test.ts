import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("customer order authorization boundaries", () => {
  it("scopes list and detail SQL by the session user in-query", () => {
    const source = readFileSync(new URL("./customer-order.repository.ts", import.meta.url), "utf8");
    expect(source).toContain("eq(orders.userId, userId)");
    expect(source).toContain("and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId))");
    expect(source).not.toMatch(/findDetailByOrderNumber\([^]*\.filter/);
  });

  it("uses one public not-found branch for every unowned or missing detail", () => {
    const source = readFileSync(
      new URL("../../app/(storefront)/tai-khoan/don-hang/[orderNumber]/page.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("findDetailByOrderNumberAndUserId(orderNumber, session.user.id)");
    expect(source).toContain("if (!order) notFound()");
    expect(source).not.toMatch(/forbidden|unauthorized|foreign/i);
  });
});
