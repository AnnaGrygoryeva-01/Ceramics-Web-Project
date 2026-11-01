export const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
};

export type Customer = { name: string; email: string; address: Address };

// What a customer asks for. Items name products by slug, as the cart does, and
// carry no prices: those always come from the database.
export type OrderRequestItem = { slug: string; quantity: number; choices: string[] };
export type OrderRequest = { customer: Customer; items: OrderRequestItem[] };

// One pick of a set, e.g. "Small", and the product whose stock it uses up
export type OrderPick = { choice: string; productId: string };

// Name and price are copied from the product, so later edits don't change past orders
export type OrderLine = {
  productId: string;
  productName: string;
  unitPrice: number; // in pence
  quantity: number;
  picks: OrderPick[];
};

export type StockDemand = { productId: string; quantity: number };

export type PricedOrder = {
  customer: Customer;
  lines: OrderLine[];
  total: number; // in pence
  stockDemand: StockDemand[]; // What the order uses up, one entry per product
};

export type NewOrder = PricedOrder & { id: string; createdAt: Date };

export type Order = Omit<NewOrder, "stockDemand"> & { status: OrderStatus };

export type OrderFailure =
  | { ok: false; code: "invalid-order"; message: string }
  | { ok: false; code: "out-of-stock"; message: string; outOfStock: string[] }; // Short slugs
