import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";

import { closeDb, getDb, type Database } from "@/server/db";
import { orders, user } from "@/server/db/schema";
import { createCustomerOrderRepository } from "./customer-order.repository";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
const isApprovedTarget = (() => {
  if (!databaseUrl) return false;
  const url = new URL(databaseUrl);
  return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.pathname === "/delivn_dev";
})();
const suite = isApprovedTarget ? describe : describe.skip;
const rollback = new Error("ROLLBACK_AUTHORIZATION_FIXTURES");

suite("customer order PostgreSQL authorization", () => {
  afterAll(closeDb);

  it("returns only owned orders and makes foreign/missing details identical", async () => {
    await expect(getDb().transaction(async (tx) => {
      const userA = crypto.randomUUID();
      const userB = crypto.randomUUID();
      await tx.insert(user).values([
        { id: userA, name: "User A", email: `authz-a-${userA}@invalid.example`, emailVerified: true },
        { id: userB, name: "User B", email: `authz-b-${userB}@invalid.example`, emailVerified: true },
      ]);
      const baseOrder = {
        customerName: "Authorization fixture",
        phone: "0900000000",
        address: "Validation only",
        subtotalVnd: 0,
        shippingFeeVnd: 0,
        totalVnd: 0,
        paymentMethod: "cod" as const,
        paymentStatus: "unpaid" as const,
        orderStatus: "pending" as const,
      };
      const orderA = `DLV-AUTHZ-A-${userA}`;
      const orderB = `DLV-AUTHZ-B-${userB}`;
      await tx.insert(orders).values([
        { ...baseOrder, userId: userA, orderNumber: orderA },
        { ...baseOrder, userId: userB, orderNumber: orderB },
      ]);

      const repository = createCustomerOrderRepository(tx as unknown as Database);
      const listA = await repository.listByUserId(userA);
      expect(listA.map((row) => row.orderNumber)).toEqual([orderA]);
      expect(await repository.findDetailByOrderNumberAndUserId(orderA, userA)).not.toBeNull();
      expect(await repository.findDetailByOrderNumberAndUserId(orderB, userA)).toBeNull();
      expect(await repository.findDetailByOrderNumberAndUserId("DLV-NOT-FOUND", userA)).toBeNull();
      throw rollback;
    })).rejects.toBe(rollback);
  });
});
