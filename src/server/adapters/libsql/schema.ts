import { foreignKey, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ORDER_STATUSES } from "../../domain/order";

// Don't add check() constraints. drizzle-kit 0.31.11 attaches every table's checks
// to all tables when reading the database, so a single check makes each
// `db:push` drop and rebuild every table. Rules live in the application instead;
// stock can't go negative because order-store.ts only takes it conditionally.
//
// Foreign keys never cascade on delete, so a table rebuild can't wipe the rows
// pointing at it.

export const collections = sqliteTable("collections", {
  id: text().primaryKey(), // UUID
  slug: text().notNull().unique(), // For URLs only, nothing references it
  name: text().notNull(),
  description: text().notNull(),
  image: text(),
  position: integer().notNull(),
});

export const products = sqliteTable(
  "products",
  {
    id: text().primaryKey(), // UUID
    slug: text().notNull().unique(), // For URLs and cart keys only, nothing references it
    collectionId: text("collection_id").notNull().references(() => collections.id),
    name: text().notNull(),
    pricePence: integer("price_pence").notNull(),
    description: text().notNull(),
    image: text(),
    stock: integer(), // NULL for products with options, which use up the stock of their picks
    optionLabel: text("option_label"),
    optionCount: integer("option_count"),
    // One piece of a one-of-a-kind product, e.g. "Bow Ornament, No. 2". It's
    // picked through that product's options and isn't listed on its own. NULL
    // means not hidden. It's nullable because drizzle-kit 0.31.11 treats adding a
    // NOT NULL column as needing the table emptied first, even with a default.
    hidden: integer({ mode: "boolean" }).default(false),
    position: integer().notNull(),
  },
  (t) => [index("products_collection_id_idx").on(t.collectionId)],
);

export const productOptionValues = sqliteTable(
  "product_option_values",
  {
    productId: text("product_id").notNull().references(() => products.id),
    name: text().notNull(),
    targetProductId: text("target_product_id").notNull().references(() => products.id),
    position: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.name] })],
);

export const orders = sqliteTable("orders", {
  id: text().primaryKey(), // UUID
  status: text({ enum: ORDER_STATUSES }).notNull().default("pending"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text().notNull(),
  postcode: text().notNull(),
  country: text().notNull(),
  totalPence: integer("total_pence").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const orderItems = sqliteTable(
  "order_items",
  {
    orderId: text("order_id").notNull().references(() => orders.id),
    lineNo: integer("line_no").notNull(),
    productId: text("product_id").notNull().references(() => products.id),
    productName: text("product_name").notNull(),
    unitPricePence: integer("unit_price_pence").notNull(),
    quantity: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.lineNo] })],
);

export const orderItemPicks = sqliteTable(
  "order_item_picks",
  {
    orderId: text("order_id").notNull(),
    lineNo: integer("line_no").notNull(),
    pickNo: integer("pick_no").notNull(),
    choice: text().notNull(),
    productId: text("product_id").notNull().references(() => products.id),
  },
  (t) => [
    primaryKey({ columns: [t.orderId, t.lineNo, t.pickNo] }),
    foreignKey({ columns: [t.orderId, t.lineNo], foreignColumns: [orderItems.orderId, orderItems.lineNo] }),
  ],
);
