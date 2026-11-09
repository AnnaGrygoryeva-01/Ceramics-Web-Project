import { expect, test, vi } from "vitest";
import { fixtureCustomer as customer, fixtureProducts } from "@/test/fixtures";
import type { OrderStore } from "../ports/orders";
import { placeOrder } from "./place-order";

const catalogueReader = { listProducts: async () => fixtureProducts };
const vase = { slug: "vase", quantity: 1, choices: [] };

const newStore = () => ({ place: vi.fn<OrderStore["place"]>(async () => {}) });

test("stores the order and returns it as pending", async () => {
  const orderStore = newStore();
  const result = await placeOrder({ catalogueReader, orderStore }, { customer, items: [vase] });

  if (!result.ok) throw new Error(result.message);
  const stored = orderStore.place.mock.calls[0][0];
  expect(result.order).toMatchObject({ status: "pending", total: 4800, id: stored.id });
  expect(stored.stockDemand).toEqual([{ productSlug: "vase", quantity: 1 }]);
  expect(result.order).not.toHaveProperty("stockDemand");
});

test("gives each order its own id", async () => {
  const orderStore = newStore();
  await placeOrder({ catalogueReader, orderStore }, { customer, items: [vase] });
  await placeOrder({ catalogueReader, orderStore }, { customer, items: [vase] });

  const [first, second] = orderStore.place.mock.calls.map(([order]) => order.id);
  expect(first).not.toBe(second);
});

test("doesn't touch the store for an invalid order", async () => {
  const orderStore = newStore();
  const items = [{ slug: "no-such-product", quantity: 1, choices: [] }];
  const result = await placeOrder({ catalogueReader, orderStore }, { customer, items });

  expect(result).toMatchObject({ ok: false, code: "invalid-order" });
  expect(orderStore.place).not.toHaveBeenCalled();
});

test("doesn't touch the store when the stock read already shows a shortfall", async () => {
  const orderStore = newStore();
  const items = [{ ...vase, quantity: 4 }];
  const result = await placeOrder({ catalogueReader, orderStore }, { customer, items });

  expect(result).toMatchObject({ ok: false, code: "out-of-stock", outOfStock: ["vase"] });
  expect(orderStore.place).not.toHaveBeenCalled();
});
