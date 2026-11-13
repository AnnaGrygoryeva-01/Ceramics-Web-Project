"use client";

import { useCart } from "./cart";
import { canAdd, parseCartKey } from "./cart-stock";
import { useProductLookup } from "./catalogue-store";
import { unitPrice, type Product } from "./products";

export type CartLine = {
  key: string;
  product: Product;
  choices: string[];
  price: number; // Each, in pence: a piece's own price
  qty: number;
  canIncrease: boolean;
};

// The cart's lines with their products, for the cart and checkout pages. Lines
// for products that no longer exist are left out. Null until the products are
// known; `count` says whether there was anything in the cart meanwhile.
export function useCartLines() {
  const cart = useCart();
  const getProduct = useProductLookup();
  const count = Object.keys(cart).length;

  if (!getProduct) return { lines: null, count };

  const lines = Object.entries(cart).flatMap(([key, qty]): CartLine[] => {
    const { slug, choices } = parseCartKey(key);
    const product = getProduct(slug);
    if (!product) return [];
    const price = unitPrice(product, choices, getProduct);
    return [{ key, product, choices, price, qty, canIncrease: canAdd(getProduct, cart, slug, choices) }];
  });
  return { lines, count };
}

export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, { price, qty }) => sum + price * qty, 0);
