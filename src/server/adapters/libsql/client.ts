import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

export type DatabaseConfig = { url: string; authToken?: string };

export type Database = ReturnType<typeof createDatabase>;

// Takes its settings as arguments and never reads env, so nothing can reach the
// real database by accident. Don't set the client's busy `timeout`: on a local file
// it blocks the event loop, so the write being waited for can never finish.
export function createDatabase({ url, authToken }: DatabaseConfig) {
  return drizzle({ client: createClient({ url, authToken }) });
}
