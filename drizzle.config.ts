import { defineConfig } from "drizzle-kit";
import { getTableName, is, Table } from "drizzle-orm";
import * as schema from "./src/server/adapters/libsql/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Schema changes go through `npm run db:push`, there are no migration files. The
// filter hides every table outside schema.ts from push, which would otherwise try
// to drop them. Never pass --force: it skips the data-loss prompts.
export default defineConfig({
  dialect: "turso",
  schema: "./src/server/adapters/libsql/schema.ts",
  dbCredentials: { url, authToken: process.env.DATABASE_TOKEN || undefined },
  verbose: true,
  tablesFilter: Object.values(schema)
    .filter((value) => is(value, Table))
    .map((table) => getTableName(table)),
});
