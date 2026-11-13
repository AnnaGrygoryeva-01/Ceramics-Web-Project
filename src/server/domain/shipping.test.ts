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
  notDelivered: ["JE", "GY", "IM"],
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
  const price = (postcode: string, subtotal = 2000) => {
    const quote = shippingFor(rates, postcode, subtotal);
    return quote.ok ? quote.rate.price : quote.reason;
  };

  test("most of the UK pays the standard price", () => {
    expect(shippingFor(rates, "M11 4HZ", 2000)).toEqual({ ok: true, rate: { name: "UK", price: 495 } });
  });

  test("a whole area, or a range of its districts, can cost more", () => {
    expect(shippingFor(rates, "BT1 5GS", 2000)).toEqual({ ok: true, rate: { name: "Northern Ireland", price: 895 } });
    expect(price("HS1 2AA")).toBe(995);
    expect(price("PA20 1AA")).toBe(995);
    expect(price("PA49 1AA")).toBe(995);
    expect(price("PA19 1AA")).toBe(495);
    expect(price("PA50 1AA")).toBe(495);
  });

  test("free from £30, wherever it goes", () => {
    expect(price("M11 4HZ", 2999)).toBe(495);
    expect(price("M11 4HZ", 3000)).toBe(0);
    expect(price("HS1 2AA", 3000)).toBe(0);
  });

  test("nothing for a postcode that isn't a UK one", () => {
    expect(price("75001")).toBe("not-a-uk-postcode");
  });

  test("nothing for an area that isn't delivered to, even when free", () => {
    expect(price("JE2 3AB")).toBe("not-delivered");
    expect(price("GY1 1AA", 5000)).toBe("not-delivered");
    expect(price("IM1 1AA")).toBe("not-delivered");
  });
});

describe("the rates in src/data/shipping.json", () => {
  test("one price for the whole UK, free from £30", () => {
    for (const postcode of ["M11 4HZ", "BT1 5GS", "HS1 2AA", "ZE1 0AA", "TR21 0AA"]) {
      expect(shippingFor(shippingJson, postcode, 2000)).toEqual({ ok: true, rate: { name: "UK delivery", price: 495 } });
    }
    expect(shippingFor(shippingJson, "M11 4HZ", 3000)).toMatchObject({ ok: true, rate: { price: 0 } });
  });

  test("nothing to Jersey, Guernsey or the Isle of Man", () => {
    for (const postcode of ["JE2 3AB", "GY1 1AA", "IM1 1AA"]) {
      expect(shippingFor(shippingJson, postcode, 2000)).toEqual({ ok: false, reason: "not-delivered" });
    }
  });
});

test("checkShippingRates explains what's wrong", () => {
  const broken = {
    freeFrom: 30.5,
    standard: { name: "UK", price: -1 },
    zones: [{ name: "Highlands", price: 995, postcodes: ["PA49-20", "Highlands"] }],
    notDelivered: ["Jersey"],
  };
  expect(checkShippingRates(broken)).toEqual([
    "freeFrom must be whole pence",
    "UK: price must be whole pence",
    'Highlands: "PA49-20" should look like "BT" or "PA20-49"',
    'Highlands: "Highlands" should look like "BT" or "PA20-49"',
    'notDelivered: "Jersey" should look like "BT" or "PA20-49"',
  ]);
});
