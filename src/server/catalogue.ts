import { connection } from "next/server";
import { catalogueReader } from "./composition";

// How pages and GET routes reach the catalogue. connection() renders them on each
// request rather than at build time. Pages must call this inside <Suspense>.
export async function getCatalogue() {
  await connection();
  return catalogueReader;
}
