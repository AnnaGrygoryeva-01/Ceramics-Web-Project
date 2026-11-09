import type { Collection, Product } from "../../domain/catalogue";
import type { collections, products } from "./schema";

type CollectionRow = typeof collections.$inferSelect;
type ProductRow = typeof products.$inferSelect;

export function toCollection(row: CollectionRow): Collection {
  const { id, slug, name, description, image } = row;
  return { id, slug, name, description, image: image ?? undefined };
}

// collectionSlug and optionValues live in other tables, so the caller joins them in
export function toProduct(
  row: ProductRow,
  collectionSlug: string,
  optionValues: Record<string, string>,
): Product {
  const { id, slug, name, description, optionLabel, optionCount } = row;
  return {
    id,
    slug,
    collection: collectionSlug,
    name,
    price: row.pricePence,
    description,
    stock: row.stock ?? undefined,
    image: row.image ?? undefined,
    hidden: row.hidden || undefined,
    options:
      optionLabel !== null && optionCount !== null
        ? { label: optionLabel, count: optionCount, values: optionValues }
        : undefined,
  };
}
