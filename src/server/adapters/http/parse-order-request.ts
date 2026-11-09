import type { Address, Customer, OrderRequest, OrderRequestItem } from "../../domain/order";

type ParseResult = { ok: true; request: OrderRequest } | { ok: false; message: string };

const MAX_LENGTH = { name: 100, email: 254, address: 200 };
const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const tidy = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

const fits = (value: string, max: number) => value !== "" && value.length <= max;

function parseAddress(value: unknown): Address | null {
  if (!isObject(value)) return null;
  const [line1, city, postcode, country] = [value.line1, value.city, value.postcode, value.country].map(tidy);
  const line2 = tidy(value.line2);

  const required = [line1, city, postcode, country];
  if (!required.every((field) => fits(field, MAX_LENGTH.address))) return null;
  if (line2.length > MAX_LENGTH.address) return null;
  return { line1, line2: line2 || undefined, city, postcode, country };
}

function parseCustomer(value: unknown): Customer | null {
  if (!isObject(value)) return null;
  const name = tidy(value.name);
  const email = tidy(value.email);
  const address = parseAddress(value.address);

  if (!fits(name, MAX_LENGTH.name) || !address) return null;
  if (!fits(email, MAX_LENGTH.email) || !/^\S+@\S+\.\S+$/.test(email)) return null;
  return { name, email, address };
}

function parseItem(value: unknown): OrderRequestItem | null {
  if (!isObject(value)) return null;
  const { slug, quantity, choices = [] } = value;

  if (typeof slug !== "string" || slug === "") return null;
  if (typeof quantity !== "number" || !Number.isInteger(quantity)) return null;
  if (quantity < 1 || quantity > MAX_QUANTITY) return null;
  if (!Array.isArray(choices) || !choices.every((choice) => typeof choice === "string")) return null;
  return { slug, quantity, choices };
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

// Whether the body has the right shape. Whether the products and choices actually
// exist is priceOrder's job. Any prices in the body are ignored.
export function parseOrderRequest(body: string): ParseResult {
  const data = parseJson(body);
  if (!isObject(data)) return { ok: false, message: "The request is not valid JSON." };

  const customer = parseCustomer(data.customer);
  if (!customer) return { ok: false, message: "Please give a valid name, email and address." };

  const { items } = data;
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return { ok: false, message: `An order needs between 1 and ${MAX_ITEMS} items.` };
  }

  const parsed = items.map(parseItem);
  if (parsed.includes(null)) return { ok: false, message: "Each item needs a slug and a quantity." };

  return { ok: true, request: { customer, items: parsed as OrderRequestItem[] } };
}
