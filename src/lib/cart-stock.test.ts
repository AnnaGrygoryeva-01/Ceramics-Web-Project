import { describe, expect, test } from "vitest";
import { fixture, lookup } from "@/test/fixtures";
import { canAdd, cartKey, countInCart, countItems, isSoldOut, parseCartKey, stockLeft } from "./cart-stock";

describe("cartKey / parseCartKey", () => {
  test("a product without options is keyed by its slug", () => {
    expect(cartKey("vase")).toBe("vase");
    expect(parseCartKey("vase")).toEqual({ slug: "vase", choices: [] });
  });

  test("picked options are added to the key and read back", () => {
    const key = cartKey("brush-set", ["Small", "Large"]);
    expect(key).toBe("brush-set|Small,Large");
    expect(parseCartKey(key)).toEqual({ slug: "brush-set", choices: ["Small", "Large"] });
  });
});

describe("counting", () => {
  test("countInCart adds up every option combination of a product", () => {
    const cart = { "brush-set|Small,Large": 1, "brush-set|Small,Small": 2, vase: 4 };
    expect(countInCart(cart, "brush-set")).toBe(3);
    expect(countInCart(cart, "vase")).toBe(4);
    expect(countInCart(cart, "bowl")).toBe(0);
  });

  test("countItems skips products that no longer exist", () => {
    expect(countItems({ vase: 2, "deleted-product": 5 }, lookup)).toBe(2);
  });

  test("countItems counts everything until the products are known", () => {
    expect(countItems({ vase: 2, "deleted-product": 5 }, null)).toBe(7);
  });
});

describe("stock", () => {
  test("canAdd stops at the product's stock", () => {
    expect(canAdd(lookup, {}, "vase")).toBe(true);
    expect(canAdd(lookup, { vase: 2 }, "vase")).toBe(true);
    expect(canAdd(lookup, { vase: 3 }, "vase")).toBe(false);
  });

  test("unknown and out of stock products can't be added", () => {
    expect(canAdd(lookup, {}, "no-such-product")).toBe(false);
    expect(canAdd(lookup, {}, "mug")).toBe(false);
  });

  test("a set uses up the stock of the products picked for it", () => {
    // Only one large brush
    expect(canAdd(lookup, {}, "brush-set", ["Small", "Large"])).toBe(true);
    expect(canAdd(lookup, { "large-brush": 1 }, "brush-set", ["Small", "Large"])).toBe(false);
    expect(canAdd(lookup, { "large-brush": 1 }, "brush-set", ["Small", "Medium"])).toBe(true);
    // ...and a set in the cart uses up the single brush too
    expect(canAdd(lookup, { "brush-set|Medium,Large": 1 }, "large-brush")).toBe(false);
  });

  test("picking the same option twice uses up two", () => {
    expect(canAdd(lookup, {}, "brush-set", ["Small", "Small"])).toBe(true);
    expect(canAdd(lookup, { "small-brush": 1 }, "brush-set", ["Small", "Small"])).toBe(false);
    expect(canAdd(lookup, {}, "brush-set", ["Large", "Large"])).toBe(false);
  });

  test("stockLeft counts singles and sets", () => {
    expect(stockLeft(lookup, {}, "small-brush")).toBe(2);
    expect(stockLeft(lookup, { "small-brush": 1, "brush-set|Small,Medium": 1 }, "small-brush")).toBe(0);
    expect(stockLeft(lookup, {}, "no-such-product")).toBe(0);
  });

  test("isSoldOut", () => {
    expect(isSoldOut(lookup, fixture("mug"))).toBe(true);
    expect(isSoldOut(lookup, fixture("vase"))).toBe(false);
    expect(isSoldOut(lookup, fixture("brush-set"))).toBe(false);
    // A set of two from options with only one item of stock between them
    expect(
      isSoldOut(lookup, {
        ...fixture("brush-set"),
        options: { label: "Pick", count: 2, values: { Mug: "mug", Bowl: "bowl" } },
      }),
    ).toBe(true);
  });
});
