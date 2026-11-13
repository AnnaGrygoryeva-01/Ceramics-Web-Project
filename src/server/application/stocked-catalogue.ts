import type { Product } from "../domain/catalogue";
import type { StockLimits } from "../domain/order";
import type { CatalogueReader } from "../ports/catalogue";

// The catalogue as customers see it: the stock in the files, less what orders
// hold, so a sold piece shows as sold out. Held stock is read once, on first use.
// If it can't be read the files' stock is shown, and checkout still refuses
// anything already taken.
export function createStockedCatalogue(
  reader: CatalogueReader,
  readHeld: () => Promise<StockLimits>,
): CatalogueReader {
  let held: Promise<StockLimits> | undefined;
  const getHeld = () =>
    (held ??= readHeld().catch((error): StockLimits => {
      console.error("Couldn't read held stock, showing the stock in the files", error);
      return {};
    }));

  async function withStock(product: Product): Promise<Product>;
  async function withStock(product: Product | null): Promise<Product | null>;
  async function withStock(product: Product | null) {
    if (product?.stock === undefined) return product;
    const taken = (await getHeld())[product.slug] ?? 0;
    return taken > 0 ? { ...product, stock: Math.max(0, product.stock - taken) } : product;
  }

  return {
    listCollections: () => reader.listCollections(),
    getCollection: (slug) => reader.getCollection(slug),
    async listProducts(filter) {
      return Promise.all((await reader.listProducts(filter)).map((p) => withStock(p)));
    },
    async getProduct(slug) {
      return withStock(await reader.getProduct(slug));
    },
  };
}
