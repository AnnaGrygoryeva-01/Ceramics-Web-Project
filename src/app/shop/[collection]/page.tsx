import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import BrushCare from "@/components/BrushCare";
import SnowBackground from "@/components/SnowBackground";
import SortedProductList from "@/components/SortedProductList";
import { hasSnow } from "@/lib/products";
import { getCatalogue } from "@/server/catalogue";

export async function generateMetadata({
  params,
}: PageProps<"/shop/[collection]">): Promise<Metadata> {
  const { collection } = await params;
  const catalogue = await getCatalogue();
  return { title: (await catalogue.getCollection(collection))?.name ?? "Not found" };
}

// Reading the URL (params) and the catalogue has to happen inside <Suspense> so
// navigations can start instantly. Links here use `prefetch`, so the content is
// usually ready before the click.
export default function CollectionPage({ params }: PageProps<"/shop/[collection]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Collection params={params} />
    </Suspense>
  );
}

async function Collection({ params }: Pick<PageProps<"/shop/[collection]">, "params">) {
  const { collection: slug } = await params;
  const catalogue = await getCatalogue();
  const collection = await catalogue.getCollection(slug);
  if (!collection) notFound();

  const products = await catalogue.listProducts({ collection: collection.slug });

  // --count lets the section narrow to fit when there are fewer products than fit in a row
  return (
    <div className={`collection collection--${collection.slug}`} style={{ "--count": products.length } as CSSProperties}>
      {hasSnow(collection) && <SnowBackground />}
      <Link href="/shop">&larr; Back to shop</Link>
      <header className="collection__header">
        <h1>{collection.name}</h1>
        <p>{collection.description}</p>
      </header>
      <SortedProductList products={products} />
      {collection.slug === "brushes" && <BrushCare />}
    </div>
  );
}
