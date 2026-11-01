import { afterEach, beforeEach, expect, test } from "vitest";
import { fixtureCustomer as customer } from "@/test/fixtures";
import { createTestDb, seedFixtures } from "@/test/test-db";
import type { Product } from "../../domain/catalogue";
import type { OrderRequestItem } from "../../domain/order";
import { priceOrder } from "../../domain/price-order";
import { createCatalogueReader } from "./catalogue-reader";
import { createOrderStore } from "./order-store";
import { orderItemPicks, orderItems, orders } from "./schema";

let testDb: Awaited<ReturnType<typeof createTestDb>>;
let reader: ReturnType<typeof createCatalogueReader>;
let store: ReturnType<typeof createOrderStore>;

beforeEach(async () => {
  testDb = await createTestDb();
  await seedFixtures(testDb.db);
  reader = createCatalogueReader(testDb.db);
  store = createOrderStore(testDb.db);
});
afterEach(() => testDb.cleanup());

// An order priced against `products`, which can be older than what's in the database
function newOrder(items: OrderRequestItem[], products: Product[]) {
  const priced = priceOrder({ customer, items }, products);
  if (!priced.ok) throw new Error(priced.message);
  return { ...priced.order, id: crypto.randomUUID(), createdAt: new Date() };
}

const stock = async (slug: string) => (await reader.getProduct(slug))?.stock;
const item = (slug: string, quantity = 1, choices: string[] = []) => ({ slug, quantity, choices });
const inStock = (products: Product[]) => products.map((p) => (p.options ? p : { ...p, stock: 99 }));

test("saves the order with its lines and picks, and takes the stock", async () => {
  const items = [item("vase", 2), item("brush-set", 1, ["Small", "Large"])];
  const order = newOrder(items, await reader.listProducts());

  expect(await store.place(order)).toBe("placed");

  const [saved] = await testDb.db.select().from(orders);
  expect(saved).toMatchObject({
    id: order.id,
    status: "pending",
    customerEmail: customer.email,
    addressLine1: customer.address.line1,
    addressLine2: null,
    totalPence: 4800 * 2 + 5500,
  });
  expect(saved.createdAt).toEqual(order.createdAt);

  const lines = await testDb.db.select().from(orderItems).orderBy(orderItems.lineNo);
  expect(lines.map((l) => [l.lineNo, l.productName, l.unitPricePence, l.quantity])).toEqual([
    [0, "Vase", 4800, 2],
    [1, "Brush Set", 5500, 1],
  ]);

  const picks = await testDb.db.select().from(orderItemPicks).orderBy(orderItemPicks.pickNo);
  expect(picks.map((p) => [p.lineNo, p.pickNo, p.choice])).toEqual([[1, 0, "Small"], [1, 1, "Large"]]);

  expect(await stock("vase")).toBe(1);
  expect(await stock("small-brush")).toBe(1);
  expect(await stock("large-brush")).toBe(0);
});

test("a shortfall on a later product undoes the whole order", async () => {
  const order = newOrder([item("vase"), item("bowl", 5)], inStock(await reader.listProducts()));

  expect(await store.place(order)).toBe("out-of-stock");

  expect(await stock("vase")).toBe(3);
  expect(await stock("bowl")).toBe(1);
  expect(await testDb.db.select().from(orders)).toEqual([]);
  expect(await testDb.db.select().from(orderItems)).toEqual([]);
});

test("the last one sells once, even if both orders saw it in stock", async () => {
  const products = await reader.listProducts();

  expect(await store.place(newOrder([item("bowl")], products))).toBe("placed");
  expect(await store.place(newOrder([item("bowl")], products))).toBe("out-of-stock");

  expect(await stock("bowl")).toBe(0);
});

test("orders at the same moment never oversell", async () => {
  const products = await reader.listProducts();
  const attempts = await Promise.allSettled(
    Array.from({ length: 5 }, () => store.place(newOrder([item("bowl")], products))),
  );

  const placed = attempts.filter((a) => a.status === "fulfilled" && a.value === "placed");
  expect(placed).toHaveLength(1);
  expect(await stock("bowl")).toBe(0);
  expect(await testDb.db.select().from(orders)).toHaveLength(1);
});
