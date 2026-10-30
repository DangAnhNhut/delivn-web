import { describe, expect, it } from "vitest";

import type { DbTransaction } from "@/server/db";

import { createOrderRepository } from "./order.repository";

function transactionReturning(createdAt: unknown): DbTransaction {
  return {
    async execute() {
      return {
        rows: [{ created_at: createdAt, sequence_value: "42" }],
      };
    },
  } as unknown as DbTransaction;
}

describe("order repository transaction timestamp", () => {
  it("normalizes a PostgreSQL timestamp string to a real Date", async () => {
    const result = await createOrderRepository().getNextOrderNumberParts(
      transactionReturning("2026-09-24T09:15:30.123Z"),
    );

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe("2026-09-24T09:15:30.123Z");
    expect(result.sequenceValue).toBe("42");
  });

  it("preserves an already valid Date runtime value", async () => {
    const timestamp = new Date("2026-09-24T09:15:30.123Z");

    const result = await createOrderRepository().getNextOrderNumberParts(
      transactionReturning(timestamp),
    );

    expect(result.createdAt).toBe(timestamp);
  });

  it.each(["not-a-timestamp", 1_727_168_130_123, new Date(Number.NaN)])(
    "rejects an invalid or unexpected timestamp value: %s",
    async (timestamp) => {
      await expect(
        createOrderRepository().getNextOrderNumberParts(transactionReturning(timestamp)),
      ).rejects.toThrow("Invalid transaction timestamp returned by PostgreSQL.");
    },
  );
});
