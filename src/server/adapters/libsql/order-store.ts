import { and, eq, gt, inArray, or } from "drizzle-orm";
import { PENDING_HOLD_MS, type NewOrder, type Payment, type StockLimits } from "../../domain/order";
import type { HeldStock, OrderStore } from "../../ports/orders";
import type { Database } from "./client";
import { orderItemPicks, orderItems, orders } from "./schema";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

// How much of each product paid orders and recent unpaid ones hold, apart. Like
// stockDemand in priceOrder: a set's line holds its picks, never itself.
async function heldStockByStatus(tx: Database | Transaction, now: Date): Promise<HeldStock> {
  const rows = await tx
    .select({
      status: orders.status,
      line: orderItems.productSlug,
      pick: orderItemPicks.productSlug,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(
      orderItemPicks,
      and(eq(orderItemPicks.orderId, orderItems.orderId), eq(orderItemPicks.lineNo, orderItems.lineNo)),
    )
    .where(
      or(
        inArray(orders.status, ["paid", "shipped"]),
        and(eq(orders.status, "pending"), gt(orders.createdAt, new Date(now.getTime() - PENDING_HOLD_MS))),
      ),
    );

  const held: HeldStock = { sold: {}, inCheckout: {} };
  for (const { status, line, pick, quantity } of rows) {
    const slug = pick ?? line;
    const group = status === "pending" ? held.inCheckout : held.sold;
    group[slug] = (group[slug] ?? 0) + quantity;
  }
  return held;
}

// Both together: what a new order can't have
async function heldStock(tx: Database | Transaction, now: Date) {
  const { sold, inCheckout } = await heldStockByStatus(tx, now);
  const held: StockLimits = { ...sold };
  for (const [slug, quantity] of Object.entries(inCheckout)) held[slug] = (held[slug] ?? 0) + quantity;
  return held;
}

export function createOrderStore(db: Database): OrderStore {
  return {
    // One write transaction, so the stock check and the save happen together and
    // an order is saved whole or not at all
    async place(order: NewOrder, stock: StockLimits) {
      const { id: orderId, lines, total, createdAt, stockDemand } = order;

      return db.transaction(async (tx) => {
        const held = await heldStock(tx, createdAt);
        const outOfStock = stockDemand
          .filter(({ productSlug, quantity }) => (held[productSlug] ?? 0) + quantity > (stock[productSlug] ?? 0))
          .map((d) => d.productSlug);
        if (outOfStock.length > 0) return { ok: false as const, outOfStock };

        await tx.insert(orders).values({ id: orderId, totalPence: total, createdAt });

        await tx.insert(orderItems).values(
          lines.map(({ productSlug, productName, unitPrice, quantity }, lineNo) => ({
            orderId,
            lineNo,
            productSlug,
            productName,
            unitPricePence: unitPrice,
            quantity,
          })),
        );

        const picks = lines.flatMap(({ picks }, lineNo) =>
          picks.map(({ choice, productSlug }, pickNo) => ({ orderId, lineNo, pickNo, choice, productSlug })),
        );
        if (picks.length > 0) await tx.insert(orderItemPicks).values(picks);
        return { ok: true as const };
      });
    },

    heldStock(now = new Date()) {
      return heldStock(db, now);
    },

    heldStockByStatus(now = new Date()) {
      return heldStockByStatus(db, now);
    },

    async setCheckout(orderId: string, checkoutId: string) {
      await db.update(orders).set({ stripeCheckoutId: checkoutId }).where(eq(orders.id, orderId));
    },

    async markPaid(orderId: string, { customer, shipping, total }: Payment) {
      const { line1, line2, city, postcode, country } = customer.address;
      const result = await db
        .update(orders)
        .set({
          status: "paid",
          customerName: customer.name,
          customerEmail: customer.email,
          addressLine1: line1,
          addressLine2: line2 ?? null,
          city,
          postcode,
          country,
          shippingPence: shipping,
          totalPence: total,
          paidAt: new Date(),
        })
        .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
      return result.rowsAffected > 0;
    },

    async markCancelled(orderId: string) {
      const result = await db
        .update(orders)
        .set({ status: "cancelled" })
        .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
      return result.rowsAffected > 0;
    },
  };
}
