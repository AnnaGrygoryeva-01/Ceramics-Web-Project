import { describe, expect, test } from "vitest";
import shippingJson from "@/data/shipping.json";
import { checkShippingRates, parsePostcode, shippingFor, type ShippingRates } from "./shipping";

const rates: ShippingRates = {
  freeFrom: 3000,
  standard: { name: "UK", price: 495 },
  zones: [
    { name: "Highlands", price: 995, postcodes: ["HS", "PA20-49"] },
    { name: "Northern Ireland", price: 895, postcodes: ["BT"] },
  ],
};

test("the rates in src/data/shipping.json can be used", () => {
  expect(checkShippingRates(shippingJson)).toEqual([]);
});

describe("parsePostcode", () => {
  test.each([
    ["M11 4HZ", "M", 11],
    ["sw1a 1aa", "SW", 1],
    ["PA238AA", "PA", 23],
    ["  bt1   5gs ", "BT", 1],
  ])("%s", (postcode, area, district) => {
    expect(parsePostcode(postcode)).toEqual({ area, district });
  });

  test.each(["", "hello", "M11", "M11 4H", "12345", "M11 4HZZ"])("rejects %j", (postcode) => {
    expect(parsePostcode(postcode)).toBeNull();
  });
});

describe("shippingFor", () => {
  test("most of the UK pays the standard price", () => {
    expect(shippingFor(rates, "M11 4HZ", 2000)).toEqual({ name: "UK", price: 495 });
  });

  test("a whole area, or a range of its districts, can cost more", () => {
    expect(shippingFor(rates, "BT1 5GS", 2000)).toEqual({ name: "Northern Ireland", price: 895 });
    expect(shippingFor(rates, "HS1 2AA", 2000)?.price).toBe(995);
    expect(shippingFor(rates, "PA20 1AA", 2000)?.price).toBe(995);
    expect(shippingFor(rates, "PA49 1AA", 2000)?.price).toBe(995);
    expect(shippingFor(rates, "PA19 1AA", 2000)?.price).toBe(495);
    expect(shippingFor(rates, "PA50 1AA", 2000)?.price).toBe(495);
  });

  test("free from £30, wherever it goes", () => {
    expect(shippingFor(rates, "M11 4HZ", 2999)?.price).toBe(495);
    expect(shippingFor(rates, "M11 4HZ", 3000)).toEqual({ name: "UK", price: 0 });
    expect(shippingFor(rates, "HS1 2AA", 3000)?.price).toBe(0);
  });

  test("nothing for a postcode that isn't a UK one", () => {
    expect(shippingFor(rates, "75001", 2000)).toBeNull();
  });
});

test("checkShippingRates explains what's wrong", () => {
  const broken = {
    freeFrom: 30.5,
    standard: { name: "UK", price: -1 },
    zones: [{ name: "Highlands", price: 995, postcodes: ["PA49-20", "Highlands"] }],
  };
  expect(checkShippingRates(broken)).toEqual([
    "freeFrom must be whole pence",
    "UK: price must be whole pence",
    'Highlands: "PA49-20" should look like "BT" or "PA20-49"',
    'Highlands: "Highlands" should look like "BT" or "PA20-49"',
  ]);
});
