import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fixture } from "@/test/fixtures";
import {
  addToCart,
  canAdd,
  cartKey,
  clearCart,
  countInCart,
  isSoldOut,
  parseCartKey,
  setQuantity,
  stockLeft,
  useCart,
} from "./cart";

vi.mock("@/lib/products", async (importOriginal) => (await import("@/test/fixtures")).mockProducts(importOriginal));

const stored = () => JSON.parse(localStorage.getItem("cart") ?? "{}");

beforeEach(() => {
  clearCart();
});

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

describe("countInCart", () => {
  test("adds up every option combination of a product", () => {
    const cart = { "brush-set|Small,Large": 1, "brush-set|Small,Small": 2, vase: 4 };
    expect(countInCart(cart, "brush-set")).toBe(3);
    expect(countInCart(cart, "vase")).toBe(4);
    expect(countInCart(cart, "bowl")).toBe(0);
  });
});

describe("stock", () => {
  test("canAdd stops at the product's stock", () => {
    expect(canAdd({}, "vase")).toBe(true);
    expect(canAdd({ vase: 2 }, "vase")).toBe(true);
    expect(canAdd({ vase: 3 }, "vase")).toBe(false);
  });

  test("unknown and out of stock products can't be added", () => {
    expect(canAdd({}, "no-such-product")).toBe(false);
    expect(canAdd({}, "mug")).toBe(false);
  });

  test("a set uses up the stock of the products picked for it", () => {
    // Only one large brush
    expect(canAdd({}, "brush-set", ["Small", "Large"])).toBe(true);
    expect(canAdd({ "large-brush": 1 }, "brush-set", ["Small", "Large"])).toBe(false);
    expect(canAdd({ "large-brush": 1 }, "brush-set", ["Small", "Medium"])).toBe(true);
    // ...and a set in the cart uses up the single brush too
    expect(canAdd({ "brush-set|Medium,Large": 1 }, "large-brush")).toBe(false);
  });

  test("picking the same option twice uses up two", () => {
    expect(canAdd({}, "brush-set", ["Small", "Small"])).toBe(true);
    expect(canAdd({ "small-brush": 1 }, "brush-set", ["Small", "Small"])).toBe(false);
    expect(canAdd({}, "brush-set", ["Large", "Large"])).toBe(false);
  });

  test("stockLeft counts singles and sets", () => {
    expect(stockLeft({}, "small-brush")).toBe(2);
    expect(stockLeft({ "small-brush": 1, "brush-set|Small,Medium": 1 }, "small-brush")).toBe(0);
    expect(stockLeft({}, "no-such-product")).toBe(0);
  });

  test("isSoldOut", () => {
    expect(isSoldOut(fixture("mug"))).toBe(true);
    expect(isSoldOut(fixture("vase"))).toBe(false);
    expect(isSoldOut(fixture("brush-set"))).toBe(false);
    // A set of two from options with only one item of stock between them
    expect(
      isSoldOut({
        ...fixture("brush-set"),
        options: { label: "Pick", count: 2, values: { Mug: "mug", Bowl: "bowl" } },
      }),
    ).toBe(true);
  });
});

describe("changing the cart", () => {
  test("addToCart adds one at a time and saves to localStorage", () => {
    addToCart("vase");
    addToCart("vase");
    addToCart("brush-set", ["Small", "Large"]);
    expect(stored()).toEqual({ vase: 2, "brush-set|Small,Large": 1 });
  });

  test("addToCart does nothing once the stock is used up", () => {
    addToCart("bowl");
    addToCart("bowl");
    addToCart("mug");
    expect(stored()).toEqual({ bowl: 1 });
  });

  test("setQuantity sets a line, and removes it at 0", () => {
    setQuantity("vase", 3);
    expect(stored()).toEqual({ vase: 3 });
    setQuantity("vase", 0);
    expect(stored()).toEqual({});
  });

  test("clearCart empties it", () => {
    addToCart("vase");
    clearCart();
    expect(stored()).toEqual({});
  });
});

describe("useCart", () => {
  test("re-renders when the cart changes", () => {
    const { result } = renderHook(() => useCart());
    expect(result.current).toEqual({});
    act(() => addToCart("vase"));
    expect(result.current).toEqual({ vase: 1 });
  });

  test("picks up changes made in another tab", () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      localStorage.setItem("cart", JSON.stringify({ bowl: 1 }));
      window.dispatchEvent(new StorageEvent("storage", { key: "cart" }));
    });
    expect(result.current).toEqual({ bowl: 1 });
  });

  test("treats a broken saved cart as empty", () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      localStorage.setItem("cart", "{not json");
      window.dispatchEvent(new StorageEvent("storage", { key: "cart" }));
    });
    expect(result.current).toEqual({});
  });
});
