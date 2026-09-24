import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const productCategoryEnum = pgEnum("product_category", ["espresso", "rang_xay"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);
export const productMediaTypeEnum = pgEnum("product_media_type", ["image"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    description: text("description").notNull(),
    category: productCategoryEnum("category").notNull(),
    status: productStatusEnum("status").default("draft").notNull(),
    featured: boolean("featured").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_status_idx").on(table.status),
    check("products_slug_nonempty", sql`length(btrim(${table.slug})) > 0`),
    check("products_name_nonempty", sql`length(btrim(${table.name})) > 0`),
    check("products_short_name_nonempty", sql`length(btrim(${table.shortName})) > 0`),
    check("products_description_nonempty", sql`length(btrim(${table.description})) > 0`),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict", onUpdate: "restrict" }),
    sku: text("sku").notNull(),
    label: text("label").notNull(),
    weightGrams: integer("weight_grams").notNull(),
    priceVnd: integer("price_vnd").notNull(),
    compareAtPriceVnd: integer("compare_at_price_vnd"),
    active: boolean("active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("product_variants_sku_unique").on(table.sku),
    unique("product_variants_id_product_id_unique").on(table.id, table.productId),
    index("product_variants_product_id_idx").on(table.productId),
    check("product_variants_sku_nonempty", sql`length(btrim(${table.sku})) > 0`),
    check("product_variants_label_nonempty", sql`length(btrim(${table.label})) > 0`),
    check("product_variants_weight_positive", sql`${table.weightGrams} > 0`),
    check("product_variants_price_nonnegative", sql`${table.priceVnd} >= 0`),
    check(
      "product_variants_compare_price_valid",
      sql`${table.compareAtPriceVnd} is null or ${table.compareAtPriceVnd} >= ${table.priceVnd}`,
    ),
  ],
);

export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade", onUpdate: "restrict" }),
    type: productMediaTypeEnum("type").default("image").notNull(),
    url: text("url").notNull(),
    alt: text("alt").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("product_media_product_sort_idx").on(table.productId, table.sortOrder),
    check("product_media_url_nonempty", sql`length(btrim(${table.url})) > 0`),
    check("product_media_sort_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
);

export const inventory = pgTable(
  "inventory",
  {
    variantId: uuid("variant_id")
      .primaryKey()
      .references(() => productVariants.id, { onDelete: "cascade", onUpdate: "restrict" }),
    quantity: integer("quantity").default(0).notNull(),
    reservedQuantity: integer("reserved_quantity").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("inventory_quantity_nonnegative", sql`${table.quantity} >= 0`),
    check("inventory_reserved_nonnegative", sql`${table.reservedQuantity} >= 0`),
    check("inventory_reserved_lte_quantity", sql`${table.reservedQuantity} <= ${table.quantity}`),
  ],
);

export type ProductStatus = (typeof productStatusEnum.enumValues)[number];
