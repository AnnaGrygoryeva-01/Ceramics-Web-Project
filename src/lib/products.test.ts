import { describe, expect, test } from "vitest";
import { formatPrice, hasSnow, productUrl } from "./products";

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

test("only the Christmas collection has snow", () => {
  expect(hasSnow({ slug: "christmas-collection" } as never)).toBe(true);
  expect(hasSnow({ slug: "brushes" } as never)).toBe(false);
});
