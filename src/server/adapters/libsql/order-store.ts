import { and, eq, gte, sql, TransactionRollbackError } from "drizzle-orm";
import type { NewOrder, StockDemand } from "../../domain/order";
import type { OrderStore } from "../../ports/orders";
import type { Database } from "./client";
import { orderItemPicks, orderItems, orders, products } from "./schema";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

// The WHERE is what stops overselling: with too little stock left the row isn't
// touched, even if another order got in after the stock was last read
async function takeStock(tx: Transaction, { productId, quantity }: StockDemand) {
  const { rowsAffected } = await tx
    .update(products)
    .set({ stock: sql`${products.stock} - ${quantity}` })
    .where(and(eq(products.id, productId), gte(products.stock, quantity)));
  return rowsAffected === 1;
}

async function insertOrder(tx: Transaction, order: NewOrder) {
  const { id: orderId, customer, lines, total, createdAt } = order;
  const { line1, line2, city, postcode, country } = customer.address;

  await tx.insert(orders).values({
    id: orderId,
    customerName: customer.name,
    customerEmail: customer.email,
    addressLine1: line1,
    addressLine2: line2 ?? null,
    city,
    postcode,
    country,
    totalPence: total,
    createdAt,
  });

  await tx.insert(orderItems).values(
    lines.map(({ productId, productName, unitPrice, quantity }, lineNo) => ({
      orderId,
      lineNo,
      productId,
      productName,
      unitPricePence: unitPrice,
      quantity,
    })),
  );

  const picks = lines.flatMap(({ picks }, lineNo) =>
    picks.map(({ choice, productId }, pickNo) => ({ orderId, lineNo, pickNo, choice, productId })),
  );
  if (picks.length > 0) await tx.insert(orderItemPicks).values(picks);
}

export function createOrderStore(db: Database): OrderStore {
  return {
    async place(order) {
      try {
        // A write transaction, so the database takes the write lock up front and
        // concurrent orders run one after another
        await db.transaction(async (tx) => {
          for (const demand of order.stockDemand) {
            if (!(await takeStock(tx, demand))) tx.rollback();
          }
          await insertOrder(tx, order);
        });
        return "placed";
      } catch (error) {
        if (error instanceof TransactionRollbackError) return "out-of-stock";
        throw error;
      }
    },
  };
}
