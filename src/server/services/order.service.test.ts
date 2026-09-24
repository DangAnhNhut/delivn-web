import { describe, expect, it } from "vitest";

import type { OrderRecord } from "@/server/repositories/order.repository";

import { mapOrderToDto } from "./order.service";

describe("mapOrderToDto", () => {
  it("returns the canonical public order contract", () => {
    const record: OrderRecord = {
      id: "00000000-0000-4000-8000-000000000001",
      orderNumber: "DLV-20260923-000041",
      totalVnd: 470_000,
      paymentMethod: "cod",
      orderStatus: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date("2026-09-23T09:00:00.000Z"),
    };

    expect(mapOrderToDto(record)).toEqual({
      id: record.id,
      orderNumber: "DLV-20260923-000041",
      totalVnd: 470_000,
      paymentMethod: "cod",
      orderStatus: "pending",
      paymentStatus: "unpaid",
      createdAt: "2026-09-23T09:00:00.000Z",
    });
  });
});
