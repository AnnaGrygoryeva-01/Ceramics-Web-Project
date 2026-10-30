import { describe, expect, test } from "vitest";
import {
  collections,
  formatPrice,
  getCollection,
  getCollectionProducts,
  getProduct,
  productUrl,
  products,
} from "./products";

describe("formatPrice", () => {
  test("formats pence as pounds", () => {
    expect(formatPrice(4800)).toBe("£48.00");
    expect(formatPrice(1999)).toBe("£19.99");
    expect(formatPrice(0)).toBe("£0.00");
    expect(formatPrice(123456)).toBe("£1,234.56");
  });
});

test("productUrl", () => {
  expect(productUrl({ slug: "vase", collection: "floral" } as never)).toBe("/shop/floral/vase");
});

test("lookups", () => {
  const first = products[0];
  expect(getProduct(first.slug)).toBe(first);
  expect(getProduct("no-such-product")).toBeUndefined();
  expect(getCollection(collections[0].slug)).toBe(collections[0]);
  expect(getCollection("no-such-collection")).toBeUndefined();
  expect(getCollectionProducts(first.collection)).toContain(first);
});

// Checks on the real product data in src/data/products, to catch typos when editing it
describe("product data", () => {
  test("slugs are unique", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("every product is in a known collection", () => {
    for (const product of products) {
      expect(getCollection(product.collection), product.slug).toBeDefined();
    }
  });

  test("prices are whole pence", () => {
    for (const product of products) {
      expect(Number.isInteger(product.price) && product.price > 0, product.slug).toBe(true);
    }
  });

  test("options point at existing products that have stock of their own", () => {
    for (const product of products.filter((p) => p.options)) {
      expect(product.stock, `${product.slug} should not have stock`).toBeUndefined();
      for (const slug of Object.values(product.options!.values)) {
        const target = getProduct(slug);
        expect(target, `${product.slug} -> ${slug}`).toBeDefined();
        expect(target!.stock, `${slug} stock`).toBeTypeOf("number");
      }
    }
  });
});
