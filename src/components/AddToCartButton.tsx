"use client";

import { addToCart, useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";

export default function AddToCartButton({ product }: { product: Product }) {
  const inCart = useCart()[product.slug] ?? 0;
  const soldOut = product.stock === 0;
  const maxed = inCart >= product.stock;

  return (
    <button
      type="button"
      disabled={soldOut || maxed}
      onClick={() => addToCart(product.slug, 1, product.stock)}
    >
      {soldOut ? "Sold out" : maxed ? "All in your cart" : "Add to cart"}
      {inCart > 0 && !soldOut && ` (${inCart} in cart)`}
    </button>
  );
}
