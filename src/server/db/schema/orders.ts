import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { products, productVariants } from "./products";

export const paymentMethodEnum = pgEnum("payment_method", ["cod", "bank_transfer"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "shipping",
  "completed",
  "cancelled",
]);

export const orderNumberSequence = pgSequence("delivn_order_number_seq", {
  startWith: 1,
  increment: 1,
  cache: 1,
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address").notNull(),
    note: text("note"),
    subtotalVnd: integer("subtotal_vnd").notNull(),
    shippingFeeVnd: integer("shipping_fee_vnd").notNull(),
    totalVnd: integer("total_vnd").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
    orderStatus: orderStatusEnum("order_status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("orders_order_number_unique").on(table.orderNumber),
    index("orders_created_at_idx").on(table.createdAt.desc()),
    index("orders_phone_idx").on(table.phone),
    index("orders_status_idx").on(table.orderStatus),
    check("orders_customer_name_nonempty", sql`length(btrim(${table.customerName})) > 0`),
    check("orders_phone_nonempty", sql`length(btrim(${table.phone})) > 0`),
    check("orders_address_nonempty", sql`length(btrim(${table.address})) > 0`),
    check("orders_subtotal_nonnegative", sql`${table.subtotalVnd} >= 0`),
    check("orders_shipping_nonnegative", sql`${table.shippingFeeVnd} >= 0`),
    check("orders_total_nonnegative", sql`${table.totalVnd} >= 0`),
    check("orders_total_matches", sql`${table.totalVnd} = ${table.subtotalVnd} + ${table.shippingFeeVnd}`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict", onUpdate: "restrict" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict", onUpdate: "restrict" }),
    variantId: uuid("variant_id").notNull(),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    variantNameSnapshot: text("variant_name_snapshot").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),
    unitPriceVndSnapshot: integer("unit_price_vnd_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalVnd: integer("line_total_vnd").notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    unique("order_items_order_variant_unique").on(table.orderId, table.variantId),
    foreignKey({
      name: "order_items_variant_product_fk",
      columns: [table.variantId, table.productId],
      foreignColumns: [productVariants.id, productVariants.productId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    check("order_items_product_name_nonempty", sql`length(btrim(${table.productNameSnapshot})) > 0`),
    check("order_items_variant_name_nonempty", sql`length(btrim(${table.variantNameSnapshot})) > 0`),
    check("order_items_sku_nonempty", sql`length(btrim(${table.skuSnapshot})) > 0`),
    check("order_items_unit_price_nonnegative", sql`${table.unitPriceVndSnapshot} >= 0`),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_line_total_nonnegative", sql`${table.lineTotalVnd} >= 0`),
    check(
      "order_items_line_total_matches",
      sql`${table.lineTotalVnd} = ${table.unitPriceVndSnapshot} * ${table.quantity}`,
    ),
  ],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict", onUpdate: "restrict" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("order_status_history_order_created_idx").on(table.orderId, table.createdAt),
    index("order_status_history_created_at_idx").on(table.createdAt),
  ],
);
