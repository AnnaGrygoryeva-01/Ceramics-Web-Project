import { describe, expect, test } from "vitest";
import { fixtureProducts } from "@/test/fixtures";
import type { OrderRequestItem } from "./order";
import { priceOrder } from "./price-order";

const price = (...items: Partial<OrderRequestItem>[]) =>
  priceOrder(
    { items: items.map((item) => ({ slug: "vase", quantity: 1, choices: [], ...item })) },
    fixtureProducts,
  );

function priced(...items: Partial<OrderRequestItem>[]) {
  const result = price(...items);
  if (!result.ok) throw new Error(result.message);
  return result.order;
}

describe("prices", () => {
  test("come from the product and add up across lines", () => {
    const order = priced({ slug: "vase", quantity: 2 }, { slug: "bowl" });
    expect(order.total).toBe(4800 * 2 + 1500);
    expect(order.lines[0]).toMatchObject({ productSlug: "vase", productName: "Vase", unitPrice: 4800 });
  });

  test("a piece costs its own price", () => {
    const order = priced({ slug: "bauble", choices: ["No. 1"] }, { slug: "bauble", choices: ["No. 3"] });
    expect(order.lines.map((line) => line.unitPrice)).toEqual([1800, 2200]);
    expect(order.total).toBe(1800 + 2200);
  });
});

describe("stock demand", () => {
  test("a plain line uses up its own product", () => {
    expect(priced({ slug: "vase", quantity: 2 }).stockDemand).toEqual([{ productSlug: "vase", quantity: 2 }]);
  });

  test("a set uses up its picks and never itself", () => {
    const { stockDemand, lines } = priced({ slug: "brush-set", quantity: 1, choices: ["Small", "Large"] });
    expect(stockDemand).toEqual([
      { productSlug: "small-brush", quantity: 1 },
      { productSlug: "large-brush", quantity: 1 },
    ]);
    expect(lines[0].picks).toEqual([
      { choice: "Small", productSlug: "small-brush" },
      { choice: "Large", productSlug: "large-brush" },
    ]);
  });

  test("picks multiply by quantity, and the same pick twice counts twice", () => {
    const { stockDemand } = priced({ slug: "brush-set", quantity: 2, choices: ["Medium", "Medium"] });
    expect(stockDemand).toEqual([{ productSlug: "medium-brush", quantity: 4 }]);
  });

  test("single items and sets share the same stock", () => {
    const { stockDemand } = priced(
      { slug: "small-brush" },
      { slug: "brush-set", choices: ["Small", "Medium"] },
    );
    expect(stockDemand).toContainEqual({ productSlug: "small-brush", quantity: 2 });
  });
});

describe("invalid orders", () => {
  test.each([
    ["unknown product", { slug: "no-such-product" }],
    ["choices on a plain product", { slug: "vase", choices: ["Small"] }],
    ["too few picks", { slug: "brush-set", choices: ["Small"] }],
    ["too many picks", { slug: "brush-set", choices: ["Small", "Small", "Small"] }],
    ["a choice that doesn't exist", { slug: "brush-set", choices: ["Small", "Huge"] }],
    ["a name inherited from Object", { slug: "brush-set", choices: ["Small", "constructor"] }],
  ])("%s", (_name, item) => {
    expect(price(item)).toMatchObject({ ok: false, code: "invalid-order" });
  });
});

describe("out of stock", () => {
  test("names every short product", () => {
    expect(price({ slug: "vase", quantity: 4 }, { slug: "mug" })).toMatchObject({
      ok: false,
      code: "out-of-stock",
      outOfStock: ["vase", "mug"],
    });
  });

  test("counts stock across lines and sets", () => {
    const result = price({ slug: "large-brush" }, { slug: "brush-set", choices: ["Large", "Small"] });
    expect(result).toMatchObject({ code: "out-of-stock", outOfStock: ["large-brush"] });
  });
});
