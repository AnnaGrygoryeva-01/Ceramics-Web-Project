export const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
};

// Who's buying and where it goes. Stripe asks for these on its payment page, so
// an order has none until it's paid.
export type Customer = { name: string; email: string; address: Address };

// How long an unpaid order holds its stock. Stripe's payment page expires after
// 30 minutes, which cancels the order; the extra minutes cover a late message
// from Stripe, so a piece is never sold twice. An order still pending after this
// (Stripe's message never came) stops holding anything.
export const PENDING_HOLD_MS = 35 * 60 * 1000;

// What Stripe tells us once an order is paid. Amounts in pence.
export type Payment = { customer: Customer; shipping: number; total: number };

// What a customer asks for. Items name products by slug, as the cart does, and
// carry no prices: those always come from the product files.
export type OrderRequestItem = { slug: string; quantity: number; choices: string[] };
export type OrderRequest = { items: OrderRequestItem[] };

// One pick of a set, e.g. "Small", and the product whose stock it uses up
export type OrderPick = { choice: string; productSlug: string };

// Products live in JSON files rather than the database, so lines name them by
// slug. Name and price are copied too, so later edits don't change past orders.
export type OrderLine = {
  productSlug: string;
  productName: string;
  unitPrice: number; // in pence
  quantity: number;
  picks: OrderPick[];
};

export type StockDemand = { productSlug: string; quantity: number };

// How many of each product there are in the files, by slug
export type StockLimits = Record<string, number>;

export type PricedOrder = {
  lines: OrderLine[];
  total: number; // in pence, the items only. Delivery is added once it's paid.
  stockDemand: StockDemand[]; // What the order uses up, one entry per product, checked against the stock in the files
};

export type NewOrder = PricedOrder & { id: string; createdAt: Date };

export type Order = Omit<NewOrder, "stockDemand"> & { status: OrderStatus };

// The short reference customers see, e.g. "C8A187B4": the start of the order's id
export const orderReference = (orderId: string) => orderId.slice(0, 8).toUpperCase();

export type OrderFailure =
  | { ok: false; code: "invalid-order"; message: string }
  | { ok: false; code: "out-of-stock"; message: string; outOfStock: string[] }; // Short slugs
