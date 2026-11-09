import type { Collection, Product } from "../domain/catalogue";

export interface CatalogueReader {
  listCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;
  // Filter by collection slug. Hidden products (pieces) are left out unless asked for.
  listProducts(filter?: { collection?: string; includeHidden?: boolean }): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
}
