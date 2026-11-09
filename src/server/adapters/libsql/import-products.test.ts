import { existsSync, readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createTestDb, seedFixtures } from "@/test/test-db";
import { createCatalogueReader } from "./catalogue-reader";
import { checkProductFile, importProducts, type ProductFileEntry } from "./import-products";
import { products } from "./schema";

let testDb: Awaited<ReturnType<typeof createTestDb>>;
let reader: ReturnType<typeof createCatalogueReader>;

beforeEach(async () => {
  testDb = await createTestDb();
  await seedFixtures(testDb.db);
  reader = createCatalogueReader(testDb.db);
});
afterEach(() => testDb.cleanup());

const plain: ProductFileEntry = { slug: "jug", name: "Jug", price: 3000, description: "A jug", image: "/jug.jpg", stock: 2 };
const pieces: ProductFileEntry = {
  slug: "star",
  name: "Star",
  price: 1800,
  description: "A star",
  variants: [
    { slug: "star-01", label: "No. 1", image: "/star-01.jpg", stock: 1 },
    { slug: "star-02", label: "No. 2", image: "/star-02.jpg", stock: 0 },
  ],
};
const lone: ProductFileEntry = {
  slug: "tree",
  name: "Tree",
  price: 1800,
  description: "A tree",
  variants: [{ slug: "tree-01", label: "No. 1", image: "/tree-01.jpg", stock: 1 }],
};

describe("importProducts", () => {
  test("adds plain products to the collection", async () => {
    expect(await importProducts(testDb.db, "floral", [plain])).toEqual({ created: 1, updated: 0 });
    expect(await reader.getProduct("jug")).toMatchObject({
      collection: "floral",
      name: "Jug",
      price: 3000,
      image: "/jug.jpg",
      stock: 2,
    });
  });

  test("turns variants into hidden pieces picked through one option", async () => {
    await importProducts(testDb.db, "floral", [pieces]);

    const star = await reader.getProduct("star");
    expect(star).toMatchObject({ image: "/star-01.jpg", stock: undefined });
    expect(star!.options).toEqual({ label: "Piece", count: 1, values: { "No. 1": "star-01", "No. 2": "star-02" } });
    expect(await reader.getProduct("star-02")).toMatchObject({
      name: "Star, No. 2",
      price: 1800,
      image: "/star-02.jpg",
      stock: 0,
      hidden: true,
    });

    const listed = (await reader.listProducts({ collection: "floral" })).map((p) => p.slug);
    expect(listed).toContain("star");
    expect(listed).not.toContain("star-01");
  });

  test("a single variant is just the product's own stock and photo", async () => {
    await importProducts(testDb.db, "floral", [lone]);
    const tree = await reader.getProduct("tree");
    expect(tree).toMatchObject({ stock: 1, image: "/tree-01.jpg", options: undefined });
    expect(await reader.getProduct("tree-01")).toBeNull();
  });

  test("running it again updates by slug, keeping ids and the stock in the database", async () => {
    await importProducts(testDb.db, "floral", [plain, pieces]);
    const before = await reader.getProduct("jug");
    // Sold one since
    await testDb.db.update(products).set({ stock: 1 }).where(eq(products.slug, "jug"));

    const result = await importProducts(testDb.db, "floral", [{ ...plain, price: 3500, stock: 9 }, pieces]);

    expect(result).toEqual({ created: 0, updated: 4 });
    expect(await reader.getProduct("jug")).toMatchObject({ id: before!.id, price: 3500, stock: 1 });
    expect(Object.keys((await reader.getProduct("star"))!.options!.values)).toEqual(["No. 1", "No. 2"]);
  });

  test("an unknown collection or a slug from another collection stops it, changing nothing", async () => {
    await expect(importProducts(testDb.db, "no-such-collection", [plain])).rejects.toThrow('no collection "no-such-collection"');
    await expect(importProducts(testDb.db, "floral", [plain, { ...plain, slug: "small-brush" }])).rejects.toThrow(
      "Already in another collection: small-brush",
    );
    expect(await reader.getProduct("jug")).toBeNull();
  });

  test("refuses a file with problems", async () => {
    await expect(importProducts(testDb.db, "floral", [{ ...plain, price: null as never }])).rejects.toThrow(
      "jug: price must be whole pence above 0",
    );
  });
});

describe("checkProductFile", () => {
  test("a good file has no problems", () => {
    expect(checkProductFile([plain, pieces, lone])).toEqual([]);
  });

  test("lists what's wrong", () => {
    expect(
      checkProductFile([
        { ...plain, price: 12.5 },
        { ...plain, slug: "no-stock", stock: undefined },
        { ...pieces, stock: 3 },
        { ...lone, slug: "star", variants: [{ slug: "star-01", label: "No. 1, blue", stock: -1 }] },
      ]),
    ).toEqual([
      '"star" is used more than once',
      '"star-01" is used more than once',
      "jug: price must be whole pence above 0",
      "no-stock: needs a stock or variants",
      "star: stock goes on the variants",
      "star-01: stock must be 0 or more",
      "star-01: label can't contain | or , (cart keys use them)",
    ]);
  });

  // The real file in the repo, so mistakes show up before an import
  test("src/data/products/christmas-collection.json can be imported", () => {
    const file: ProductFileEntry[] = JSON.parse(readFileSync("src/data/products/christmas-collection.json", "utf8"));
    expect(checkProductFile(file)).toEqual([]);

    const images = file.flatMap((p) => [p.image, ...(p.variants ?? []).map((v) => v.image)]).filter(Boolean);
    expect(images.filter((image) => !existsSync(`public${image}`))).toEqual([]);
  });
});
