import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { formatPrice, getCollection, getProduct, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ collection: p.collection, product: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[collection]/[product]">): Promise<Metadata> {
  const { product } = await params;
  return { title: getProduct(product)?.name ?? "Not found" };
}

export default async function ProductPage({ params }: PageProps<"/shop/[collection]/[product]">) {
  const { collection: collectionSlug, product: productSlug } = await params;
  const product = getProduct(productSlug);
  const collection = getCollection(collectionSlug);
  if (!product || !collection || product.collection !== collection.slug) notFound();

  return (
    <article>
      <Link href={`/shop/${collection.slug}`}>&larr; Back to {collection.name}</Link>
      <h1>{product.name}</h1>
      <p>{formatPrice(product.price)}</p>
      <p>{product.description}</p>
      <p>{product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</p>
      <AddToCartButton product={product} />
    </article>
  );
}
