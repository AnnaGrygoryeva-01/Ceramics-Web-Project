"use client";

import Link from "next/link";
import { clearCart, setQuantity } from "@/lib/cart";
import { useCartLines } from "@/lib/cart-lines";
import CartTable from "./CartTable";

export function EmptyCart() {
  return (
    <p>
      Your cart is empty. <Link href="/shop">Browse the shop</Link>
    </p>
  );
}

export default function CartView() {
  const { lines, count } = useCartLines();

  if (!lines) return count > 0 ? <p>Loading…</p> : <EmptyCart />;
  if (lines.length === 0) return <EmptyCart />;

  return <CartTable lines={lines} onSetQuantity={setQuantity} onClear={clearCart} />;
}
