import { afterEach, beforeEach, expect, test } from "vitest";
import { fixture, fixtureCollections, fixtureProducts, listedFixtureProducts } from "@/test/fixtures";
import { createTestDb, seedFixtures } from "@/test/test-db";
import { createCatalogueReader } from "./catalogue-reader";
import { products } from "./schema";

let testDb: Awaited<ReturnType<typeof createTestDb>>;
let reader: ReturnType<typeof createCatalogueReader>;

beforeEach(async () => {
  testDb = await createTestDb();
  await seedFixtures(testDb.db);
  reader = createCatalogueReader(testDb.db);
});
afterEach(() => testDb.cleanup());

test("products come back complete and in order", async () => {
  expect(await reader.listProducts({ includeHidden: true })).toEqual(fixtureProducts);
});

test("pieces are left out of listings unless asked for", async () => {
  expect(await reader.listProducts()).toEqual(listedFixtureProducts);
  const floral = await reader.listProducts({ collection: "floral", includeHidden: true });
  expect(floral.filter((p) => p.hidden).map((p) => p.slug)).toEqual(["bauble-01", "bauble-02", "bauble-03"]);
  // Still found by slug, for the cart and orders
  expect(await reader.getProduct("bauble-02")).toEqual(fixture("bauble-02"));
});

test("collections come back complete and in order", async () => {
  expect(await reader.listCollections()).toEqual(fixtureCollections);
});

test("option values keep their order, which the dropdown relies on", async () => {
  const set = await reader.getProduct("brush-set");
  expect(Object.keys(set!.options!.values)).toEqual(["Small", "Medium", "Large"]);
});

test("finds a product or collection by slug", async () => {
  expect(await reader.getProduct("vase")).toEqual(fixture("vase"));
  expect(await reader.getCollection("brushes")).toEqual(fixtureCollections[1]);
});

test("filters products by collection slug", async () => {
  const brushes = await reader.listProducts({ collection: "brushes" });
  expect(brushes.map((p) => p.slug)).toEqual(["small-brush", "medium-brush", "large-brush", "brush-set"]);
});

test("an unknown slug finds nothing", async () => {
  expect(await reader.listProducts({ collection: "no-such-collection" })).toEqual([]);
  expect(await reader.getProduct("no-such-product")).toBeNull();
  expect(await reader.getCollection("no-such-collection")).toBeNull();
});

test("foreign keys are enforced", async () => {
  const { rows } = await testDb.db.$client.execute("PRAGMA foreign_keys");
  expect(rows[0][0]).toBe(1);

  const orphan = { id: "x", slug: "x", collectionId: "no-such-id", name: "x", pricePence: 1, description: "", position: 0 };
  await expect(testDb.db.insert(products).values(orphan)).rejects.toThrow();
});
