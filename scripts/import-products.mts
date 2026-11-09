// Puts a collection's products from a JSON file into the database:
//   npm run db:import -- christmas-collection src/data/products/christmas-collection.json
// Reads DATABASE_URL and DATABASE_TOKEN from .env. Safe to run again: products
// already there are updated by slug, but their stock is left alone.
import { readFileSync } from "node:fs";
import { createDatabase } from "@/server/adapters/libsql/client";
import { importProducts, type ProductFileEntry } from "@/server/adapters/libsql/import-products";

const [collection, file] = process.argv.slice(2);
if (!collection || !file) {
  console.error("Usage: npm run db:import -- <collection-slug> <file.json>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example)");
  process.exit(1);
}

const entries: ProductFileEntry[] = JSON.parse(readFileSync(file, "utf8"));
const db = createDatabase({ url, authToken: process.env.DATABASE_TOKEN || undefined });

try {
  const { created, updated } = await importProducts(db, collection, entries);
  console.log(`${collection}: ${created} added, ${updated} updated`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  db.$client.close();
}
