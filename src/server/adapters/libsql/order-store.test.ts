import { afterEach, beforeEach, expect, test } from "vitest";
import { fixtureCustomer as customer, fixtureProducts } from "@/test/fixtures";
import { createTestDb } from "@/test/test-db";
import type { OrderRequestItem } from "../../domain/order";
import { priceOrder } from "../../domain/price-order";
import { createOrderStore } from "./order-store";
import { orderItemPicks, orderItems, orders } from "./schema";

let testDb: Awaited<ReturnType<typeof createTestDb>>;
let store: ReturnType<typeof createOrderStore>;

beforeEach(async () => {
  testDb = await createTestDb();
  store = createOrderStore(testDb.db);
});
afterEach(() => testDb.cleanup());

function newOrder(items: OrderRequestItem[]) {
  const priced = priceOrder({ customer, items }, fixtureProducts);
  if (!priced.ok) throw new Error(priced.message);
  return { ...priced.order, id: crypto.randomUUID(), createdAt: new Date() };
}

const item = (slug: string, quantity = 1, choices: string[] = []) => ({ slug, quantity, choices });

test("saves the order with its lines and picks, naming products by slug", async () => {
  const order = newOrder([item("vase", 2), item("brush-set", 1, ["Small", "Large"]), item("bauble", 1, ["No. 3"])]);

  await store.place(order);

  const [saved] = await testDb.db.select().from(orders);
  expect(saved).toMatchObject({
    id: order.id,
    status: "pending",
    customerEmail: customer.email,
    addressLine1: customer.address.line1,
    addressLine2: null,
    totalPence: 4800 * 2 + 5500 + 2200,
  });
  expect(saved.createdAt).toEqual(order.createdAt);

  const lines = await testDb.db.select().from(orderItems).orderBy(orderItems.lineNo);
  expect(lines.map((l) => [l.lineNo, l.productSlug, l.productName, l.unitPricePence, l.quantity])).toEqual([
    [0, "vase", "Vase", 4800, 2],
    [1, "brush-set", "Brush Set", 5500, 1],
    [2, "bauble", "Bauble", 2200, 1],
  ]);

  const picks = await testDb.db.select().from(orderItemPicks).orderBy(orderItemPicks.lineNo, orderItemPicks.pickNo);
  expect(picks.map((p) => [p.lineNo, p.pickNo, p.choice, p.productSlug])).toEqual([
    [1, 0, "Small", "small-brush"],
    [1, 1, "Large", "large-brush"],
    [2, 0, "No. 3", "bauble-03"],
  ]);
});

test("a failure part way through saves nothing", async () => {
  const order = newOrder([item("vase")]);
  await store.place(order);
  // Same id again: the order row clashes, so its lines mustn't be saved either
  await expect(store.place({ ...order, total: 1 })).rejects.toThrow();

  expect(await testDb.db.select().from(orders)).toHaveLength(1);
  expect(await testDb.db.select().from(orderItems)).toHaveLength(1);
});
