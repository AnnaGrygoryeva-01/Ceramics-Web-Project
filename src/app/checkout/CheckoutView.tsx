"use client";

import Link from "next/link";
import { useCartLines } from "@/lib/cart-lines";
import { EmptyCart } from "../cart/CartView";
import OrderSummary from "./OrderSummary";
import PayButton from "./PayButton";

// A last look at the order, then Stripe's payment form, which asks for the
// customer's name, email and address
export default function CheckoutView() {
  const { lines, count } = useCartLines();

  if (!lines) return count > 0 ? <p>Loading…</p> : <EmptyCart />;
  if (lines.length === 0) return <EmptyCart />;

  return (
    <div className="checkout">
      <OrderSummary lines={lines} />
      <p>
        You&rsquo;ll enter your name, email and delivery address in the secure payment form. See how I use them in
        the <Link href="/privacy">privacy notice</Link>.
      </p>
      <PayButton lines={lines} />
    </div>
  );
}
