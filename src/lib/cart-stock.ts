import type { Product } from "./products";

// Cart is a map of cart key -> quantity. The key is the product slug, plus the
// picked options for products that have them (see cartKey), so each combination
// gets its own line.
export type Cart = Record<string, number>;

export type ProductLookup = (slug: string) => Product | undefined;

// "brush-set-two|Small,Large" for a product with picked options, else just the slug
export function cartKey(slug: string, choices: string[] = []) {
  return choices.length > 0 ? `${slug}|${choices.join(",")}` : slug;
}

export function parseCartKey(key: string) {
  const [slug, choices] = key.split("|");
  return { slug, choices: choices ? choices.split(",") : [] };
}

// How many of a product are in the cart, across all its option combinations
export function countInCart(cart: Cart, slug: string) {
  return Object.entries(cart).reduce(
    (sum, [key, qty]) => (parseCartKey(key).slug === slug ? sum + qty : sum),
    0,
  );
}

// Everything in the cart. Skips products that no longer exist, once the products
// are known (getProduct is null until then).
export function countItems(cart: Cart, getProduct: ProductLookup | null) {
  return Object.entries(cart).reduce(
    (sum, [key, qty]) => (!getProduct || getProduct(parseCartKey(key).slug) ? sum + qty : sum),
    0,
  );
}

// The products one of a cart line uses up: itself, or the picks for a set
function stockSlugs(getProduct: ProductLookup, key: string) {
  const { slug, choices } = parseCartKey(key);
  const options = getProduct(slug)?.options;
  return options ? choices.map((choice) => options.values[choice]) : [slug];
}

// How much of each product's stock the cart uses up. A set uses up the products
// picked for it, so single brushes and sets share the brushes' stock.
function stockUsed(getProduct: ProductLookup, cart: Cart) {
  const used: Record<string, number> = {};
  for (const [key, qty] of Object.entries(cart)) {
    for (const slug of stockSlugs(getProduct, key)) used[slug] = (used[slug] ?? 0) + qty;
  }
  return used;
}

// How many of a product are left after what's in the cart (single, or in sets)
export function stockLeft(getProduct: ProductLookup, cart: Cart, slug: string) {
  return (getProduct(slug)?.stock ?? 0) - (stockUsed(getProduct, cart)[slug] ?? 0);
}

// Whether one more (with these picks) is still in stock, after what's in the cart
export function canAdd(getProduct: ProductLookup, cart: Cart, slug: string, choices: string[] = []) {
  const used = stockUsed(getProduct, cart);
  return stockSlugs(getProduct, cartKey(slug, choices)).every((s) => {
    used[s] = (used[s] ?? 0) + 1;
    return used[s] <= (getProduct(s)?.stock ?? 0);
  });
}

// Whether the product can't be bought at all, even with an empty cart
export function isSoldOut(getProduct: ProductLookup, product: Product) {
  const { options } = product;
  if (!options) return !product.stock;
  // Enough brushes in total to make one set (the same size can be picked twice)
  const total = Object.values(options.values).reduce((sum, s) => sum + (getProduct(s)?.stock ?? 0), 0);
  return total < options.count;
}
