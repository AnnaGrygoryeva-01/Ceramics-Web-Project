import { foreignKey, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ORDER_STATUSES } from "../../domain/order";

// Don't add check() constraints. drizzle-kit 0.31.11 attaches every table's checks
// to all tables when reading the database, so a single check makes each
// `db:push` drop and rebuild every table. Rules live in the application instead.
//
// Foreign keys never cascade on delete, so a table rebuild can't wipe the rows
// pointing at it.

// Collections and products aren't here: they live in the JSON files under
// src/data. Orders name products by slug, copying what they need to keep.

export const orders = sqliteTable("orders", {
  id: text().primaryKey(), // UUID
  status: text({ enum: ORDER_STATUSES }).notNull().default("pending"),
  // The customer and address come from Stripe once the order is paid, so they're
  // empty until then
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text(),
  postcode: text(),
  country: text(),
  // The items when the order is placed, and items plus delivery once it's paid
  totalPence: integer("total_pence").notNull(),
  shippingPence: integer("shipping_pence"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  stripeCheckoutId: text("stripe_checkout_id"), // The Stripe Checkout Session, to look the payment up in Stripe
});

export const orderItems = sqliteTable(
  "order_items",
  {
    orderId: text("order_id").notNull().references(() => orders.id),
    lineNo: integer("line_no").notNull(),
    productSlug: text("product_slug").notNull(),
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
    productSlug: text("product_slug").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.orderId, t.lineNo, t.pickNo] }),
    foreignKey({ columns: [t.orderId, t.lineNo], foreignColumns: [orderItems.orderId, orderItems.lineNo] }),
  ],
);
