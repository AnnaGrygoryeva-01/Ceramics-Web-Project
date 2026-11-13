// Delivery is UK only, at one price (Royal Mail charges the same to every UK
// address). Zones can charge some areas more, and `notDelivered` areas get
// nothing: Jersey, Guernsey and the Isle of Man, which need customs forms. Orders
// of `freeFrom` or more go free. Prices in pence.
export type ShippingRate = { name: string; price: number };

export type ShippingZone = ShippingRate & {
  // Postcode areas, e.g. "BT" for all of Northern Ireland, or an area with a
  // range of districts, e.g. "PA20-49" for PA20 to PA49
  postcodes: string[];
};

export type ShippingRates = {
  freeFrom: number;
  standard: ShippingRate;
  zones: ShippingZone[];
  notDelivered: string[]; // Postcode areas, written like a zone's
};

export type ShippingQuote =
  | { ok: true; rate: ShippingRate }
  | { ok: false; reason: "not-a-uk-postcode" | "not-delivered" };

const POSTCODE = /^([A-Z]{1,2})(\d{1,2})[A-Z]?\d[A-Z]{2}$/;
const AREA = /^([A-Z]{1,2})(?:(\d{1,2})-(\d{1,2}))?$/;

// The area letters and district number of a UK postcode, e.g. "PA", 23 for
// "pa23 8aa", or null if it isn't one
export function parsePostcode(postcode: string) {
  const match = POSTCODE.exec(postcode.toUpperCase().replace(/\s+/g, ""));
  return match ? { area: match[1], district: Number(match[2]) } : null;
}

function inArea(postcode: { area: string; district: number }, pattern: string) {
  const [, area, from, to] = AREA.exec(pattern) ?? [];
  if (area !== postcode.area) return false;
  return from === undefined || (postcode.district >= Number(from) && postcode.district <= Number(to));
}

// What delivery to a postcode costs for an order of `subtotal`, or why there's none
export function shippingFor(rates: ShippingRates, postcode: string, subtotal: number): ShippingQuote {
  const parsed = parsePostcode(postcode);
  if (!parsed) return { ok: false, reason: "not-a-uk-postcode" };
  if (rates.notDelivered.some((p) => inArea(parsed, p))) return { ok: false, reason: "not-delivered" };
  const rate = rates.zones.find((zone) => zone.postcodes.some((p) => inArea(parsed, p))) ?? rates.standard;
  return { ok: true, rate: { name: rate.name, price: subtotal >= rates.freeFrom ? 0 : rate.price } };
}

const isPence = (price: unknown) => Number.isInteger(price) && (price as number) >= 0;

// Why the rates can't be used, if they can't. Checked by the tests, so mistakes
// in shipping.json show up before a deploy.
export function checkShippingRates(rates: ShippingRates) {
  const problems: string[] = [];
  if (!isPence(rates.freeFrom)) problems.push("freeFrom must be whole pence");
  for (const rate of [rates.standard, ...rates.zones]) {
    if (!isPence(rate.price)) problems.push(`${rate.name}: price must be whole pence`);
  }
  const lists = [...rates.zones.map((z) => [z.name, z.postcodes] as const), ["notDelivered", rates.notDelivered] as const];
  for (const [name, postcodes] of lists) {
    for (const pattern of postcodes) {
      const [, , from, to] = AREA.exec(pattern) ?? [];
      if (!AREA.test(pattern) || Number(from) > Number(to)) {
        problems.push(`${name}: "${pattern}" should look like "BT" or "PA20-49"`);
      }
    }
  }
  return problems;
}
