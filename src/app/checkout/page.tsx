import type { Metadata } from "next";
import CheckoutView from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <CheckoutView />
    </div>
  );
}
