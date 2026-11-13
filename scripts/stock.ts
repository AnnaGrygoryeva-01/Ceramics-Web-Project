// `npm run stock`: what's left of everything, from the stock in the product
// files and the orders in the database. Only reads, never changes anything.
import { catalogueFiles } from "@/data/catalogue";
import { createJsonCatalogueReader } from "@/server/adapters/json/catalogue-reader";
import { createDatabase } from "@/server/adapters/libsql/client";
import { createOrderStore } from "@/server/adapters/libsql/order-store";
import { formatStockReport, stockReport } from "@/server/application/stock-report";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set, add it to .env");

  const catalogue = createJsonCatalogueReader(catalogueFiles);
  const orders = createOrderStore(createDatabase({ url, authToken: process.env.DATABASE_TOKEN || undefined }));
  const [collections, products, held] = await Promise.all([
    catalogue.listCollections(),
    catalogue.listProducts({ includeHidden: true }),
    orders.heldStockByStatus(),
  ]);

  console.log(formatStockReport(stockReport(collections, products, held)));
}

main().catch((error) => {
  console.error(`stock: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
