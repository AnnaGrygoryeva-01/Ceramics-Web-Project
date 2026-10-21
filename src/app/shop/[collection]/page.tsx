import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import SnowBackground from "@/components/SnowBackground";
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

export default async function CollectionPage({ params }: PageProps<"/shop/[collection]">) {
  const { collection: slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  return (
    <>
      {collection.snow && <SnowBackground />}
      <Link href="/shop">&larr; Back to shop</Link>
      <h1>{collection.name}</h1>
      <p>{collection.description}</p>
      {getCollectionProducts(collection.slug).map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </>
  );
}
