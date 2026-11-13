import type { OrderLine, Payment } from "../domain/order";
import type { ShippingRate } from "../domain/shipping";

export type CheckoutStatus = "open" | "complete" | "expired";

export type Checkout = {
  id: string;
  orderId: string;
  status: CheckoutStatus;
  // Whether the money has been taken. A finished checkout may still be waiting for
  // a delayed payment, such as a bank transfer.
  paid: boolean;
  subtotal: number; // in pence, the items only
};

// What a message from the payment provider means for an order
export type PaymentEvent =
  | { type: "paid"; orderId: string; payment: Payment }
  | { type: "failed"; orderId: string } // Expired, or a delayed payment that didn't go through
  | { type: "other" };

export interface PaymentGateway {
  // A payment form for the order, with delivery at `shipping` until the
  // customer's address says otherwise
  startCheckout(
    order: { id: string; lines: OrderLine[] },
    shipping: ShippingRate,
    returnUrl: string,
  ): Promise<{ id: string; clientSecret: string }>;
  getCheckout(checkoutId: string): Promise<Checkout | null>;
  setShipping(checkoutId: string, shipping: ShippingRate): Promise<void>;
  // Null if the message can't be shown to come from the provider
  readEvent(body: string, signature: string): PaymentEvent | null;
}
