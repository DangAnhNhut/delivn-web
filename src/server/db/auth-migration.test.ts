import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../../drizzle/0001_zippy_slayback.sql", import.meta.url), "utf8");

describe("auth and order ownership migration", () => {
  it("is additive and preserves historical orders without backfill", () => {
    expect(sql).not.toMatch(/^\s*(DROP|TRUNCATE|DELETE|UPDATE)\b/im);
    expect(sql).toContain('ALTER TABLE "orders" ADD COLUMN "user_id" uuid');
    expect(sql).not.toMatch(/ALTER TABLE "orders" ADD COLUMN "user_id" uuid NOT NULL/i);
    expect(sql).toContain('ON DELETE set null');
    expect(sql).toContain('ON UPDATE restrict');
  });

  it("uses UUID identity parity and indexes ownership", () => {
    expect(sql).toContain('"id" uuid PRIMARY KEY');
    expect(sql).toContain('CREATE INDEX "orders_user_id_created_at_idx"');
    expect(sql).toContain('("user_id","created_at" DESC NULLS LAST)');
  });
});
