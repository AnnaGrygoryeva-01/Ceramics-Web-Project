"use client";

import { useSyncExternalStore } from "react";
import type { ProductLookup } from "./cart-stock";
import type { Product } from "./products";

// The products the cart works with, from /api/products. The cart lives in the
// browser and needs more than the products on the page: a set uses up the stock of
// the brushes picked for it. Loaded once per page load and shared by all components.
let lookup: ProductLookup | null = null;
let loading = false;
const listeners = new Set<() => void>();

async function load() {
  loading = true;
  try {
    const response = await fetch("/api/products");
    if (!response.ok) return;
    const products: Product[] = await response.json();
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    lookup = (slug) => bySlug.get(slug);
    listeners.forEach((listener) => listener());
  } catch {
    // Offline or the server is down. Nothing can be added for now, and the next
    // component to appear tries again.
  } finally {
    loading = false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!lookup && !loading) load();
  return () => {
    listeners.delete(listener);
  };
}

// Finds a product by slug, or null while the products are loading
export function useProductLookup() {
  return useSyncExternalStore(subscribe, () => lookup, () => null);
}
