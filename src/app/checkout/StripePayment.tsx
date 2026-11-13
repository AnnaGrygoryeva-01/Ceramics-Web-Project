"use client";

import { CheckoutForm, CheckoutFormProvider, useCheckoutForm } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
import type { Appearance, StripeCheckoutFormChangeEvent, StripeCheckoutFormConfirmEvent } from "@stripe/stripe-js";

// Loaded once, and only on the checkout page. The publishable key is public, and
// comes with the checkout from the server.
let stripePromise: ReturnType<typeof loadStripe> | undefined;
const getStripe = (publishableKey: string) => (stripePromise ??= loadStripe(publishableKey));

// Stripe's form in the site's colours, from the current theme's tokens (see the
// top of globals.sass)
function appearance(): Omit<Appearance, "rules"> {
  const root = document.documentElement;
  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
  return {
    theme: root.dataset.theme === "night" ? "night" : "stripe",
    variables: {
      colorPrimary: token("--ink"),
      colorText: token("--ink"),
      colorBackground: token("--surface"),
      colorDanger: token("--nav-current"),
      fontFamily: 'Georgia, "Times New Roman", serif',
      borderRadius: "0px",
    },
  };
}

// Sets the delivery price for the postcode typed in. Throws so Stripe's form shows
// the problem.
async function quoteShipping(checkoutId: string, postcode: string) {
  const response = await fetch("/api/checkout/shipping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutId, postcode }),
  });
  const result = await response.json().catch(() => null);
  if (!result?.ok) throw new Error(result?.message ?? "Couldn't work out delivery. Please try again.");
}

function PaymentForm({ checkoutId }: { checkoutId: string }) {
  const result = useCheckoutForm();
  const [error, setError] = useState<string>();
  const quoted = useRef<string>(undefined); // The postcode delivery was last worked out for
  const changeAppearance = result.type === "success" ? result.checkout.changeAppearance : undefined;

  // Follows the theme toggle
  useEffect(() => {
    if (!changeAppearance) return;
    const observer = new MutationObserver(() => changeAppearance(appearance()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [changeAppearance]);

  if (result.type === "loading") return <p>Loading the payment form…</p>;
  if (result.type === "error") return <p role="alert">{result.error.message}</p>;
  const { checkout } = result;

  // Once the address is complete, and again whenever its postcode changes
  async function onChange({ value, status }: StripeCheckoutFormChangeEvent) {
    const postcode = value.shippingAddress?.address.postal_code?.trim();
    if (!status.shippingAddress?.complete || !postcode || postcode === quoted.current) return;
    quoted.current = postcode;
    const update = await checkout.runServerUpdate(() => quoteShipping(checkoutId, postcode));
    if (update.type === "error") {
      quoted.current = undefined;
      setError(update.error.message);
    } else {
      setError(undefined);
    }
  }

  // Stripe sends the customer to /checkout/complete once it's paid
  async function onConfirm(event: StripeCheckoutFormConfirmEvent) {
    const confirmed = await checkout.confirm({ formConfirmEvent: event });
    if (confirmed.type === "error") setError(confirmed.error.message);
  }

  return (
    <>
      <CheckoutForm onChange={onChange} onConfirm={onConfirm} />
      {error && (
        <p className="contact-form__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

type Props = { checkoutId: string; clientSecret: string; publishableKey: string };

export default function StripePayment({ checkoutId, clientSecret, publishableKey }: Props) {
  // Set once: the provider can't take new options
  const [options] = useState(() => ({ clientSecret, appearance: appearance() }));
  return (
    <div className="stripe-payment">
      <CheckoutFormProvider stripe={getStripe(publishableKey)} options={options}>
        <PaymentForm checkoutId={checkoutId} />
      </CheckoutFormProvider>
    </div>
  );
}
