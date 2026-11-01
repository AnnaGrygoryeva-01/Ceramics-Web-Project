import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { lookup } from "@/test/fixtures";
import { addToCart, clearCart, setQuantity, useCart } from "./cart";

const stored = () => JSON.parse(localStorage.getItem("cart") ?? "{}");

beforeEach(() => {
  clearCart();
});

describe("changing the cart", () => {
  test("addToCart adds one at a time and saves to localStorage", () => {
    addToCart(lookup, "vase");
    addToCart(lookup, "vase");
    addToCart(lookup, "brush-set", ["Small", "Large"]);
    expect(stored()).toEqual({ vase: 2, "brush-set|Small,Large": 1 });
  });

  test("addToCart does nothing once the stock is used up", () => {
    addToCart(lookup, "bowl");
    addToCart(lookup, "bowl");
    addToCart(lookup, "mug");
    expect(stored()).toEqual({ bowl: 1 });
  });

  test("setQuantity sets a line, and removes it at 0", () => {
    setQuantity("vase", 3);
    expect(stored()).toEqual({ vase: 3 });
    setQuantity("vase", 0);
    expect(stored()).toEqual({});
  });

  test("clearCart empties it", () => {
    addToCart(lookup, "vase");
    clearCart();
    expect(stored()).toEqual({});
  });
});

describe("useCart", () => {
  test("re-renders when the cart changes", () => {
    const { result } = renderHook(() => useCart());
    expect(result.current).toEqual({});
    act(() => addToCart(lookup, "vase"));
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
