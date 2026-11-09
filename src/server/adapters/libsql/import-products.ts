import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { Database } from "./client";
import { collections, productOptionValues, products } from "./schema";

// What a file in src/data/products holds: one collection's products. A product
// either has its own stock, or variants: one-of-a-kind pieces with a photo and
// stock each, which the customer picks from.
export type ProductFileEntry = {
  slug: string;
  name: string;
  price: number; // in pence
  description: string;
  image?: string;
  stock?: number;
  variants?: { slug: string; label: string; image?: string; stock: number }[];
};

// The id is added when the row is written: kept for an existing slug, new otherwise
type ProductRow = Omit<typeof products.$inferInsert, "id">;

const PIECE_LABEL = "Piece";

// Why the file can't be imported, if it can't
export function checkProductFile(entries: ProductFileEntry[]) {
  const problems: string[] = [];
  const slugs = entries.flatMap((p) => [p.slug, ...(p.variants ?? []).map((v) => v.slug)]);
  for (const slug of new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))) {
    problems.push(`"${slug}" is used more than once`);
  }
  for (const p of entries) {
    if (!Number.isInteger(p.price) || p.price <= 0) problems.push(`${p.slug}: price must be whole pence above 0`);
    const variants = p.variants ?? [];
    if (variants.length === 0 && !Number.isInteger(p.stock)) problems.push(`${p.slug}: needs a stock or variants`);
    if (variants.length > 0 && p.stock !== undefined) problems.push(`${p.slug}: stock goes on the variants`);
    for (const v of variants) {
      if (!Number.isInteger(v.stock) || v.stock < 0) problems.push(`${v.slug}: stock must be 0 or more`);
      if (/[|,]/.test(v.label)) problems.push(`${v.slug}: label can't contain | or , (cart keys use them)`);
    }
  }
  return problems;
}

// The rows for one entry. Several variants become hidden products, one per piece,
// picked through a single option; a lone variant is just the product's stock.
function toRows(entry: ProductFileEntry, collectionId: string, position: number) {
  const { slug, name, price, description } = entry;
  const variants = entry.variants ?? [];
  const product = { slug, collectionId, name, pricePence: price, description, position };

  if (variants.length <= 1) {
    const [only] = variants;
    const row: ProductRow = { ...product, image: only?.image ?? entry.image, stock: only?.stock ?? entry.stock };
    return { rows: [row], pieces: [] };
  }

  const rows: ProductRow[] = [
    { ...product, image: entry.image ?? variants[0].image, stock: null, optionLabel: PIECE_LABEL, optionCount: 1 },
    ...variants.map((v) => ({
      ...product,
      slug: v.slug,
      name: `${name}, ${v.label}`,
      image: v.image,
      stock: v.stock,
      hidden: true,
    })),
  ];
  return { rows, pieces: variants.map((v) => ({ name: v.label, slug: v.slug })) };
}

// Adds a collection's products, or updates the ones already there (matched by
// slug, so ids and past orders stay intact). Stock is only set on new products:
// in the database it goes down with every order, so the file would undo sales.
export async function importProducts(db: Database, collectionSlug: string, entries: ProductFileEntry[]) {
  const problems = checkProductFile(entries);
  if (problems.length > 0) throw new Error(`Can't import:\n- ${problems.join("\n- ")}`);

  return db.transaction(async (tx) => {
    const [collection] = await tx.select().from(collections).where(eq(collections.slug, collectionSlug));
    if (!collection) throw new Error(`There is no collection "${collectionSlug}" in the database.`);

    const planned = entries.map((entry, i) => ({ entry, ...toRows(entry, collection.id, i) }));
    const existing = await tx
      .select({ id: products.id, slug: products.slug, collectionId: products.collectionId })
      .from(products)
      .where(inArray(products.slug, planned.flatMap((p) => p.rows.map((r) => r.slug))));

    const elsewhere = existing.filter((row) => row.collectionId !== collection.id);
    if (elsewhere.length > 0) {
      throw new Error(`Already in another collection: ${elsewhere.map((row) => row.slug).join(", ")}`);
    }

    const idBySlug = new Map(existing.map((row) => [row.slug, row.id]));
    let created = 0;

    for (const { entry, rows, pieces } of planned) {
      for (const row of rows) {
        const id = idBySlug.get(row.slug);
        if (id) {
          const update = { optionLabel: null, optionCount: null, hidden: false, ...row };
          delete update.stock;
          await tx.update(products).set(update).where(eq(products.id, id));
        } else {
          const newId = randomUUID();
          idBySlug.set(row.slug, newId);
          await tx.insert(products).values({ ...row, id: newId });
          created++;
        }
      }

      const productId = idBySlug.get(entry.slug)!;
      await tx.delete(productOptionValues).where(eq(productOptionValues.productId, productId));
      if (pieces.length > 0) {
        await tx.insert(productOptionValues).values(
          pieces.map(({ name, slug }, position) => ({ productId, name, targetProductId: idBySlug.get(slug)!, position })),
        );
      }
    }

    return { created, updated: existing.length };
  });
}
