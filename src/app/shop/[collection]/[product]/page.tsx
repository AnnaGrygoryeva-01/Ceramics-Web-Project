import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImage from "@/components/ProductImage";
import SnowBackground from "@/components/SnowBackground";
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

// Reading the URL (params) has to happen inside <Suspense> so navigations can start
// instantly. Links here use `prefetch`, so the content is usually ready before the click.
export default function ProductPage({ params }: PageProps<"/shop/[collection]/[product]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: Pick<PageProps<"/shop/[collection]/[product]">, "params">) {
  const { collection: collectionSlug, product: productSlug } = await params;
  const product = getProduct(productSlug);
  const collection = getCollection(collectionSlug);
  if (!product || !collection || product.collection !== collection.slug) notFound();

  return (
    <article>
      {collection.snow && <SnowBackground />}
      <Link href={`/shop/${collection.slug}`} prefetch>&larr; Back to {collection.name}</Link>
      <ProductImage product={product} sizes="(max-width: 480px) 100vw, 420px" className="product-image--large" priority />
      <h1>{product.name}</h1>
      <p>{formatPrice(product.price)}</p>
      <p>{product.description}</p>
      <p>{product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</p>
      <AddToCartButton product={product} />
    </article>
  );
}
