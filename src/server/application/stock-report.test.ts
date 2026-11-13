import { expect, test } from "vitest";
import { fixtureCollections, fixtureProducts } from "@/test/fixtures";
import { formatStockReport, stockReport } from "./stock-report";

const held = { sold: { vase: 1, "bauble-01": 1 }, inCheckout: { vase: 1 } };

test("made, sold, in checkout and left for each product with stock", () => {
  const rows = stockReport(fixtureCollections, fixtureProducts, held);
  expect(rows.find((r) => r.name === "Vase")).toEqual({
    collection: "Floral",
    name: "Vase",
    made: 3,
    sold: 1,
    inCheckout: 1,
    left: 1,
  });
  expect(rows.find((r) => r.name === "Bauble, No. 1")).toMatchObject({ made: 1, sold: 1, left: 0 });
});

test("lists pieces rather than the products and sets they belong to", () => {
  const names = stockReport(fixtureCollections, fixtureProducts, held).map((r) => r.name);
  expect(names).toContain("Bauble, No. 3");
  expect(names).toContain("Small Brush");
  expect(names).not.toContain("Bauble");
  expect(names).not.toContain("Brush Set");
});

test("never shows less than 0 left", () => {
  const rows = stockReport(fixtureCollections, fixtureProducts, { sold: { bowl: 3 }, inCheckout: {} });
  expect(rows.find((r) => r.name === "Bowl")?.left).toBe(0);
});

test("prints a table with sold-out pieces marked and totals", () => {
  const text = formatStockReport([
    { collection: "Floral", name: "Vase", made: 3, sold: 1, inCheckout: 1, left: 1 },
    { collection: "Christmas", name: "Bauble, No. 1", made: 1, sold: 1, inCheckout: 0, left: 0 },
  ]);
  expect(text.split("\n")).toEqual([
    "Collection   Product         Made   Sold   In checkout   Left",
    "----------   -------------   ----   ----   -----------   ----",
    "Floral       Vase               3      1             1      1",
    "Christmas    Bauble, No. 1      1      1             0      0   sold out",
    "",
    "4 made, 2 sold, 1 in checkout, 1 left. 1 of 2 sold out.",
  ]);
});
