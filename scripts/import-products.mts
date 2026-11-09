// Puts products from the JSON files in src/data/products into the database. Each
// file is one collection, named after its slug (christmas-collection.json):
//   npm run db:import                          every file
//   npm run db:import -- christmas-collection  just that one
// Reads DATABASE_URL and DATABASE_TOKEN from .env. Safe to run again: products
// already there are updated by slug, but their stock is left alone.
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { createDatabase } from "@/server/adapters/libsql/client";
import { importProducts, type ProductFileEntry } from "@/server/adapters/libsql/import-products";

const DATA_DIR = "src/data/products";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example)");
  process.exit(1);
}

const available = readdirSync(DATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => basename(file, ".json"));
const requested = process.argv.slice(2);
const unknown = requested.filter((slug) => !available.includes(slug));
if (unknown.length > 0) {
  console.error(`No file for: ${unknown.join(", ")}. There are: ${available.join(", ")}`);
  process.exit(1);
}

const db = createDatabase({ url, authToken: process.env.DATABASE_TOKEN || undefined });

try {
  for (const collection of requested.length > 0 ? requested : available) {
    const entries: ProductFileEntry[] = JSON.parse(readFileSync(join(DATA_DIR, `${collection}.json`), "utf8"));
    const { created, updated } = await importProducts(db, collection, entries);
    console.log(`${collection}: ${created} added, ${updated} updated`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  db.$client.close();
}
