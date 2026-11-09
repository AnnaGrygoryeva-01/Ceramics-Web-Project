import type { NewOrder } from "../../domain/order";
import type { OrderStore } from "../../ports/orders";
import type { Database } from "./client";
import { orderItemPicks, orderItems, orders } from "./schema";

export function createOrderStore(db: Database): OrderStore {
  return {
    // One transaction, so an order is saved whole or not at all
    async place(order: NewOrder) {
      const { id: orderId, customer, lines, total, createdAt } = order;
      const { line1, line2, city, postcode, country } = customer.address;

      await db.transaction(async (tx) => {
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
      });
    },
  };
}
