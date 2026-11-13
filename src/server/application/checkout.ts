import type { OrderFailure, OrderRequest } from "../domain/order";
import { shippingFor, type ShippingRates } from "../domain/shipping";
import type { CatalogueReader } from "../ports/catalogue";
import type { OrderStore } from "../ports/orders";
import type { PaymentEvent, PaymentGateway } from "../ports/payments";
import { placeOrder } from "./place-order";

type Deps = {
  catalogueReader: Pick<CatalogueReader, "listProducts">;
  orderStore: OrderStore;
  payments: PaymentGateway;
  shippingRates: ShippingRates;
};

export type StartCheckoutResult = { ok: true; checkoutId: string; clientSecret: string } | OrderFailure;

// Saves the order, which holds its stock, and opens a payment form for it. Delivery
// starts at the standard price (or free) and changes once the customer's address
// is known (see quoteShipping).
export async function startCheckout(deps: Deps, request: OrderRequest, returnUrl: string): Promise<StartCheckoutResult> {
  const placed = await placeOrder(deps, request);
  if (!placed.ok) return placed;

  const { order } = placed;
  const { standard, freeFrom } = deps.shippingRates;
  const shipping = { name: standard.name, price: order.total >= freeFrom ? 0 : standard.price };

  try {
    const checkout = await deps.payments.startCheckout(order, shipping, returnUrl);
    await deps.orderStore.setCheckout(order.id, checkout.id);
    return { ok: true, checkoutId: checkout.id, clientSecret: checkout.clientSecret };
  } catch (error) {
    // Nobody can pay for it, so it mustn't hold the stock
    await deps.orderStore.markCancelled(order.id);
    throw error;
  }
}

const NO_DELIVERY = {
  "not-a-uk-postcode": "Please enter a UK postcode. We only deliver within the UK.",
  "not-delivered": "Sorry, we can't deliver to Jersey, Guernsey or the Isle of Man at the moment.",
};

export type QuoteShippingResult = { ok: true } | { ok: false; message: string };

// Sets the delivery price for the postcode the customer has typed. The order's
// subtotal comes from the payment provider, never the browser.
export async function quoteShipping(
  deps: Pick<Deps, "payments" | "shippingRates">,
  checkoutId: string,
  postcode: string,
): Promise<QuoteShippingResult> {
  const checkout = await deps.payments.getCheckout(checkoutId);
  if (!checkout || checkout.status !== "open") return { ok: false, message: "This payment has expired." };

  const quote = shippingFor(deps.shippingRates, postcode, checkout.subtotal);
  if (!quote.ok) return { ok: false, message: NO_DELIVERY[quote.reason] };

  await deps.payments.setShipping(checkout.id, quote.rate);
  return { ok: true };
}

// Marks the order paid, with the customer's details, or cancels it so its stock
// is free again
export async function recordPaymentEvent(deps: Pick<Deps, "orderStore">, event: PaymentEvent) {
  if (event.type === "paid") await deps.orderStore.markPaid(event.orderId, event.payment);
  if (event.type === "failed") await deps.orderStore.markCancelled(event.orderId);
}
