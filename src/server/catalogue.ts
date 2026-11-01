import { connection } from "next/server";
import { getServices } from "./composition";

// How pages and GET routes reach the catalogue. connection() has to come first: it
// stops `next build` here, so builds need no database and stock is never frozen
// into the build output. Pages must call this inside <Suspense>.
export async function getCatalogue() {
  await connection();
  return getServices().catalogueReader;
}
