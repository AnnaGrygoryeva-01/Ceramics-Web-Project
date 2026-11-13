"use client";

import Link from "next/link";
import { useState } from "react";
import type { CartLine } from "@/lib/cart-lines";
import { parseCartKey } from "@/lib/cart-stock";
import StripePayment from "./StripePayment";

// "Sorry, Bauble (No. 3) has just sold out.", naming the cart lines whose product,
// or one of whose picks, is out of stock
function soldOutMessage(lines: CartLine[], outOfStock: string[]) {
  const names = lines
    .filter(({ product, choices }) => {
      const slugs = [product.slug, ...choices.map((choice) => product.options?.values[choice])];
      return slugs.some((slug) => slug && outOfStock.includes(slug));
    })
    .map(({ product, choices }) => (choices.length > 0 ? `${product.name} (${choices.join(", ")})` : product.name));
  if (names.length === 0) return "Sorry, some items have just sold out.";
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  return `Sorry, ${list} ${names.length > 1 ? "have" : "has"} just sold out. Please remove ${names.length > 1 ? "them" : "it"} from your cart.`;
}

type State =
  | { step: "ready"; error?: string }
  | { step: "sending" }
  | { step: "paying"; checkoutId: string; clientSecret: string; publishableKey: string };

// Saves the order, which holds its pieces for 30 minutes, then shows Stripe's
// payment form, which asks for the customer's details and address. Sends only
// what's being bought, never prices: the server works those out from the files.
export default function PayButton({ lines }: { lines: CartLine[] }) {
  const [state, setState] = useState<State>({ step: "ready" });

  async function pay() {
    setState({ step: "sending" });
    const items = lines.map(({ key, qty }) => ({ ...parseCartKey(key), quantity: qty }));

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await response.json();
      if (!result.ok) {
        const error =
          result.code === "out-of-stock"
            ? soldOutMessage(lines, result.outOfStock ?? [])
            : (result.message ?? "Something went wrong, please try again.");
        setState({ step: "ready", error });
        return;
      }
      const { checkoutId, clientSecret, publishableKey } = result;
      setState({ step: "paying", checkoutId, clientSecret, publishableKey });
    } catch {
      setState({ step: "ready", error: "Couldn't reach the shop. Please check your connection and try again." });
    }
  }

  if (state.step === "paying") {
    return <StripePayment {...state} />;
  }

  return (
    <div className="checkout__actions">
      <Link href="/cart" className="button" prefetch>
        Back to cart
      </Link>
      {state.step === "ready" && state.error && (
        <p className="contact-form__error" role="alert">
          {state.error}
        </p>
      )}
      <button type="button" className="button" disabled={state.step === "sending"} onClick={pay}>
        {state.step === "sending" ? "Please wait…" : "Continue to payment"}
      </button>
    </div>
  );
}
