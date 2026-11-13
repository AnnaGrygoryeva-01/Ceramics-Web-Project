import { existsSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { catalogueFiles } from "@/data/catalogue";
import { checkCatalogue, createJsonCatalogueReader, type CatalogueFiles, type ProductFileEntry } from "./catalogue-reader";

const plain: ProductFileEntry = { slug: "jug", name: "Jug", price: 3000, description: "", image: "/jug.jpg", stock: 2 };
const set: ProductFileEntry = {
  slug: "pair",
  name: "Pair",
  price: 5000,
  description: "",
  options: { label: "Jug", count: 2, values: { Big: "jug" } },
};
const pieces: ProductFileEntry = {
  slug: "star",
  name: "Star",
  price: 1800,
  description: "",
  variants: [
    { slug: "star-01", label: "No. 1", image: "/star-01.jpg", stock: 1 },
    { slug: "star-02", label: "No. 2", image: "/star-02.jpg", stock: 0 },
  ],
};
const lone: ProductFileEntry = {
  slug: "tree",
  name: "Tree",
  price: 1800,
  description: "",
  variants: [{ slug: "tree-01", label: "No. 1", image: "/tree-01.jpg", stock: 1 }],
};

const files: CatalogueFiles = {
  collections: [
    { slug: "kitchen", name: "Kitchen", description: "" },
    { slug: "xmas", name: "Christmas", description: "", image: "/xmas.jpg" },
  ],
  products: { xmas: [pieces, lone], kitchen: [plain, set] },
};
const reader = createJsonCatalogueReader(files);

describe("createJsonCatalogueReader", () => {
  test("collections and products, in the order of the collections", async () => {
    expect(await reader.listCollections()).toEqual(files.collections);
    expect((await reader.listProducts()).map((p) => p.slug)).toEqual(["jug", "pair", "star", "tree"]);
  });

  test("plain products and sets come through as they are", async () => {
    expect(await reader.getProduct("jug")).toEqual({ ...plain, collection: "kitchen" });
    expect(await reader.getProduct("pair")).toEqual({ ...set, collection: "kitchen" });
  });

  test("variants become hidden pieces picked through one option", async () => {
    expect(await reader.getProduct("star")).toEqual({
      slug: "star",
      collection: "xmas",
      name: "Star",
      price: 1800,
      description: "",
      image: "/star-01.jpg",
      options: { label: "Piece", count: 1, values: { "No. 1": "star-01", "No. 2": "star-02" } },
    });
    expect(await reader.getProduct("star-02")).toEqual({
      slug: "star-02",
      collection: "xmas",
      name: "Star, No. 2",
      price: 1800,
      description: "",
      image: "/star-02.jpg",
      stock: 0,
      hidden: true,
    });
  });

  test("variants can have their own price, and then the product needs none", async () => {
    const priced = createJsonCatalogueReader({
      ...files,
      products: {
        xmas: [{ ...pieces, price: undefined, variants: [{ ...pieces.variants![0], price: 2200 }, { ...pieces.variants![1], price: 1900 }] }],
      },
    });
    expect(await priced.getProduct("star-01")).toMatchObject({ price: 2200 });
    expect(await priced.getProduct("star-02")).toMatchObject({ price: 1900 });
    expect(await priced.getProduct("star")).toMatchObject({ price: 1900 }); // The cheapest, for sorting
  });

  test("a variant's size goes on its piece, or on the product for a single variant", async () => {
    const sized = createJsonCatalogueReader({
      ...files,
      products: {
        xmas: [
          { ...pieces, variants: [{ ...pieces.variants![0], size: "6 × 7 cm" }, pieces.variants![1]] },
          { ...lone, variants: [{ ...lone.variants![0], size: "5 × 7 cm" }] },
        ],
      },
    });
    expect(await sized.getProduct("star-01")).toMatchObject({ size: "6 × 7 cm" });
    expect(await sized.getProduct("star-02")).not.toHaveProperty("size");
    expect(await sized.getProduct("tree")).toMatchObject({ size: "5 × 7 cm" });
  });

  test("a single variant is just the product's own stock and photo", async () => {
    expect(await reader.getProduct("tree")).toMatchObject({ stock: 1, image: "/tree-01.jpg" });
    expect(await reader.getProduct("tree")).not.toHaveProperty("options");
    expect(await reader.getProduct("tree-01")).toBeNull();
  });

  test("filters by collection, and leaves pieces out unless asked for", async () => {
    expect((await reader.listProducts({ collection: "xmas" })).map((p) => p.slug)).toEqual(["star", "tree"]);
    expect((await reader.listProducts({ collection: "xmas", includeHidden: true })).map((p) => p.slug)).toEqual([
      "star",
      "star-01",
      "star-02",
      "tree",
    ]);
  });

  test("an unknown slug finds nothing", async () => {
    expect(await reader.getProduct("nope")).toBeNull();
    expect(await reader.getCollection("nope")).toBeNull();
    expect(await reader.listProducts({ collection: "nope" })).toEqual([]);
    expect(await reader.getCollection("xmas")).toEqual(files.collections[1]);
  });
});

describe("checkCatalogue", () => {
  test("good files have no problems", () => {
    expect(checkCatalogue(files)).toEqual([]);
  });

  test("lists what's wrong", () => {
    expect(
      checkCatalogue({
        collections: files.collections,
        products: {
          kitchen: [
            { ...plain, price: 12.5 },
            { ...plain, slug: "no-stock", stock: undefined },
            { ...set, stock: 1, options: { label: "Jug", count: 2, values: { Big: "nope" } } },
          ],
          xmas: [
            { ...pieces, stock: 3 },
            { ...lone, slug: "star", variants: [{ slug: "x", label: "A, b", stock: -1 }] },
            { ...lone, slug: "angel", price: undefined, variants: [{ slug: "y", label: "A", price: 0, stock: 1 }] },
            { ...lone, slug: "bell", price: undefined },
          ],
          garden: [],
        },
      }),
    ).toEqual([
      '"star" is used more than once',
      "garden: no such collection",
      "jug: price must be whole pence above 0",
      "no-stock: needs a stock of 0 or more, options or variants",
      "pair: a set has no stock of its own",
      'pair: option "nope" needs a product with stock',
      "star: stock goes on the variants",
      "x: stock must be 0 or more",
      "x: label can't contain | or , (cart keys use them)",
      "y: price must be whole pence above 0",
      "bell: price must be whole pence above 0",
    ]);
  });
});

// The real files in src/data, so mistakes show up before a deploy
describe("the shop's product files", () => {
  test("have no problems", () => {
    expect(checkCatalogue(catalogueFiles)).toEqual([]);
  });

  test("every collection has a product file", () => {
    expect(Object.keys(catalogueFiles.products).toSorted()).toEqual(
      catalogueFiles.collections.map((c) => c.slug).toSorted(),
    );
  });

  test("every photo exists in /public", () => {
    const entries = Object.values(catalogueFiles.products).flat();
    const images = [
      ...catalogueFiles.collections.map((c) => c.image),
      ...entries.flatMap((p) => [p.image, ...(p.variants ?? []).map((v) => v.image)]),
    ].filter(Boolean);
    expect(images.filter((image) => !existsSync(`public${image}`))).toEqual([]);
  });
});
