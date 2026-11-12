import { and, asc, count, desc, eq } from "drizzle-orm";

import { getDb, type Database } from "@/server/db";
import { orderItems, orders, orderStatusHistory } from "@/server/db/schema";

export function createCustomerOrderRepository(db: Database = getDb()) {
  return {
    async listByUserId(userId: string) {
      return db.select({
        orderNumber: orders.orderNumber,
        totalVnd: orders.totalVnd,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        orderStatus: orders.orderStatus,
        createdAt: orders.createdAt,
        itemCount: count(orderItems.id),
      }).from(orders).leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(eq(orders.userId, userId))
        .groupBy(orders.id)
        .orderBy(desc(orders.createdAt), desc(orders.orderNumber));
    },

    async findDetailByOrderNumberAndUserId(orderNumber: string, userId: string) {
      const [order] = await db.select().from(orders)
        .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId))).limit(1);
      if (!order) return null;
      const [items, statusHistory] = await Promise.all([
        db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id)),
        db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, order.id))
          .orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id)),
      ]);
      return { order, items, statusHistory };
    },
  };
}
