"use client";

import { useSyncExternalStore } from "react";
import { getProduct, type Product } from "./products";

// Cart is persisted in localStorage as a map of cart key -> quantity. The key is
// the product slug, plus the picked options for products that have them (see
// cartKey), so each combination gets its own line.
export type Cart = Record<string, number>;

const STORAGE_KEY = "cart";
const EMPTY: Cart = {};
const listeners = new Set<() => void>();
let cache: Cart | null = null;

function read(): Cart {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Cart;
  } catch {
    cache = {};
  }
  return cache;
}

function write(cart: Cart) {
  cache = cart;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep multiple tabs in sync
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

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

// How much of each product's stock the cart uses up. A set uses up the products
// picked for it, so single brushes and sets share the brushes' stock.
function stockUsed(cart: Cart) {
  const used: Record<string, number> = {};
  for (const [key, qty] of Object.entries(cart)) {
    for (const slug of stockSlugs(key)) used[slug] = (used[slug] ?? 0) + qty;
  }
  return used;
}

// The products one of a cart line uses up: itself, or the picks for a set
function stockSlugs(key: string) {
  const { slug, choices } = parseCartKey(key);
  const options = getProduct(slug)?.options;
  return options ? choices.map((choice) => options.values[choice]) : [slug];
}

// How many of a product are left after what's in the cart (single, or in sets)
export function stockLeft(cart: Cart, slug: string) {
  return (getProduct(slug)?.stock ?? 0) - (stockUsed(cart)[slug] ?? 0);
}

// Whether one more (with these picks) is still in stock, after what's in the cart
export function canAdd(cart: Cart, slug: string, choices: string[] = []) {
  const used = stockUsed(cart);
  return stockSlugs(cartKey(slug, choices)).every((s) => {
    used[s] = (used[s] ?? 0) + 1;
    return used[s] <= (getProduct(s)?.stock ?? 0);
  });
}

// Whether the product can't be bought at all, even with an empty cart
export function isSoldOut(product: Product) {
  const { options } = product;
  if (!options) return !product.stock;
  // Enough brushes in total to make one set (the same size can be picked twice)
  const total = Object.values(options.values).reduce((sum, s) => sum + (getProduct(s)?.stock ?? 0), 0);
  return total < options.count;
}

// Adds one, if it's still in stock
export function addToCart(slug: string, choices: string[] = []) {
  const cart = read();
  if (!canAdd(cart, slug, choices)) return;
  const key = cartKey(slug, choices);
  write({ ...cart, [key]: (cart[key] ?? 0) + 1 });
}

export function setQuantity(key: string, qty: number) {
  const cart = { ...read() };
  if (qty > 0) cart[key] = qty;
  else delete cart[key];
  write(cart);
}

export function clearCart() {
  write({});
}
