import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getServices } from "@/server/composition";
import { orderReference } from "@/server/domain/order";
import ClearCart from "./ClearCart";

export const metadata: Metadata = { title: "Thank you" };

// Where Stripe sends the customer after paying. It only says what Stripe says:
// "confirmed" once the money is taken. The order is marked paid by Stripe's
// message to /api/stripe/webhook, not by this page: anyone can open it.
export default function CheckoutCompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  return (
    <div className="checkout-page checkout-page--centred">
      <Suspense fallback={<p>Loading…</p>}>
        <Outcome searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Outcome({ searchParams }: Pick<PageProps<"/checkout/complete">, "searchParams">) {
  const { session_id: id } = await searchParams;
  // Asks Stripe about this payment, so it's never prerendered
  await connection();
  const checkout = typeof id === "string" && id.startsWith("cs_") ? await getServices().payments.getCheckout(id) : null;

  if (checkout?.status === "complete") {
    return (
      <>
        <ClearCart />
        <h1>Thank you!</h1>
        {checkout.paid ? (
          <p>Your order is confirmed. Thank you for supporting handmade ceramics.</p>
        ) : (
          <p>
            Your order is placed and your payment is being processed. It&rsquo;s confirmed once your bank completes
            the payment, which can take a few days.
          </p>
        )}
        <p>Order reference: {orderReference(checkout.orderId)}</p>
        <Link href="/shop" className="button" prefetch>
          Back to the shop
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Payment not finished</h1>
      <p>Your payment didn&rsquo;t go through, so nothing has been charged. Your cart is still saved.</p>
      <Link href="/checkout" className="button" prefetch>
        Try again
      </Link>
    </>
  );
}
