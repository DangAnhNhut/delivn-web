import { sql } from "drizzle-orm";

import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/contracts";
import type { DbTransaction } from "@/server/db";
import { orderItems, orders, orderStatusHistory } from "@/server/db/schema";

export type OrderRecord = {
  id: string;
  orderNumber: string;
  totalVnd: number;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
};

export type NewOrder = {
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewOrderItem = {
  orderId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  unitPriceVndSnapshot: number;
  quantity: number;
  lineTotalVnd: number;
};

export function createOrderRepository() {
  return {
    async getNextOrderNumberParts(
      tx: DbTransaction,
    ): Promise<{ createdAt: Date; sequenceValue: string }> {
      const result = await tx.execute<{ created_at: Date; sequence_value: string }>(sql`
        select transaction_timestamp() as created_at,
               nextval('delivn_order_number_seq')::text as sequence_value
      `);
      const row = result.rows[0];
      if (!row) {
        throw new Error("Order number sequence did not return a value.");
      }
      return { createdAt: row.created_at, sequenceValue: row.sequence_value };
    },

    async insertOrder(tx: DbTransaction, data: NewOrder): Promise<OrderRecord> {
      const inserted = await tx
        .insert(orders)
        .values(data)
        .returning({
          id: orders.id,
          orderNumber: orders.orderNumber,
          totalVnd: orders.totalVnd,
          paymentMethod: orders.paymentMethod,
          orderStatus: orders.orderStatus,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
        });
      if (!inserted[0]) {
        throw new Error("Order insertion failed.");
      }
      return inserted[0];
    },

    async insertOrderItems(tx: DbTransaction, items: readonly NewOrderItem[]): Promise<void> {
      if (items.length > 0) {
        await tx.insert(orderItems).values([...items]);
      }
    },

    async insertInitialStatus(tx: DbTransaction, orderId: string): Promise<void> {
      await tx.insert(orderStatusHistory).values({
        orderId,
        fromStatus: null,
        toStatus: "pending",
      });
    },
  };
}

export type OrderRepository = ReturnType<typeof createOrderRepository>;
