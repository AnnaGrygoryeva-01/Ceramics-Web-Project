import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { PieceChoiceProvider } from "@/components/PieceChoice";
import ProductPhotos from "@/components/ProductPhotos";
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

// Reading the URL (params) and the catalogue has to happen inside <Suspense> so
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
  // A piece is reached through its product's page
  if (!product || product.hidden || !collection || product.collection !== collection.slug) notFound();

  return (
    <article className={`product-page product-page--${collection.slug}`}>
      {hasSnow(collection) && <SnowBackground />}
      <Link href={`/shop/${collection.slug}`} prefetch>&larr; Back to {collection.name}</Link>
      {/* Photos on the left, the rest on the right; one above the other on phones.
          In the middle of the page, below the back link (see .product-page) */}
      <div className="product">
        <PieceChoiceProvider>
          <div className="product__photos">
            <ProductPhotos product={product} sizes="(max-width: 700px) 100vw, 420px" priority />
          </div>
          <div className="product__details">
            <h1>{product.name}</h1>
            <p className="product__price">{formatPrice(product.price)}</p>
            <p>{product.description}</p>
            {/* Sets and pieces have no stock of their own, it depends on what's picked */}
            {!product.options && <p>{product.stock ? `${product.stock} in stock` : "Sold out"}</p>}
            <AddToCartButton product={product} />
          </div>
        </PieceChoiceProvider>
      </div>
    </article>
  );
}
