import { and, asc, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { CatalogueReader } from "../../ports/catalogue";
import type { Database } from "./client";
import { toCollection, toProduct } from "./rows";
import { collections, productOptionValues, products } from "./schema";

// Option name -> slug of the product it uses up, grouped by the id of the set
async function selectOptionValues(db: Database, productIds: string[]) {
  const grouped = new Map<string, Record<string, string>>();
  if (productIds.length === 0) return grouped;

  const target = alias(products, "target");
  const rows = await db
    .select({ productId: productOptionValues.productId, name: productOptionValues.name, slug: target.slug })
    .from(productOptionValues)
    .innerJoin(target, eq(productOptionValues.targetProductId, target.id))
    .where(inArray(productOptionValues.productId, productIds))
    .orderBy(asc(productOptionValues.position));

  for (const { productId, name, slug } of rows) {
    grouped.set(productId, { ...grouped.get(productId), [name]: slug });
  }
  return grouped;
}

async function selectProducts(db: Database, where?: SQL) {
  const rows = await db
    .select({ product: products, collectionSlug: collections.slug })
    .from(products)
    .innerJoin(collections, eq(products.collectionId, collections.id))
    .where(where)
    .orderBy(asc(products.position));

  const withOptions = rows.filter((row) => row.product.optionCount !== null);
  const optionValues = await selectOptionValues(db, withOptions.map((row) => row.product.id));

  return rows.map(({ product, collectionSlug }) =>
    toProduct(product, collectionSlug, optionValues.get(product.id) ?? {}),
  );
}

export function createCatalogueReader(db: Database): CatalogueReader {
  return {
    async listCollections() {
      const rows = await db.select().from(collections).orderBy(asc(collections.position));
      return rows.map(toCollection);
    },

    async getCollection(slug) {
      const [row] = await db.select().from(collections).where(eq(collections.slug, slug));
      return row ? toCollection(row) : null;
    },

    listProducts(filter) {
      return selectProducts(
        db,
        and(
          filter?.collection ? eq(collections.slug, filter.collection) : undefined,
          filter?.includeHidden ? undefined : or(isNull(products.hidden), eq(products.hidden, false)),
        ),
      );
    },

    async getProduct(slug) {
      const [product] = await selectProducts(db, eq(products.slug, slug));
      return product ?? null;
    },
  };
}
