import type { Order, OrderFailure, OrderRequest, StockLimits } from "../domain/order";
import { priceOrder } from "../domain/price-order";
import type { CatalogueReader } from "../ports/catalogue";
import type { OrderStore } from "../ports/orders";

export type PlaceOrderResult = { ok: true; order: Order } | OrderFailure;

type Deps = { catalogueReader: Pick<CatalogueReader, "listProducts">; orderStore: Pick<OrderStore, "place"> };

const outOfStock = (slugs: string[]): OrderFailure => ({
  ok: false,
  code: "out-of-stock",
  message: "Sorry, some items have just sold out.",
  outOfStock: slugs,
});

export async function placeOrder(deps: Deps, request: OrderRequest, now = new Date()): Promise<PlaceOrderResult> {
  // Pieces too: a one-of-a-kind product's picks use up their stock
  const products = await deps.catalogueReader.listProducts({ includeHidden: true });
  const priced = priceOrder(request, products);
  if (!priced.ok) return priced.code === "out-of-stock" ? outOfStock(priced.outOfStock) : priced;

  const order = { ...priced.order, id: crypto.randomUUID(), createdAt: now };
  const stock: StockLimits = Object.fromEntries(
    order.stockDemand.map(({ productSlug }) => [
      productSlug,
      products.find((p) => p.slug === productSlug)?.stock ?? 0,
    ]),
  );

  // The files have enough, but paid and unpaid orders may already hold it
  const placed = await deps.orderStore.place(order, stock);
  if (!placed.ok) return outOfStock(placed.outOfStock);

  const { id, createdAt, lines, total } = order;
  return { ok: true, order: { id, createdAt, lines, total, status: "pending" } };
}
