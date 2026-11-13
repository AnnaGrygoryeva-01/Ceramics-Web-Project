import Stripe from "stripe";
import { describe, expect, test } from "vitest";
import { createStripeGateway } from "./payment-gateway";

// Made-up keys: reading events never calls Stripe
const webhookSecret = "whsec_test_secret";
const gateway = createStripeGateway({ secretKey: "sk_test_not_a_real_key", webhookSecret });

const session = {
  id: "cs_test_1",
  object: "checkout.session",
  client_reference_id: "order-1",
  payment_status: "paid",
  amount_total: 1995,
  shipping_cost: { amount_total: 495 },
  customer_details: { email: "ada@example.com", name: "Ada Potter" },
  collected_information: {
    shipping_details: {
      name: "Ada Potter",
      address: { line1: "1 Kiln Lane", line2: null, city: "Stoke", postal_code: "ST1 1AA", country: "GB" },
    },
  },
};

function signed(type: string, object: object = session, secret = webhookSecret) {
  const body = JSON.stringify({ id: "evt_1", object: "event", type, data: { object } });
  return { body, signature: Stripe.webhooks.generateTestHeaderString({ payload: body, secret }) };
}

const read = ({ body, signature }: ReturnType<typeof signed>) => gateway.readEvent(body, signature);

describe("readEvent", () => {
  test("a paid session pays its order, with the customer from the shipping details", () => {
    expect(read(signed("checkout.session.completed"))).toEqual({
      type: "paid",
      orderId: "order-1",
      payment: {
        customer: {
          name: "Ada Potter",
          email: "ada@example.com",
          address: { line1: "1 Kiln Lane", line2: undefined, city: "Stoke", postcode: "ST1 1AA", country: "GB" },
        },
        shipping: 495,
        total: 1995,
      },
    });
  });

  test("a completed session that isn't paid yet waits for the delayed payment", () => {
    expect(read(signed("checkout.session.completed", { ...session, payment_status: "unpaid" }))).toEqual({
      type: "other",
    });
    expect(read(signed("checkout.session.async_payment_succeeded"))).toMatchObject({ type: "paid" });
  });

  test.each(["checkout.session.expired", "checkout.session.async_payment_failed"])("%s fails the order", (type) => {
    expect(read(signed(type))).toEqual({ type: "failed", orderId: "order-1" });
  });

  test("ignores other events, and sessions that aren't for an order", () => {
    expect(read(signed("payment_intent.succeeded", { id: "pi_1", object: "payment_intent" }))).toEqual({
      type: "other",
    });
    expect(read(signed("checkout.session.completed", { ...session, client_reference_id: null }))).toEqual({
      type: "other",
    });
  });

  test("rejects a message not signed with the webhook secret", () => {
    expect(read(signed("checkout.session.completed", session, "whsec_someone_else"))).toBeNull();
    const { body } = signed("checkout.session.completed");
    expect(gateway.readEvent(body, "t=1,v1=forged")).toBeNull();
  });

  test("rejects a signed message that was changed", () => {
    const { signature } = signed("checkout.session.completed");
    const tampered = JSON.stringify({ type: "checkout.session.completed", data: { object: { ...session, amount_total: 1 } } });
    expect(gateway.readEvent(tampered, signature)).toBeNull();
  });
});
