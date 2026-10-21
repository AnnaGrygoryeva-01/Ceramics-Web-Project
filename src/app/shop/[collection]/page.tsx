import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SnowBackground from "@/components/SnowBackground";
import SortedProductList from "@/components/SortedProductList";
import { collections, getCollection, getCollectionProducts } from "@/lib/products";

export function generateStaticParams() {
  return collections.map((c) => ({ collection: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[collection]">): Promise<Metadata> {
  const { collection } = await params;
  return { title: getCollection(collection)?.name ?? "Not found" };
}

// Reading the URL (params) has to happen inside <Suspense> so navigations can start
// instantly. Links here use `prefetch`, so the content is usually ready before the click.
export default function CollectionPage({ params }: PageProps<"/shop/[collection]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Collection params={params} />
    </Suspense>
  );
}

async function Collection({ params }: Pick<PageProps<"/shop/[collection]">, "params">) {
  const { collection: slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  return (
    <>
      {collection.snow && <SnowBackground />}
      <Link href="/shop">&larr; Back to shop</Link>
      <h1>{collection.name}</h1>
      <p>{collection.description}</p>
      <SortedProductList products={getCollectionProducts(collection.slug)} />
    </>
  );
}
