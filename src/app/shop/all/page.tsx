import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import SortedProductList from "@/components/SortedProductList";
import type { Collection, Product } from "@/lib/products";
import { getCatalogue } from "@/server/catalogue";

export const metadata: Metadata = { title: "Shop All" };

// Every product, taking one from each collection in turn so the "Featured" order
// is a mix rather than one collection after another
function mixCollections(collections: Collection[], products: Product[]) {
  const lists = collections.map((c) => products.filter((p) => p.collection === c.slug));
  const longest = Math.max(...lists.map((list) => list.length));
  return Array.from({ length: longest }, (_, i) => lists.flatMap((list) => list[i] ?? [])).flat();
}

export default function ShopAllPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ShopAll />
    </Suspense>
  );
}

async function ShopAll() {
  const catalogue = await getCatalogue();
  const [collections, stored] = await Promise.all([catalogue.listCollections(), catalogue.listProducts()]);
  const products = mixCollections(collections, stored);

  // Same layout as a collection page (--count: see .collection in globals.sass)
  return (
    <div className="collection collection--all" style={{ "--count": products.length } as CSSProperties}>
      <Link href="/shop">&larr; Back to shop</Link>
      <h1>Shop All</h1>
      <p>A mix of everything we make: ceramics from every collection, plus our Petrykivka brushes.</p>
      <SortedProductList products={products} collections={collections} />
    </div>
  );
}
