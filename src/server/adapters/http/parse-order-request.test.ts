import { describe, expect, test } from "vitest";
import { parseOrderRequest } from "./parse-order-request";

const items = [{ slug: "vase", quantity: 1 }];

const parse = (body: unknown) => parseOrderRequest(JSON.stringify(body));
const parseWith = (changes: object) => parse({ items, ...changes });

test("accepts a valid order, defaulting choices", () => {
  expect(parseWith({})).toEqual({ ok: true, request: { items: [{ slug: "vase", quantity: 1, choices: [] }] } });
});

test("keeps the choices of a set", () => {
  const result = parseWith({ items: [{ slug: "brush-set", quantity: 2, choices: ["Small", "Large"] }] });
  expect(result).toMatchObject({ ok: true, request: { items: [{ quantity: 2, choices: ["Small", "Large"] }] } });
});

test("drops anything it doesn't know, such as a price or customer from the client", () => {
  const customer = { name: "Ada Potter", email: "ada@example.com" };
  const result = parseWith({ customer, total: 1, items: [{ slug: "vase", quantity: 1, price: 1 }] });
  expect(JSON.stringify(result)).not.toContain("Ada");
  expect(result).toEqual(expect.objectContaining({ ok: true }));
  expect(JSON.stringify(result)).not.toContain("price");
  expect(JSON.stringify(result)).not.toContain("total");
});

describe("rejects", () => {
  test.each(["not json", "null", "[]", '"text"', "12"])("the body %s", (body) => {
    expect(parseOrderRequest(body).ok).toBe(false);
  });

  test.each([
    ["no items", undefined],
    ["an empty list", []],
    ["items that aren't a list", { slug: "vase" }],
    ["too many items", Array(51).fill(items[0])],
    ["no slug", [{ quantity: 1 }]],
    ["no quantity", [{ slug: "vase" }]],
    ["a quantity of zero", [{ slug: "vase", quantity: 0 }]],
    ["a negative quantity", [{ slug: "vase", quantity: -1 }]],
    ["a fractional quantity", [{ slug: "vase", quantity: 1.5 }]],
    ["a quantity as text", [{ slug: "vase", quantity: "1" }]],
    ["a huge quantity", [{ slug: "vase", quantity: 100 }]],
    ["choices that aren't text", [{ slug: "vase", quantity: 1, choices: [1] }]],
    ["an item that isn't an object", ["vase"]],
  ])("%s", (_name, items) => {
    expect(parseWith({ items }).ok).toBe(false);
  });
});
