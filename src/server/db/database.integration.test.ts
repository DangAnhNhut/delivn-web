import { randomUUID } from "node:crypto";

import { Client, type QueryConfig } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function approvedLocalDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const localHost = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    return localHost && url.pathname === "/delivn_dev" ? raw : undefined;
  } catch {
    return undefined;
  }
}

const databaseUrl = approvedLocalDatabaseUrl();
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase("PostgreSQL ecommerce integration", () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  async function expectConstraintFailure(query: QueryConfig): Promise<void> {
    const savepoint = `constraint_${randomUUID().replaceAll("-", "")}`;
    await client.query(`savepoint ${savepoint}`);
    await expect(client.query(query)).rejects.toBeDefined();
    await client.query(`rollback to savepoint ${savepoint}`);
  }

  it("has the migration, constraints, composite ownership FK, sequence, and rollback behavior", async () => {
    const suffix = randomUUID();
    const slugA = `integration-a-${suffix}`;
    const slugB = `integration-b-${suffix}`;

    const migrated = await client.query<{ table_name: string | null }>(
      "select to_regclass('public.products')::text as table_name",
    );
    expect(migrated.rows[0]?.table_name).toBe("products");

    const sequenceValues = await client.query<{ first: string; second: string }>(
      "select nextval('delivn_order_number_seq')::text as first, nextval('delivn_order_number_seq')::text as second",
    );
    expect(BigInt(sequenceValues.rows[0]!.second)).toBe(BigInt(sequenceValues.rows[0]!.first) + BigInt(1));

    await client.query("begin");
    try {
      const productA = await client.query<{ id: string }>(
        `insert into products (slug, name, short_name, description, category)
         values ($1, 'Integration A', 'A', 'Integration test product', 'espresso') returning id`,
        [slugA],
      );
      const productB = await client.query<{ id: string }>(
        `insert into products (slug, name, short_name, description, category)
         values ($1, 'Integration B', 'B', 'Integration test product', 'rang_xay') returning id`,
        [slugB],
      );
      const productAId = productA.rows[0]!.id;
      const productBId = productB.rows[0]!.id;
      const variant = await client.query<{ id: string }>(
        `insert into product_variants (product_id, sku, label, weight_grams, price_vnd)
         values ($1, $2, '250g', 250, 100000) returning id`,
        [productAId, `INTEGRATION-${suffix}`],
      );
      const variantId = variant.rows[0]!.id;

      await client.query(
        "insert into inventory (variant_id, quantity, reserved_quantity) values ($1, 3, 1)",
        [variantId],
      );

      const sortedProductIds = [productAId, productBId].sort();
      const lockedProducts = await client.query<{ id: string }>(
        "select id from products where id = any($1::uuid[]) order by id asc for share",
        [sortedProductIds],
      );
      const lockedVariants = await client.query<{ id: string }>(
        "select id from product_variants where id = any($1::uuid[]) order by id asc for share",
        [[variantId]],
      );
      const lockedInventory = await client.query<{ variant_id: string }>(
        "select variant_id from inventory where variant_id = any($1::uuid[]) order by variant_id asc for update",
        [[variantId]],
      );
      expect(lockedProducts.rows.map((row) => row.id)).toEqual(sortedProductIds);
      expect(lockedVariants.rows.map((row) => row.id)).toEqual([variantId]);
      expect(lockedInventory.rows.map((row) => row.variant_id)).toEqual([variantId]);

      await expectConstraintFailure({
        text: "update inventory set reserved_quantity = 4 where variant_id = $1",
        values: [variantId],
      });
      await expectConstraintFailure({
        text: `insert into products (slug, name, short_name, description, category)
               values ($1, 'Duplicate', 'D', 'Duplicate slug test', 'espresso')`,
        values: [slugA],
      });

      const order = await client.query<{ id: string }>(
        `insert into orders
           (order_number, customer_name, phone, address, subtotal_vnd, shipping_fee_vnd,
            total_vnd, payment_method, payment_status, order_status)
         values ($1, 'Integration Customer', '0900000000', 'Integration address',
                 100000, 0, 100000, 'cod', 'unpaid', 'pending') returning id`,
        [`INTEGRATION-${suffix}`],
      );
      await expectConstraintFailure({
        text: `insert into order_items
          (order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot,
           sku_snapshot, unit_price_vnd_snapshot, quantity, line_total_vnd)
          values ($1, $2, $3, 'Wrong product', '250g', 'SNAPSHOT', 100000, 1, 100000)`,
        values: [order.rows[0]!.id, productBId, variantId],
      });
      const correctItem = {
        text: `insert into order_items
          (order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot,
           sku_snapshot, unit_price_vnd_snapshot, quantity, line_total_vnd)
          values ($1, $2, $3, 'Product A', '250g', 'SNAPSHOT', 100000, 1, 100000)`,
        values: [order.rows[0]!.id, productAId, variantId],
      };
      await client.query(correctItem);
      await expectConstraintFailure(correctItem);
    } finally {
      await client.query("rollback");
    }

    const rolledBack = await client.query<{ count: string }>(
      "select count(*)::text as count from products where slug in ($1, $2)",
      [slugA, slugB],
    );
    expect(rolledBack.rows[0]?.count).toBe("0");

    await client.query("begin");
    await client.query("select 1");
    await client.query("commit");
  });
});
