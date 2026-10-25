import type { Metadata } from "next";
import Link from "next/link";
import { collections } from "@/lib/products";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <>
      <h1>Shop</h1>
      <section>
        <h2>
          <Link href="/shop/all" prefetch>Shop All</Link>
        </h2>
        <p>A mix of everything from every collection</p>
      </section>
      {collections.map((collection) => (
        <section key={collection.slug}>
          <h2>
            <Link href={`/shop/${collection.slug}`} prefetch>{collection.name}</Link>
          </h2>
          <p>{collection.description}</p>
        </section>
      ))}
    </>
  );
}
