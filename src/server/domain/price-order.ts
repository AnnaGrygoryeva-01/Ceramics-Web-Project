import { unitPrice, type Product } from "./catalogue";
import type { OrderFailure, OrderLine, OrderPick, OrderRequest, PricedOrder, StockDemand } from "./order";

type PricingResult = { ok: true; order: PricedOrder } | OrderFailure;

const invalid = (message: string): OrderFailure => ({ ok: false, code: "invalid-order", message });

// The products one set uses up, or null if the choices don't fit the product
function resolvePicks(product: Product, choices: string[], bySlug: Map<string, Product>) {
  const { options } = product;
  if (!options) return choices.length === 0 ? [] : null;
  if (choices.length !== options.count) return null;

  const picks: OrderPick[] = [];
  for (const choice of choices) {
    const target = bySlug.get(options.values[choice]);
    if (!target) return null;
    picks.push({ choice, productSlug: target.slug });
  }
  return picks;
}

// How much of each product's stock the lines use up. Mirrors stockUsed in
// lib/cart.ts: a set uses up the products picked for it, never stock of its own.
function stockDemand(lines: OrderLine[]): StockDemand[] {
  const demand = new Map<string, number>();
  for (const line of lines) {
    const slugs = line.picks.length > 0 ? line.picks.map((pick) => pick.productSlug) : [line.productSlug];
    for (const slug of slugs) demand.set(slug, (demand.get(slug) ?? 0) + line.quantity);
  }
  return [...demand].map(([productSlug, quantity]) => ({ productSlug, quantity }));
}

function shortSlugs(demand: StockDemand[], products: Product[]) {
  return demand.flatMap(({ productSlug, quantity }) => {
    const product = products.find((p) => p.slug === productSlug);
    return product && (product.stock ?? 0) < quantity ? [product.slug] : [];
  });
}

// Prices always come from the products passed in, never from the request
export function priceOrder(request: OrderRequest, products: Product[]): PricingResult {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const lines: OrderLine[] = [];

  for (const { slug, quantity, choices } of request.items) {
    const product = bySlug.get(slug);
    if (!product) return invalid(`There is no product "${slug}".`);

    const picks = resolvePicks(product, choices, bySlug);
    if (!picks) return invalid(`The choices for "${slug}" are not valid.`);

    lines.push({
      productSlug: product.slug,
      productName: product.name,
      unitPrice: unitPrice(product, choices, (s) => bySlug.get(s)),
      quantity,
      picks,
    });
  }

  const demand = stockDemand(lines);
  const outOfStock = shortSlugs(demand, products);
  if (outOfStock.length > 0) {
    return { ok: false, code: "out-of-stock", message: "Some items are out of stock.", outOfStock };
  }

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return { ok: true, order: { lines, total, stockDemand: demand } };
}
