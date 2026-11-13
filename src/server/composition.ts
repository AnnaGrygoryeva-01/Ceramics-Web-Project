import "server-only";
import { catalogueFiles } from "@/data/catalogue";
import shippingRates from "@/data/shipping.json";
import { createJsonCatalogueReader } from "./adapters/json/catalogue-reader";
import { createDatabase } from "./adapters/libsql/client";
import { createOrderStore } from "./adapters/libsql/order-store";
import { createStripeGateway } from "./adapters/stripe/payment-gateway";

// The catalogue comes from the JSON files, so browsing the shop needs no database
export const catalogueReader = createJsonCatalogueReader(catalogueFiles);

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let orderStore: ReturnType<typeof createOrderStore> | undefined;

// Orders, and the stock they hold. On its own so the shop pages can show stock
// without Stripe's keys.
export function getOrderStore() {
  orderStore ??= createOrderStore(
    createDatabase({ url: required("DATABASE_URL"), authToken: process.env.DATABASE_TOKEN || undefined }),
  );
  return orderStore;
}

function createServices() {
  const payments = createStripeGateway({
    secretKey: required("STRIPE_SECRET_KEY"),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  });
  const publishableKey = required("STRIPE_PUBLISHABLE_KEY");
  return { catalogueReader, orderStore: getOrderStore(), payments, shippingRates, publishableKey };
}

let services: ReturnType<typeof createServices> | undefined;

// Plugs the adapters into the ports. Reads env on first use rather than on
// import, so `next build` works without a database or Stripe keys.
export function getServices() {
  services ??= createServices();
  return services;
}
