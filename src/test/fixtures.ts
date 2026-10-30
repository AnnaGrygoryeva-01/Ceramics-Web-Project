import type { Collection, Product } from "@/lib/products";

// Fixed products for tests, so they don't break when the real stock or prices in
// src/data/products change. Use with mockProducts (see below).
export const fixtureCollections: Collection[] = [
  { slug: "floral", name: "Floral", description: "" },
  { slug: "brushes", name: "Brushes", description: "" },
];

export const fixtureProducts: Product[] = [
  { slug: "vase", collection: "floral", name: "Vase", price: 4800, description: "", stock: 3 },
  { slug: "bowl", collection: "floral", name: "Bowl", price: 1500, description: "", stock: 1 },
  { slug: "mug", collection: "floral", name: "Mug", price: 2500, description: "", stock: 0 },
  { slug: "small-brush", collection: "brushes", name: "Small Brush", price: 1900, description: "", stock: 2 },
  { slug: "medium-brush", collection: "brushes", name: "Medium Brush", price: 1900, description: "", stock: 5 },
  { slug: "large-brush", collection: "brushes", name: "Large Brush", price: 2400, description: "", stock: 1 },
  {
    slug: "brush-set",
    collection: "brushes",
    name: "Brush Set",
    price: 5500,
    description: "",
    options: {
      label: "Brush",
      count: 2,
      values: { Small: "small-brush", Medium: "medium-brush", Large: "large-brush" },
    },
  },
];

export const fixture = (slug: string) => fixtureProducts.find((p) => p.slug === slug)!;

// For vi.mock("@/lib/products", ...) (see cart.test.ts for how to call it): keeps the real helpers
// (formatPrice, productUrl, ...) but swaps in the fixture products
export async function mockProducts(importOriginal: () => Promise<typeof import("@/lib/products")>) {
  const actual = await importOriginal();
  return {
    ...actual,
    collections: fixtureCollections,
    products: fixtureProducts,
    getProduct: (slug: string) => fixtureProducts.find((p) => p.slug === slug),
    getCollection: (slug: string) => fixtureCollections.find((c) => c.slug === slug),
    getCollectionProducts: (collection: string) => fixtureProducts.filter((p) => p.collection === collection),
  };
}
