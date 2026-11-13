import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { fixtureProducts } from "@/test/fixtures";
import { createTestDb } from "@/test/test-db";
import { PENDING_HOLD_MS, type OrderRequestItem, type Payment } from "../../domain/order";
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

function newOrder(items: OrderRequestItem[], createdAt = new Date()) {
  const priced = priceOrder({ items }, fixtureProducts);
  if (!priced.ok) throw new Error(priced.message);
  return { ...priced.order, id: crypto.randomUUID(), createdAt };
}

const item = (slug: string, quantity = 1, choices: string[] = []) => ({ slug, quantity, choices });

// The stock in the files, as placeOrder passes it
const stock = { vase: 3, bowl: 1, "small-brush": 2, "large-brush": 1, "bauble-03": 1 };

const payment: Payment = {
  customer: {
    name: "Ada Potter",
    email: "ada@example.com",
    address: { line1: "1 Kiln Lane", city: "Stoke", postcode: "ST1 1AA", country: "GB" },
  },
  shipping: 495,
  total: 1995,
};

const status = async (id: string) =>
  (await testDb.db.select({ status: orders.status }).from(orders).where(eq(orders.id, id)))[0].status;

test("saves the order with its lines and picks, naming products by slug", async () => {
  const order = newOrder([item("vase", 2), item("brush-set", 1, ["Small", "Large"]), item("bauble", 1, ["No. 3"])]);

  expect(await store.place(order, stock)).toEqual({ ok: true });

  const [saved] = await testDb.db.select().from(orders);
  expect(saved).toMatchObject({
    id: order.id,
    status: "pending",
    customerEmail: null, // Filled in from Stripe once paid
    addressLine1: null,
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
  await store.place(order, stock);
  // Same id again: the order row clashes, so its lines mustn't be saved either
  await expect(store.place({ ...order, total: 1 }, stock)).rejects.toThrow();

  expect(await testDb.db.select().from(orders)).toHaveLength(1);
  expect(await testDb.db.select().from(orderItems)).toHaveLength(1);
});

describe("stock", () => {
  test("the last piece can only be ordered once", async () => {
    expect(await store.place(newOrder([item("bowl")]), stock)).toEqual({ ok: true });
    expect(await store.place(newOrder([item("bowl")]), stock)).toEqual({ ok: false, outOfStock: ["bowl"] });
    expect(await testDb.db.select().from(orders)).toHaveLength(1);
  });

  test("adds up what other orders hold", async () => {
    await store.place(newOrder([item("vase", 2)]), stock);
    expect(await store.place(newOrder([item("vase", 2)]), stock)).toEqual({ ok: false, outOfStock: ["vase"] });
    expect(await store.place(newOrder([item("vase", 1)]), stock)).toEqual({ ok: true });
  });

  test("a set's picks hold the picked products", async () => {
    await store.place(newOrder([item("brush-set", 1, ["Small", "Large"])]), stock);
    expect(await store.place(newOrder([item("large-brush")]), stock)).toEqual({ ok: false, outOfStock: ["large-brush"] });
    expect(await store.place(newOrder([item("small-brush")]), stock)).toEqual({ ok: true });
  });

  test("a piece's pick holds that piece", async () => {
    await store.place(newOrder([item("bauble", 1, ["No. 3"])]), stock);
    expect(await store.place(newOrder([item("bauble", 1, ["No. 3"])]), stock)).toEqual({
      ok: false,
      outOfStock: ["bauble-03"],
    });
  });

  test("a cancelled order holds nothing", async () => {
    const first = newOrder([item("bowl")]);
    await store.place(first, stock);
    await store.markCancelled(first.id);
    expect(await store.place(newOrder([item("bowl")]), stock)).toEqual({ ok: true });
  });

  test("an unpaid order stops holding stock after a while, a paid one never does", async () => {
    const longAgo = new Date(Date.now() - PENDING_HOLD_MS - 1000);
    await store.place(newOrder([item("bowl")], longAgo), stock);
    expect(await store.place(newOrder([item("bowl")]), stock)).toEqual({ ok: true });

    const paid = newOrder([item("bauble", 1, ["No. 3"])], longAgo);
    await store.place(paid, stock);
    await store.markPaid(paid.id, payment);
    expect((await store.place(newOrder([item("bauble", 1, ["No. 3"])]), stock)).ok).toBe(false);
  });
});

test("heldStock adds up what paid and recent unpaid orders hold", async () => {
  await store.place(newOrder([item("vase", 2), item("brush-set", 1, ["Small", "Large"])]), stock);
  const cancelled = newOrder([item("bowl")]);
  await store.place(cancelled, stock);
  await store.markCancelled(cancelled.id);
  await store.place(newOrder([item("bauble", 1, ["No. 3"])], new Date(Date.now() - PENDING_HOLD_MS - 1000)), stock);

  expect(await store.heldStock()).toEqual({ vase: 2, "small-brush": 1, "large-brush": 1 });
});

describe("payment", () => {
  test("a paid order gets the customer, delivery and total", async () => {
    const order = newOrder([item("bowl")]);
    await store.place(order, stock);
    await store.setCheckout(order.id, "cs_test_123");

    expect(await store.markPaid(order.id, payment)).toBe(true);
    const [saved] = await testDb.db.select().from(orders);
    expect(saved).toMatchObject({
      status: "paid",
      customerName: "Ada Potter",
      customerEmail: "ada@example.com",
      addressLine1: "1 Kiln Lane",
      addressLine2: null,
      city: "Stoke",
      postcode: "ST1 1AA",
      country: "GB",
      shippingPence: 495,
      totalPence: 1995,
      stripeCheckoutId: "cs_test_123",
    });
    expect(saved.paidAt).toBeInstanceOf(Date);
  });

  test("only a pending order changes, so repeated messages do nothing", async () => {
    const order = newOrder([item("bowl")]);
    await store.place(order, stock);

    expect(await store.markPaid(order.id, payment)).toBe(true);
    expect(await store.markPaid(order.id, payment)).toBe(false);
    expect(await store.markCancelled(order.id)).toBe(false);
    expect(await status(order.id)).toBe("paid");
  });

  test("a cancelled order can't be marked paid", async () => {
    const order = newOrder([item("bowl")]);
    await store.place(order, stock);
    expect(await store.markCancelled(order.id)).toBe(true);
    expect(await store.markPaid(order.id, payment)).toBe(false);
    expect(await status(order.id)).toBe("cancelled");
  });
});
