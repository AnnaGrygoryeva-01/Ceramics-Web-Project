import "server-only";
import { createCatalogueReader } from "./adapters/libsql/catalogue-reader";
import { createDatabase } from "./adapters/libsql/client";
import { createOrderStore } from "./adapters/libsql/order-store";

function createServices() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const db = createDatabase({ url, authToken: process.env.DATABASE_TOKEN || undefined });
  return { catalogueReader: createCatalogueReader(db), orderStore: createOrderStore(db) };
}

let services: ReturnType<typeof createServices> | undefined;

// Plugs the database adapters into the ports. Reads env on first use rather than
// on import, so `next build` works without a database.
export function getServices() {
  services ??= createServices();
  return services;
}
