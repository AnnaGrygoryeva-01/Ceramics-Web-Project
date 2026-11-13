import { connection } from "next/server";
import { createStockedCatalogue } from "./application/stocked-catalogue";
import { catalogueReader, getOrderStore } from "./composition";

// How pages and GET routes reach the catalogue, with stock less what orders hold,
// so sold pieces show as sold out. connection() renders them on each request
// rather than at build time. Pages must call this inside <Suspense>.
export async function getCatalogue() {
  await connection();
  return createStockedCatalogue(catalogueReader, () => getOrderStore().heldStock());
}
