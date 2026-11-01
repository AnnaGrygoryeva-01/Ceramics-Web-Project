import type { Collection, Product } from "../domain/catalogue";

export interface CatalogueReader {
  listCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;
  listProducts(filter?: { collection?: string }): Promise<Product[]>; // Filter by collection slug
  getProduct(slug: string): Promise<Product | null>;
}
