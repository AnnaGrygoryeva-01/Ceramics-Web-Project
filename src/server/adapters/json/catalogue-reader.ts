import type { Collection, Product, ProductOptions } from "../../domain/catalogue";
import type { CatalogueReader } from "../../ports/catalogue";

// What a file in src/data/products holds: one collection's products, in the order
// they're shown. A product has its own stock, or options (a set that uses up the
// stock of the products picked for it), or variants: one-of-a-kind pieces with a
// photo and stock each, which the customer picks from.
export type ProductFileEntry = {
  slug: string;
  name: string;
  price: number; // in pence
  description: string;
  image?: string;
  stock?: number;
  options?: ProductOptions;
  variants?: { slug: string; label: string; image?: string; stock: number }[];
};

export type CatalogueFiles = {
  collections: Collection[];
  products: Record<string, ProductFileEntry[]>; // Collection slug -> its file
};

const PIECE_LABEL = "Piece";

// Why the files can't be used, if they can't. Checked by the tests, so mistakes
// show up before a deploy.
export function checkCatalogue({ collections, products }: CatalogueFiles) {
  const problems: string[] = [];
  const entries = Object.values(products).flat();
  const slugs = entries.flatMap((p) => [p.slug, ...(p.variants ?? []).map((v) => v.slug)]);
  for (const slug of new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))) {
    problems.push(`"${slug}" is used more than once`);
  }
  for (const collection of Object.keys(products)) {
    if (!collections.some((c) => c.slug === collection)) problems.push(`${collection}: no such collection`);
  }
  for (const p of entries) {
    if (!Number.isInteger(p.price) || p.price <= 0) problems.push(`${p.slug}: price must be whole pence above 0`);
    if (p.options) {
      if (p.stock !== undefined) problems.push(`${p.slug}: a set has no stock of its own`);
      for (const slug of Object.values(p.options.values)) {
        const target = entries.find((e) => e.slug === slug);
        if (!Number.isInteger(target?.stock)) problems.push(`${p.slug}: option "${slug}" needs a product with stock`);
      }
    } else if (p.variants && p.variants.length > 0) {
      if (p.stock !== undefined) problems.push(`${p.slug}: stock goes on the variants`);
      for (const v of p.variants) {
        if (!Number.isInteger(v.stock) || v.stock < 0) problems.push(`${v.slug}: stock must be 0 or more`);
        if (/[|,]/.test(v.label)) problems.push(`${v.slug}: label can't contain | or , (cart keys use them)`);
      }
    } else if (!Number.isInteger(p.stock) || p.stock! < 0) {
      problems.push(`${p.slug}: needs a stock of 0 or more, options or variants`);
    }
  }
  return problems;
}

// One entry as products. Several variants become hidden products, one per piece,
// picked through a single option; a lone variant is just the product's stock.
function toProducts(entry: ProductFileEntry, collection: string): Product[] {
  const { slug, name, price, description, options } = entry;
  const variants = entry.variants ?? [];
  const product = { slug, collection, name, price, description };

  if (options) return [{ ...product, image: entry.image, options }];

  if (variants.length <= 1) {
    const [only] = variants;
    return [{ ...product, image: only?.image ?? entry.image, stock: only?.stock ?? entry.stock }];
  }

  return [
    {
      ...product,
      image: entry.image ?? variants[0].image,
      options: { label: PIECE_LABEL, count: 1, values: Object.fromEntries(variants.map((v) => [v.label, v.slug])) },
    },
    ...variants.map((v) => ({
      ...product,
      slug: v.slug,
      name: `${name}, ${v.label}`,
      image: v.image,
      stock: v.stock,
      hidden: true,
    })),
  ];
}

// Drops keys that are undefined, so products compare equal however they were built
const tidy = (product: Product) =>
  Object.fromEntries(Object.entries(product).filter(([, value]) => value !== undefined)) as Product;

// The catalogue from the JSON files. They're read once, at build time: changing a
// product means editing its file and deploying again.
export function createJsonCatalogueReader(files: CatalogueFiles): CatalogueReader {
  const { collections } = files;
  // Collection by collection, in the order of collections.json
  const products = collections.flatMap((c) =>
    (files.products[c.slug] ?? []).flatMap((entry) => toProducts(entry, c.slug)).map(tidy),
  );

  return {
    async listCollections() {
      return collections;
    },

    async getCollection(slug) {
      return collections.find((c) => c.slug === slug) ?? null;
    },

    async listProducts(filter) {
      return products.filter(
        (p) => (!filter?.collection || p.collection === filter.collection) && (filter?.includeHidden || !p.hidden),
      );
    },

    async getProduct(slug) {
      return products.find((p) => p.slug === slug) ?? null;
    },
  };
}
