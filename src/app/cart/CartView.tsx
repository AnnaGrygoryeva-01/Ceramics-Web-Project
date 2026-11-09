"use client";

import Link from "next/link";
import { clearCart, setQuantity, useCart } from "@/lib/cart";
import { canAdd, parseCartKey } from "@/lib/cart-stock";
import { useProductLookup } from "@/lib/catalogue-store";
import CartTable from "./CartTable";

function EmptyCart() {
  return (
    <p>
      Your cart is empty. <Link href="/shop">Browse the shop</Link>
    </p>
  );
}

export default function CartView() {
  const cart = useCart();
  const getProduct = useProductLookup();

  if (!getProduct) {
    return Object.keys(cart).length > 0 ? <p>Loading…</p> : <EmptyCart />;
  }

  const lines = Object.entries(cart).flatMap(([key, qty]) => {
    const { slug, choices } = parseCartKey(key);
    const product = getProduct(slug);
    if (!product) return [];
    return [{ key, product, choices, qty, canIncrease: canAdd(getProduct, cart, slug, choices) }];
  });

  if (lines.length === 0) return <EmptyCart />;

  return <CartTable lines={lines} onSetQuantity={setQuantity} onClear={clearCart} />;
}
