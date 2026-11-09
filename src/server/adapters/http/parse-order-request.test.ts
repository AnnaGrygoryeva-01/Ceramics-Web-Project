import { describe, expect, test } from "vitest";
import { parseOrderRequest } from "./parse-order-request";

const customer = {
  name: "Ada Potter",
  email: "ada@example.com",
  address: { line1: "1 Kiln Lane", city: "Stoke", postcode: "ST1 1AA", country: "United Kingdom" },
};
const items = [{ slug: "vase", quantity: 1 }];

const parse = (body: unknown) => parseOrderRequest(JSON.stringify(body));
const parseWith = (changes: object) => parse({ customer, items, ...changes });

test("accepts a valid order, tidying the text and defaulting choices", () => {
  const result = parseWith({ customer: { ...customer, name: "  Ada   Potter " } });
  expect(result).toMatchObject({
    ok: true,
    request: { customer: { name: "Ada Potter" }, items: [{ slug: "vase", quantity: 1, choices: [] }] },
  });
});

test("keeps the choices of a set", () => {
  const result = parseWith({ items: [{ slug: "brush-set", quantity: 2, choices: ["Small", "Large"] }] });
  expect(result).toMatchObject({ ok: true, request: { items: [{ quantity: 2, choices: ["Small", "Large"] }] } });
});

test("drops anything it doesn't know, such as a price from the client", () => {
  const result = parseWith({ total: 1, items: [{ slug: "vase", quantity: 1, price: 1 }] });
  expect(result).toEqual(expect.objectContaining({ ok: true }));
  expect(JSON.stringify(result)).not.toContain("price");
  expect(JSON.stringify(result)).not.toContain("total");
});

describe("rejects", () => {
  test.each(["not json", "null", "[]", '"text"', "12"])("the body %s", (body) => {
    expect(parseOrderRequest(body).ok).toBe(false);
  });

  test.each([
    ["no customer", { customer: undefined }],
    ["a missing name", { customer: { ...customer, name: " " } }],
    ["a long name", { customer: { ...customer, name: "a".repeat(101) } }],
    ["a bad email", { customer: { ...customer, email: "ada" } }],
    ["no address", { customer: { ...customer, address: undefined } }],
    ["a missing city", { customer: { ...customer, address: { ...customer.address, city: "" } } }],
    ["a long second address line", { customer: { ...customer, address: { ...customer.address, line2: "a".repeat(201) } } }],
  ])("%s", (_name, changes) => {
    expect(parseWith(changes).ok).toBe(false);
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
