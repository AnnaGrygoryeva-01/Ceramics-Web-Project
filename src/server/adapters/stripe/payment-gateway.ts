import Stripe from "stripe";
import { orderReference, type Customer, type OrderLine } from "../../domain/order";
import type { ShippingRate } from "../../domain/shipping";
import type { Checkout, CheckoutStatus, PaymentEvent, PaymentGateway } from "../../ports/payments";

export type StripeConfig = { secretKey: string; webhookSecret?: string };

// The payment form expires after this long, which cancels the order and frees
// its stock (Stripe allows 30 minutes to 24 hours). See PENDING_HOLD_MS.
const EXPIRES_AFTER_S = 30 * 60;

const CURRENCY = "gbp";

const STATUSES: CheckoutStatus[] = ["open", "complete", "expired"];

// "Rocking Horse Ornament (No. 2)": the picks of a set or piece, so they show on
// the receipt
function lineName({ productName, picks }: OrderLine) {
  return picks.length > 0 ? `${productName} (${picks.map((p) => p.choice).join(", ")})` : productName;
}

const shippingOption = ({ name, price }: ShippingRate) => ({
  shipping_rate_data: {
    type: "fixed_amount" as const,
    display_name: price === 0 ? `${name} (free)` : name,
    fixed_amount: { amount: price, currency: CURRENCY },
  },
});

function customerOf(session: Stripe.Checkout.Session): Customer | null {
  const shipping = session.collected_information?.shipping_details;
  const email = session.customer_details?.email;
  if (!shipping || !email) return null;
  const { line1, line2, city, postal_code, country } = shipping.address;
  return {
    name: shipping.name,
    email,
    address: {
      line1: line1 ?? "",
      line2: line2 || undefined,
      city: city ?? "",
      postcode: postal_code ?? "",
      country: country ?? "",
    },
  };
}

// What a finished Checkout Session means for its order
function sessionEvent(type: string, session: Stripe.Checkout.Session): PaymentEvent {
  const orderId = session.client_reference_id;
  if (!orderId) return { type: "other" };

  const paid =
    (type === "checkout.session.completed" && session.payment_status === "paid") ||
    type === "checkout.session.async_payment_succeeded";
  if (paid) {
    const customer = customerOf(session);
    if (!customer) throw new Error(`Paid Checkout Session ${session.id} has no customer details`);
    const shipping = session.shipping_cost?.amount_total ?? 0;
    return { type: "paid", orderId, payment: { customer, shipping, total: session.amount_total ?? 0 } };
  }
  if (type === "checkout.session.expired" || type === "checkout.session.async_payment_failed") {
    return { type: "failed", orderId };
  }
  return { type: "other" };
}

export function createStripeGateway({ secretKey, webhookSecret }: StripeConfig): PaymentGateway {
  const stripe = new Stripe(secretKey);

  return {
    async startCheckout(order, shipping, returnUrl) {
      // The reference labels the payment in the Dashboard and can be searched for there
      const reference = orderReference(order.id);
      const metadata = { order_id: order.id, order_ref: reference };
      const session = await stripe.checkout.sessions.create({
        ui_mode: "form",
        mode: "payment",
        client_reference_id: order.id,
        metadata,
        payment_intent_data: { description: `Order ${reference}`, metadata },
        line_items: order.lines.map((line) => ({
          quantity: line.quantity,
          price_data: { currency: CURRENCY, unit_amount: line.unitPrice, product_data: { name: lineName(line) } },
        })),
        shipping_address_collection: { allowed_countries: ["GB"] },
        shipping_options: [shippingOption(shipping)],
        expires_at: Math.floor(Date.now() / 1000) + EXPIRES_AFTER_S,
        return_url: returnUrl,
      });
      if (!session.client_secret) throw new Error(`Checkout Session ${session.id} has no client secret`);
      return { id: session.id, clientSecret: session.client_secret };
    },

    async getCheckout(checkoutId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(checkoutId);
        if (!session.client_reference_id || !session.status) return null;
        const checkout: Checkout = {
          id: session.id,
          orderId: session.client_reference_id,
          status: STATUSES.includes(session.status as CheckoutStatus) ? (session.status as CheckoutStatus) : "expired",
          paid: session.payment_status === "paid",
          subtotal: session.amount_subtotal ?? 0,
        };
        return checkout;
      } catch (error) {
        if (error instanceof Stripe.errors.StripeInvalidRequestError) return null; // No such session
        throw error;
      }
    },

    async setShipping(checkoutId, shipping) {
      await stripe.checkout.sessions.update(checkoutId, { shipping_options: [shippingOption(shipping)] });
    },

    readEvent(body, signature) {
      if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch {
        return null;
      }
      if (!event.type.startsWith("checkout.session.")) return { type: "other" };
      return sessionEvent(event.type, event.data.object as Stripe.Checkout.Session);
    },
  };
}
