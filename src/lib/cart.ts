"use client";

import { useSyncExternalStore } from "react";
import { canAdd, cartKey, type Cart, type ProductLookup } from "./cart-stock";

// The cart, persisted in localStorage. See cart-stock.ts for what's in it.
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

// Adds one, if it's still in stock
export function addToCart(getProduct: ProductLookup, slug: string, choices: string[] = []) {
  const cart = read();
  if (!canAdd(getProduct, cart, slug, choices)) return;
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
