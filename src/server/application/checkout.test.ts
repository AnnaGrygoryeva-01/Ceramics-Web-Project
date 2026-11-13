import { beforeEach, describe, expect, test, vi } from "vitest";
import { fixtureProducts } from "@/test/fixtures";
import type { Payment } from "../domain/order";
import type { ShippingRates } from "../domain/shipping";
import type { OrderStore } from "../ports/orders";
import type { Checkout, PaymentGateway } from "../ports/payments";
import { quoteShipping, recordPaymentEvent, startCheckout } from "./checkout";

const shippingRates: ShippingRates = {
  freeFrom: 3000,
  standard: { name: "UK delivery", price: 495 },
  zones: [{ name: "Northern Ireland delivery", price: 895, postcodes: ["BT"] }],
};

const openCheckout: Checkout = { id: "cs_test_1", orderId: "order-1", status: "open", paid: false, subtotal: 1500 };

let orderStore: { [K in keyof OrderStore]: ReturnType<typeof vi.fn<OrderStore[K]>> };
let payments: { [K in keyof PaymentGateway]: ReturnType<typeof vi.fn<PaymentGateway[K]>> };
let deps: Parameters<typeof startCheckout>[0];

beforeEach(() => {
  orderStore = {
    place: vi.fn(async () => ({ ok: true as const })),
    heldStock: vi.fn(async () => ({})),
    heldStockByStatus: vi.fn(async () => ({ sold: {}, inCheckout: {} })),
    setCheckout: vi.fn(async () => {}),
    markPaid: vi.fn(async () => true),
    markCancelled: vi.fn(async () => true),
  };
  payments = {
    startCheckout: vi.fn(async () => ({ id: "cs_test_1", clientSecret: "cs_test_1_secret" })),
    getCheckout: vi.fn(async () => openCheckout),
    setShipping: vi.fn(async () => {}),
    readEvent: vi.fn(() => ({ type: "other" as const })),
  };
  deps = { catalogueReader: { listProducts: async () => fixtureProducts }, orderStore, payments, shippingRates };
});

const bowl = { slug: "bowl", quantity: 1, choices: [] };
const vase = { slug: "vase", quantity: 1, choices: [] };

describe("startCheckout", () => {
  test("saves the order and opens a payment form for it", async () => {
    const result = await startCheckout(deps, { items: [bowl] }, "https://shop.test/done");

    expect(result).toEqual({ ok: true, checkoutId: "cs_test_1", clientSecret: "cs_test_1_secret" });
    const [order, shipping, returnUrl] = payments.startCheckout.mock.calls[0];
    expect(order.lines).toMatchObject([{ productSlug: "bowl", unitPrice: 1500, quantity: 1 }]);
    expect(shipping).toEqual({ name: "UK delivery", price: 495 });
    expect(returnUrl).toBe("https://shop.test/done");
    expect(orderStore.setCheckout).toHaveBeenCalledWith(order.id, "cs_test_1");
  });

  test("delivery starts free from £30", async () => {
    await startCheckout(deps, { items: [vase] }, "https://shop.test/done");
    expect(payments.startCheckout.mock.calls[0][1]).toEqual({ name: "UK delivery", price: 0 });
  });

  test("no payment form for an order that can't be placed", async () => {
    orderStore.place.mockResolvedValue({ ok: false, outOfStock: ["bowl"] });
    const result = await startCheckout(deps, { items: [bowl] }, "https://shop.test/done");

    expect(result).toMatchObject({ ok: false, code: "out-of-stock", outOfStock: ["bowl"] });
    expect(payments.startCheckout).not.toHaveBeenCalled();
  });

  test("frees the stock if Stripe fails", async () => {
    payments.startCheckout.mockRejectedValue(new Error("Stripe is down"));
    await expect(startCheckout(deps, { items: [bowl] }, "https://shop.test/done")).rejects.toThrow("Stripe is down");

    const order = orderStore.place.mock.calls[0][0];
    expect(orderStore.markCancelled).toHaveBeenCalledWith(order.id);
  });
});

describe("quoteShipping", () => {
  test("prices delivery for the postcode, from Stripe's subtotal", async () => {
    expect(await quoteShipping(deps, "cs_test_1", "BT1 5GS")).toEqual({ ok: true });
    expect(payments.setShipping).toHaveBeenCalledWith("cs_test_1", { name: "Northern Ireland delivery", price: 895 });
  });

  test("free from £30, wherever it goes", async () => {
    payments.getCheckout.mockResolvedValue({ ...openCheckout, subtotal: 4800 });
    await quoteShipping(deps, "cs_test_1", "BT1 5GS");
    expect(payments.setShipping).toHaveBeenCalledWith("cs_test_1", { name: "Northern Ireland delivery", price: 0 });
  });

  test("turns down a postcode outside the UK", async () => {
    expect(await quoteShipping(deps, "cs_test_1", "75001")).toMatchObject({ ok: false });
    expect(payments.setShipping).not.toHaveBeenCalled();
  });

  test.each([
    ["an unknown", null],
    ["a finished", { ...openCheckout, status: "complete" as const }],
    ["an expired", { ...openCheckout, status: "expired" as const }],
  ])("changes nothing on %s payment", async (_name, checkout) => {
    payments.getCheckout.mockResolvedValue(checkout);
    expect(await quoteShipping(deps, "cs_test_1", "M11 4HZ")).toMatchObject({ ok: false });
    expect(payments.setShipping).not.toHaveBeenCalled();
  });
});

describe("recordPaymentEvent", () => {
  const payment = { customer: {}, shipping: 495, total: 1995 } as Payment;

  test("a payment marks the order paid", async () => {
    await recordPaymentEvent(deps, { type: "paid", orderId: "order-1", payment });
    expect(orderStore.markPaid).toHaveBeenCalledWith("order-1", payment);
    expect(orderStore.markCancelled).not.toHaveBeenCalled();
  });

  test("a failed or expired payment cancels it", async () => {
    await recordPaymentEvent(deps, { type: "failed", orderId: "order-1" });
    expect(orderStore.markCancelled).toHaveBeenCalledWith("order-1");
  });

  test("anything else changes nothing", async () => {
    await recordPaymentEvent(deps, { type: "other" });
    expect(orderStore.markPaid).not.toHaveBeenCalled();
    expect(orderStore.markCancelled).not.toHaveBeenCalled();
  });
});
