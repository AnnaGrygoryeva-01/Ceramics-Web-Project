import type { Order, OrderFailure, OrderRequest } from "../domain/order";
import { priceOrder } from "../domain/price-order";
import type { CatalogueReader } from "../ports/catalogue";
import type { OrderStore } from "../ports/orders";

export type PlaceOrderResult = { ok: true; order: Order } | OrderFailure;

type Deps = { catalogueReader: Pick<CatalogueReader, "listProducts">; orderStore: OrderStore };

export async function placeOrder(deps: Deps, request: OrderRequest): Promise<PlaceOrderResult> {
  // Pieces too: a one-of-a-kind product's picks use up their stock
  const priced = priceOrder(request, await deps.catalogueReader.listProducts({ includeHidden: true }));
  if (!priced.ok) return priced;

  const order = { ...priced.order, id: crypto.randomUUID(), createdAt: new Date() };

  // The stock read above can be out of date by now, so the store has the final say
  if ((await deps.orderStore.place(order)) === "out-of-stock") {
    return { ok: false, code: "out-of-stock", message: "Some items just sold out.", outOfStock: [] };
  }

  const { id, createdAt, customer, lines, total } = order;
  return { ok: true, order: { id, createdAt, customer, lines, total, status: "pending" } };
}
