import { expect, test, vi } from "vitest";
import { fixtureProducts } from "@/test/fixtures";
import type { OrderStore } from "../ports/orders";
import { placeOrder } from "./place-order";

const catalogueReader = { listProducts: async () => fixtureProducts };
const vase = { slug: "vase", quantity: 1, choices: [] };

const newStore = (result: Awaited<ReturnType<OrderStore["place"]>> = { ok: true }) => ({
  place: vi.fn<OrderStore["place"]>(async () => result),
});

test("stores the order and returns it as pending", async () => {
  const orderStore = newStore();
  const result = await placeOrder({ catalogueReader, orderStore }, { items: [vase] });

  if (!result.ok) throw new Error(result.message);
  const [stored, stock] = orderStore.place.mock.calls[0];
  expect(result.order).toMatchObject({ status: "pending", total: 4800, id: stored.id });
  expect(stored.stockDemand).toEqual([{ productSlug: "vase", quantity: 1 }]);
  expect(result.order).not.toHaveProperty("stockDemand");
  // The store checks against the stock in the files
  expect(stock).toEqual({ vase: 3 });
});

test("passes the stock of a set's picks, not the set", async () => {
  const orderStore = newStore();
  await placeOrder({ catalogueReader, orderStore }, { items: [{ slug: "brush-set", quantity: 1, choices: ["Small", "Large"] }] });
  expect(orderStore.place.mock.calls[0][1]).toEqual({ "small-brush": 2, "large-brush": 1 });
});

test("gives each order its own id", async () => {
  const orderStore = newStore();
  await placeOrder({ catalogueReader, orderStore }, { items: [vase] });
  await placeOrder({ catalogueReader, orderStore }, { items: [vase] });

  const [first, second] = orderStore.place.mock.calls.map(([order]) => order.id);
  expect(first).not.toBe(second);
});

test("doesn't touch the store for an invalid order", async () => {
  const orderStore = newStore();
  const items = [{ slug: "no-such-product", quantity: 1, choices: [] }];
  const result = await placeOrder({ catalogueReader, orderStore }, { items });

  expect(result).toMatchObject({ ok: false, code: "invalid-order" });
  expect(orderStore.place).not.toHaveBeenCalled();
});

test("doesn't touch the store when the files already show a shortfall", async () => {
  const orderStore = newStore();
  const result = await placeOrder({ catalogueReader, orderStore }, { items: [{ ...vase, quantity: 4 }] });

  expect(result).toMatchObject({ ok: false, code: "out-of-stock", outOfStock: ["vase"] });
  expect(orderStore.place).not.toHaveBeenCalled();
});

test("out of stock when other orders already hold it", async () => {
  const orderStore = newStore({ ok: false, outOfStock: ["vase"] });
  const result = await placeOrder({ catalogueReader, orderStore }, { items: [vase] });
  expect(result).toMatchObject({ ok: false, code: "out-of-stock", outOfStock: ["vase"] });
});
