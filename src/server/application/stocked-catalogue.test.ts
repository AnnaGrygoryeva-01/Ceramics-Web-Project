import { afterEach, expect, test, vi } from "vitest";
import { fixtureCollections, fixtureProducts } from "@/test/fixtures";
import { createJsonCatalogueReader } from "../adapters/json/catalogue-reader";
import type { CatalogueReader } from "../ports/catalogue";
import { createStockedCatalogue } from "./stocked-catalogue";

const reader: CatalogueReader = {
  listCollections: async () => fixtureCollections,
  getCollection: async (slug) => fixtureCollections.find((c) => c.slug === slug) ?? null,
  listProducts: async () => fixtureProducts,
  getProduct: async (slug) => fixtureProducts.find((p) => p.slug === slug) ?? null,
};

afterEach(() => vi.restoreAllMocks());

test("orders take their stock off what's shown", async () => {
  const catalogue = createStockedCatalogue(reader, async () => ({ vase: 2, "bauble-03": 1 }));
  expect((await catalogue.getProduct("vase"))?.stock).toBe(1); // 3 made, 2 held
  expect((await catalogue.getProduct("bauble-03"))?.stock).toBe(0); // The one piece is sold
  expect((await catalogue.getProduct("bowl"))?.stock).toBe(1); // Nothing held
});

test("lists products with their stock left, never below 0", async () => {
  const catalogue = createStockedCatalogue(reader, async () => ({ bowl: 5 }));
  const products = await catalogue.listProducts();
  expect(products.find((p) => p.slug === "bowl")?.stock).toBe(0);
  expect(products.find((p) => p.slug === "vase")?.stock).toBe(3);
  expect(products).toHaveLength(fixtureProducts.length);
});

test("a set has no stock of its own to change", async () => {
  const catalogue = createStockedCatalogue(reader, async () => ({ "brush-set": 1 }));
  expect((await catalogue.getProduct("brush-set"))?.stock).toBeUndefined();
});

test("reads held stock once, however many products are asked for", async () => {
  const readHeld = vi.fn(async () => ({}));
  const catalogue = createStockedCatalogue(reader, readHeld);
  await catalogue.listProducts();
  await catalogue.getProduct("vase");
  expect(readHeld).toHaveBeenCalledTimes(1);
});

test("shows the files' stock if held stock can't be read", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const catalogue = createStockedCatalogue(reader, async () => {
    throw new Error("database down");
  });
  expect((await catalogue.getProduct("vase"))?.stock).toBe(3);
  expect(error).toHaveBeenCalled();
});

test("works over the real JSON reader too", async () => {
  const json = createJsonCatalogueReader({ collections: fixtureCollections, products: { floral: [] } });
  const catalogue = createStockedCatalogue(json, async () => ({}));
  expect(await catalogue.listCollections()).toEqual(fixtureCollections);
  expect(await catalogue.getProduct("nothing")).toBeNull();
});
