import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import SortedProductList from "@/components/SortedProductList";
import { collections, getCollectionProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Shop All" };

// Every product, taking one from each collection in turn so the "Featured" order
// is a mix rather than one collection after another
const products = (() => {
  const lists = collections.map((c) => getCollectionProducts(c.slug));
  const longest = Math.max(...lists.map((list) => list.length));
  return Array.from({ length: longest }, (_, i) => lists.flatMap((list) => list[i] ?? []));
})().flat();

export default function ShopAllPage() {
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
