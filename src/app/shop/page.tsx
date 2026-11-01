import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CollectionCards from "@/components/CollectionCards";
import { getCatalogue } from "@/server/catalogue";

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

      <Suspense fallback={<p>Loading…</p>}>
        <Collections />
      </Suspense>
    </>
  );
}

async function Collections() {
  const catalogue = await getCatalogue();
  return <CollectionCards collections={await catalogue.listCollections()} />;
}
