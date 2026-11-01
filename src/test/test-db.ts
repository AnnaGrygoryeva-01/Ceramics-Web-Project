import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase, type Database } from "@/server/adapters/libsql/client";
import { collections, productOptionValues, products } from "@/server/adapters/libsql/schema";
import { fixtureCollections, fixtureProducts } from "./fixtures";

let schemaSql: string | undefined;

// There are no migration files, so ask drizzle-kit for the CREATE statements. Only
// this command is safe here: it needs no database or credentials. Never run push.
function readSchemaSql() {
  schemaSql ??= execFileSync(
    "npx",
    ["drizzle-kit", "export", "--dialect=turso", "--schema=./src/server/adapters/libsql/schema.ts"],
    { encoding: "utf8" },
  );
  if (!schemaSql.includes("CREATE TABLE")) throw new Error(`Unexpected schema output: ${schemaSql}`);
  return schemaSql;
}

// A real database in a temporary file, so tests never touch DATABASE_URL
export async function createTestDb() {
  const directory = mkdtempSync(join(tmpdir(), "ceramics-test-"));
  const db = createDatabase({ url: `file:${join(directory, "test.db")}` });
  await db.$client.executeMultiple(readSchemaSql());

  return {
    db,
    cleanup() {
      db.$client.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

const collectionId = (slug: string) => fixtureCollections.find((c) => c.slug === slug)!.id;
const productId = (slug: string) => fixtureProducts.find((p) => p.slug === slug)!.id;

export async function seedFixtures(db: Database) {
  await db.insert(collections).values(fixtureCollections.map((collection, position) => ({ ...collection, position })));

  await db.insert(products).values(
    fixtureProducts.map(({ collection, price, options, ...product }, position) => ({
      ...product,
      collectionId: collectionId(collection),
      pricePence: price,
      optionLabel: options?.label,
      optionCount: options?.count,
      position,
    })),
  );

  await db.insert(productOptionValues).values(
    fixtureProducts.flatMap(({ id, options }) =>
      Object.entries(options?.values ?? {}).map(([name, target], position) => ({
        productId: id,
        name,
        targetProductId: productId(target),
        position,
      })),
    ),
  );
}
