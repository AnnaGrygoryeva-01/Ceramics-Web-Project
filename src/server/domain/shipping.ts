// Delivery is UK only. Couriers charge by area rather than distance: one price
// for most of the UK, more for the Scottish Highlands, the islands and Northern
// Ireland. Orders of `freeFrom` or more go free. Prices in pence.
export type ShippingRate = { name: string; price: number };

export type ShippingZone = ShippingRate & {
  // Postcode areas, e.g. "BT" for all of Northern Ireland, or an area with a
  // range of districts, e.g. "PA20-49" for PA20 to PA49
  postcodes: string[];
};

export type ShippingRates = { freeFrom: number; standard: ShippingRate; zones: ShippingZone[] };

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

// What delivery to a postcode costs for an order of `subtotal`, or null for a
// postcode that isn't a UK one
export function shippingFor(rates: ShippingRates, postcode: string, subtotal: number): ShippingRate | null {
  const parsed = parsePostcode(postcode);
  if (!parsed) return null;
  const rate = rates.zones.find((zone) => zone.postcodes.some((p) => inArea(parsed, p))) ?? rates.standard;
  return { name: rate.name, price: subtotal >= rates.freeFrom ? 0 : rate.price };
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
  for (const zone of rates.zones) {
    for (const pattern of zone.postcodes) {
      const [, , from, to] = AREA.exec(pattern) ?? [];
      if (!AREA.test(pattern) || Number(from) > Number(to)) {
        problems.push(`${zone.name}: "${pattern}" should look like "BT" or "PA20-49"`);
      }
    }
  }
  return problems;
}
