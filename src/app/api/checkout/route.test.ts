import { beforeEach, expect, test, vi } from "vitest";
import { getServices } from "@/server/composition";
import { fixtureProducts } from "@/test/fixtures";
import { POST } from "./route";

vi.mock("@/server/composition", () => ({ getServices: vi.fn() }));

const orderStore = {
  place: vi.fn(async () => ({ ok: true })),
  setCheckout: vi.fn(async () => {}),
  markCancelled: vi.fn(async () => true),
};
const payments = { startCheckout: vi.fn(async () => ({ id: "cs_test_1", clientSecret: "cs_test_1_secret" })) };
const shippingRates = { freeFrom: 3000, standard: { name: "UK delivery", price: 495 }, zones: [] };

const post = (body: string) => POST(new Request("http://shop.test/api/checkout", { method: "POST", body }));
const postOrder = (items: object[]) => post(JSON.stringify({ items }));

beforeEach(() => {
  vi.clearAllMocks();
  const catalogueReader = { listProducts: async () => fixtureProducts };
  vi.mocked(getServices).mockReturnValue({
    catalogueReader,
    orderStore,
    payments,
    shippingRates,
    publishableKey: "pk_test_1",
  } as never);
});

test("201 with what the payment form needs, priced from the product files", async () => {
  const response = await postOrder([{ slug: "vase", quantity: 2, price: 1 }]);
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({
    ok: true,
    checkoutId: "cs_test_1",
    clientSecret: "cs_test_1_secret",
    publishableKey: "pk_test_1",
  });

  const [order, , returnUrl] = payments.startCheckout.mock.calls[0] as unknown as [
    { total: number },
    unknown,
    string,
  ];
  expect(order.total).toBe(9600);
  expect(returnUrl).toBe("http://shop.test/checkout/complete?session_id={CHECKOUT_SESSION_ID}");
});

test("400 for a body that isn't JSON", async () => {
  const response = await post("not json");
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ ok: false, code: "invalid-request" });
});

test("400 for a badly shaped order", async () => {
  expect((await postOrder([])).status).toBe(400);
});

test("413 for a body that's too large, before reading it as an order", async () => {
  const response = await post("x".repeat(16 * 1024 + 1));
  expect(response.status).toBe(413);
  expect(await response.json()).toMatchObject({ ok: false, code: "too-large" });
});

test("422 for a product that doesn't exist", async () => {
  const response = await postOrder([{ slug: "no-such-product", quantity: 1 }]);
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({ ok: false, code: "invalid-order" });
});

test("409 naming what's out of stock, with no payment form", async () => {
  const response = await postOrder([{ slug: "mug", quantity: 1 }]);
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: "out-of-stock", outOfStock: ["mug"] });
  expect(orderStore.place).not.toHaveBeenCalled();
  expect(payments.startCheckout).not.toHaveBeenCalled();
});
