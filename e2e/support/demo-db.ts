import { loadEnvConfig } from "@next/env";

import { DEMO_VARIANT_IDS } from "../../src/server/demo/demo-data";
import { createDemoDatabase } from "../../src/server/demo/demo-database";
import { loadDemoEnvironment } from "../../src/server/demo/demo-environment";
import { runDemoOperation } from "../../src/server/demo/demo-runner";

loadEnvConfig(process.cwd());

async function withDatabase<T>(work: (database: ReturnType<typeof createDemoDatabase>) => Promise<T>) {
  const environment = loadDemoEnvironment(process.env);
  const database = createDemoDatabase(environment);
  try {
    await database.assertTarget();
    return await work(database);
  } finally {
    await database.close();
  }
}

export async function resetDemoData(): Promise<void> {
  await runDemoOperation("reset");
}

export async function makeDemoVariantUnavailable(variantId: string): Promise<void> {
  if (!new Set<string>(DEMO_VARIANT_IDS).has(variantId)) {
    throw new Error("Refusing to mutate a non-demo variant.");
  }
  await withDatabase(async (database) => {
    await database.query(
      "update inventory set quantity = 0, reserved_quantity = 0, updated_at = now() where variant_id = $1",
      [variantId],
    );
  });
}

export async function countOrdersByNote(note: string): Promise<number> {
  return withDatabase(async (database) => {
    const result = await database.query<{ count: string }>(
      "select count(*)::text as count from orders where note = $1",
      [note],
    );
    return Number(result.rows[0]?.count ?? "0");
  });
}

export async function readOrderByNumber(orderNumber: string) {
  return withDatabase(async (database) => {
    const orderResult = await database.query<{
      id: string;
      customerName: string;
      phone: string;
      email: string | null;
      address: string;
      note: string | null;
      totalVnd: number;
      paymentMethod: string;
      paymentStatus: string;
      orderStatus: string;
    }>(
      `select id, customer_name as "customerName", phone, email, address, note,
        total_vnd as "totalVnd", payment_method as "paymentMethod",
        payment_status as "paymentStatus", order_status as "orderStatus"
       from orders where order_number = $1`,
      [orderNumber],
    );
    const order = orderResult.rows[0];
    if (!order) return null;

    const [items, history] = await Promise.all([
      database.query<{
        variantId: string;
        productName: string;
        variantName: string;
        sku: string;
        unitPriceVnd: number;
        quantity: number;
        lineTotalVnd: number;
      }>(
        `select variant_id as "variantId", product_name_snapshot as "productName",
          variant_name_snapshot as "variantName", sku_snapshot as sku,
          unit_price_vnd_snapshot as "unitPriceVnd", quantity,
          line_total_vnd as "lineTotalVnd"
         from order_items where order_id = $1 order by variant_id`,
        [order.id],
      ),
      database.query<{ fromStatus: string | null; toStatus: string }>(
        `select from_status as "fromStatus", to_status as "toStatus"
         from order_status_history where order_id = $1 order by created_at`,
        [order.id],
      ),
    ]);
    const inventory = await database.query<{ quantity: number; reservedQuantity: number }>(
      `select quantity, reserved_quantity as "reservedQuantity"
       from inventory where variant_id = $1`,
      [items.rows[0]?.variantId],
    );

    return { order, items: items.rows, history: history.rows, inventory: inventory.rows[0] ?? null };
  });
}
