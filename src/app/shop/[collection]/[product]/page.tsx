import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImage from "@/components/ProductImage";
import SnowBackground from "@/components/SnowBackground";
import { formatPrice, hasSnow } from "@/lib/products";
import { getCatalogue } from "@/server/catalogue";

export async function generateMetadata({
  params,
}: PageProps<"/shop/[collection]/[product]">): Promise<Metadata> {
  const { product } = await params;
  const catalogue = await getCatalogue();
  return { title: (await catalogue.getProduct(product))?.name ?? "Not found" };
}

// Reading the URL (params) and the database has to happen inside <Suspense> so
// navigations can start instantly. Links here use `prefetch`, so the content is
// usually ready before the click.
export default function ProductPage({ params }: PageProps<"/shop/[collection]/[product]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: Pick<PageProps<"/shop/[collection]/[product]">, "params">) {
  const { collection: collectionSlug, product: productSlug } = await params;
  const catalogue = await getCatalogue();
  const [product, collection] = await Promise.all([
    catalogue.getProduct(productSlug),
    catalogue.getCollection(collectionSlug),
  ]);
  if (!product || !collection || product.collection !== collection.slug) notFound();

  return (
    <article>
      {hasSnow(collection) && <SnowBackground />}
      <Link href={`/shop/${collection.slug}`} prefetch>&larr; Back to {collection.name}</Link>
      <ProductImage product={product} sizes="(max-width: 480px) 100vw, 420px" className="product-image--large" priority />
      <h1>{product.name}</h1>
      <p>{formatPrice(product.price)}</p>
      <p>{product.description}</p>
      {/* Sets have no stock of their own, it depends on the brushes picked */}
      {!product.options && <p>{product.stock ? `${product.stock} in stock` : "Sold out"}</p>}
      <AddToCartButton product={product} />
    </article>
  );
}
