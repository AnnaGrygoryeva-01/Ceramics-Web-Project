"use client";

import { useSyncExternalStore } from "react";

// Cart is persisted in localStorage as a map of product slug -> quantity.
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

export function addToCart(slug: string, qty = 1, max = Infinity) {
  const cart = read();
  write({ ...cart, [slug]: Math.min((cart[slug] ?? 0) + qty, max) });
}

export function setQuantity(slug: string, qty: number) {
  const cart = { ...read() };
  if (qty > 0) cart[slug] = qty;
  else delete cart[slug];
  write(cart);
}

export function clearCart() {
  write({});
}
