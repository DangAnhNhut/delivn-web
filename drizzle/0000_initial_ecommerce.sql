CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cod', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('espresso', 'rang_xay');--> statement-breakpoint
CREATE TYPE "public"."product_media_type" AS ENUM('image');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE SEQUENCE "public"."delivn_order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"variant_name_snapshot" text NOT NULL,
	"sku_snapshot" text NOT NULL,
	"unit_price_vnd_snapshot" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_vnd" integer NOT NULL,
	CONSTRAINT "order_items_order_variant_unique" UNIQUE("order_id","variant_id"),
	CONSTRAINT "order_items_product_name_nonempty" CHECK (length(btrim("order_items"."product_name_snapshot")) > 0),
	CONSTRAINT "order_items_variant_name_nonempty" CHECK (length(btrim("order_items"."variant_name_snapshot")) > 0),
	CONSTRAINT "order_items_sku_nonempty" CHECK (length(btrim("order_items"."sku_snapshot")) > 0),
	CONSTRAINT "order_items_unit_price_nonnegative" CHECK ("order_items"."unit_price_vnd_snapshot" >= 0),
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_line_total_nonnegative" CHECK ("order_items"."line_total_vnd" >= 0),
	CONSTRAINT "order_items_line_total_matches" CHECK ("order_items"."line_total_vnd" = "order_items"."unit_price_vnd_snapshot" * "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"note" text,
	"subtotal_vnd" integer NOT NULL,
	"shipping_fee_vnd" integer NOT NULL,
	"total_vnd" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"order_status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_customer_name_nonempty" CHECK (length(btrim("orders"."customer_name")) > 0),
	CONSTRAINT "orders_phone_nonempty" CHECK (length(btrim("orders"."phone")) > 0),
	CONSTRAINT "orders_address_nonempty" CHECK (length(btrim("orders"."address")) > 0),
	CONSTRAINT "orders_subtotal_nonnegative" CHECK ("orders"."subtotal_vnd" >= 0),
	CONSTRAINT "orders_shipping_nonnegative" CHECK ("orders"."shipping_fee_vnd" >= 0),
	CONSTRAINT "orders_total_nonnegative" CHECK ("orders"."total_vnd" >= 0),
	CONSTRAINT "orders_total_matches" CHECK ("orders"."total_vnd" = "orders"."subtotal_vnd" + "orders"."shipping_fee_vnd")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"variant_id" uuid PRIMARY KEY NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_quantity_nonnegative" CHECK ("inventory"."quantity" >= 0),
	CONSTRAINT "inventory_reserved_nonnegative" CHECK ("inventory"."reserved_quantity" >= 0),
	CONSTRAINT "inventory_reserved_lte_quantity" CHECK ("inventory"."reserved_quantity" <= "inventory"."quantity")
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "product_media_type" DEFAULT 'image' NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_media_url_nonempty" CHECK (length(btrim("product_media"."url")) > 0),
	CONSTRAINT "product_media_sort_nonnegative" CHECK ("product_media"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"label" text NOT NULL,
	"weight_grams" integer NOT NULL,
	"price_vnd" integer NOT NULL,
	"compare_at_price_vnd" integer,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_id_product_id_unique" UNIQUE("id","product_id"),
	CONSTRAINT "product_variants_sku_nonempty" CHECK (length(btrim("product_variants"."sku")) > 0),
	CONSTRAINT "product_variants_label_nonempty" CHECK (length(btrim("product_variants"."label")) > 0),
	CONSTRAINT "product_variants_weight_positive" CHECK ("product_variants"."weight_grams" > 0),
	CONSTRAINT "product_variants_price_nonnegative" CHECK ("product_variants"."price_vnd" >= 0),
	CONSTRAINT "product_variants_compare_price_valid" CHECK ("product_variants"."compare_at_price_vnd" is null or "product_variants"."compare_at_price_vnd" >= "product_variants"."price_vnd")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"description" text NOT NULL,
	"category" "product_category" NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_nonempty" CHECK (length(btrim("products"."slug")) > 0),
	CONSTRAINT "products_name_nonempty" CHECK (length(btrim("products"."name")) > 0),
	CONSTRAINT "products_short_name_nonempty" CHECK (length(btrim("products"."short_name")) > 0),
	CONSTRAINT "products_description_nonempty" CHECK (length(btrim("products"."description")) > 0)
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_product_fk" FOREIGN KEY ("variant_id","product_id") REFERENCES "public"."product_variants"("id","product_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_created_idx" ON "order_status_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_status_history_created_at_idx" ON "order_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_unique" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("order_status");--> statement-breakpoint
CREATE INDEX "product_media_product_sort_idx" ON "product_media" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_unique" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_unique" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");