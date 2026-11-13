import type { OrderRequest, OrderRequestItem } from "../../domain/order";

type ParseResult = { ok: true; request: OrderRequest } | { ok: false; message: string };

const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
// exist is priceOrder's job. Any prices in the body are ignored, and so is
// anything about the customer: Stripe asks for that when they pay.
export function parseOrderRequest(body: string): ParseResult {
  const data = parseJson(body);
  if (!isObject(data)) return { ok: false, message: "The request is not valid JSON." };

  const { items } = data;
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return { ok: false, message: `An order needs between 1 and ${MAX_ITEMS} items.` };
  }

  const parsed = items.map(parseItem);
  if (parsed.includes(null)) return { ok: false, message: "Each item needs a slug and a quantity." };

  return { ok: true, request: { items: parsed as OrderRequestItem[] } };
}
